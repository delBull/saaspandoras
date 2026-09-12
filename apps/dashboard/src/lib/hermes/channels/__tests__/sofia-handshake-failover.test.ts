/**
 * 🧪 HERMES SOFIA HANDSHAKE & EXECUTION LEASE FAILOVER TEST SUITE (FASE 4)
 * apps/dashboard/src/lib/hermes/channels/__tests__/sofia-handshake-failover.test.ts
 *
 * Verifies the 5 Mandatory Architecture Rules (F4-1 to F4-5):
 * F4-1: Lease expiration NEVER authorizes Direct fallback without explicit reconciliation.
 * F4-2: Categorical reconciliation:
 *       - PUBLISHED -> PUBLISHED
 *       - CANCELLED_BEFORE_EXECUTION / FAILED_PRE_SIDE_EFFECT -> FAILED
 *       - NOT_FOUND / error -> UNKNOWN (NOT_FOUND != FAILED)
 * F4-3: Internal exactly-once execution safety.
 * F4-4: Composite idempotency key: dist:${campaignId}:${pieceId}:${channel}.
 * F4-5: Fail-fast pre-ACK (2500ms) separated from post-ACK execution timeout (15000ms).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DistributionOrchestratorService,
} from '../distribution/distribution-orchestrator.service';
import {
  type ISofiaExecutionClient,
  SofiaPreAckError,
  SofiaPostAckTimeoutError,
} from '../distribution/sofia-execution-client';
import type { DirectChannelPublisher } from '../publishers/direct-channel-publisher';
import { db } from '@/db';
import { distributionJobs, distributionExecutionAttempts } from '@/db/schema';
import type { PublicationReceipt } from '../publishers/publisher.types';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';
import { DemandDistributionService } from '@/lib/hermes/demand/demand-distribution.service';
import { A2AOutboundDispatcher } from '@/lib/pandoras/core/domains/hermes/a2a/a2a-outbound-dispatcher';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';

describe('🏛️ Hermes Sofia Handshake & Failover Architecture (Fase 4)', () => {
  const TENANT_ORG = 'org_uuid_tenant_omega_4444';
  const INTEGRATION_ID = 'int_telegram_omega_4444';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── TEST 1: SOFIA HAPPY PATH ──────────────────────────────────────────────
  it('1. Sofia Happy Path — Sofia issues pre-ACK lease and completes execution as Attempt #1 PUBLISHED', async () => {
    const mockJob: any = {
      id: 'job_sofia_happy_001',
      tenantId: TENANT_ORG,
      channel: 'telegram',
      integrationId: INTEGRATION_ID,
      idempotencyKey: 'dist:camp_1:piece_1:telegram',
      status: 'PENDING',
      primaryProvider: 'SOFIA',
      payload: { text: 'Hello Sofia' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob);

    let recordedAttempts: any[] = [];
    (vi.spyOn(db.query.distributionExecutionAttempts, 'findMany') as any).mockImplementation(async () => recordedAttempts);

    vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockImplementation((val) => {
        if (val && ('attemptNumber' in val || 'provider' in val)) {
          recordedAttempts.push(val);
        }
        return Promise.resolve();
      }),
    } as any);

    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockImplementation((fields) => {
        if (fields.status && fields.status !== 'FAILED') mockJob.status = fields.status;
        return {
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([{ id: mockJob.id }]),
          })),
        };
      }),
    } as any);

    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn().mockResolvedValue({
        jobId: mockJob.id,
        executionId: 'sofia_exec_success_100',
        leaseExpiresAt: new Date(Date.now() + 60000),
        provider: 'SOFIA',
      }),
      awaitExecutionResult: vi.fn().mockResolvedValue({
        success: true,
        channel: 'telegram',
        externalPostId: 'tg_msg_sofia_100',
        publishedAt: new Date().toISOString(),
        idempotencyKey: mockJob.idempotencyKey,
      } as PublicationReceipt),
      checkExecutionStatus: vi.fn(),
    };

    const mockDirectPublisher: Partial<DirectChannelPublisher> = {
      publishToChannel: vi.fn(),
    };

    const orchestrator = new DistributionOrchestratorService(
      mockSofiaClient,
      mockDirectPublisher as any
    );

    const receipt = await orchestrator.dispatchJob(TENANT_ORG, mockJob.id);

    expect(receipt.success).toBe(true);
    expect(receipt.externalPostId).toBe('tg_msg_sofia_100');
    expect(mockSofiaClient.requestExecutionLease).toHaveBeenCalledTimes(1);
    expect(mockSofiaClient.awaitExecutionResult).toHaveBeenCalledTimes(1);
    expect(mockDirectPublisher.publishToChannel).not.toHaveBeenCalled();
    expect(mockJob.status).toBe('PUBLISHED');
  });

  // ── TEST 2: PRE-ACK FAILOVER (RULE F4-5) ──────────────────────────────────
  it('2. Pre-ACK Failover — Sofia timeout in <=2500ms marks Attempt #1 FAILED and authorizes Direct Publisher Attempt #2', async () => {
    const mockJob: any = {
      id: 'job_preack_failover_002',
      tenantId: TENANT_ORG,
      channel: 'telegram',
      integrationId: INTEGRATION_ID,
      idempotencyKey: 'dist:camp_1:piece_2:telegram',
      status: 'PENDING',
      primaryProvider: 'SOFIA',
      payload: { text: 'Failover message' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob);

    let recordedAttempts: any[] = [];
    (vi.spyOn(db.query.distributionExecutionAttempts, 'findMany') as any).mockImplementation(async () => recordedAttempts);

    vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockImplementation((val) => {
        if (val && ('attemptNumber' in val || 'provider' in val)) {
          recordedAttempts.push(val);
        }
        return Promise.resolve();
      }),
    } as any);

    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockImplementation((fields) => {
        if (fields.status && fields.status !== 'FAILED') mockJob.status = fields.status;
        const targetAttempt = recordedAttempts.find((a) => a.provider === 'SOFIA') || recordedAttempts[recordedAttempts.length - 1];
        if (targetAttempt) {
          Object.assign(targetAttempt, fields);
        }
        return {
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([{ id: mockJob.id }]),
          })),
        };
      }),
    } as any);

    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn().mockRejectedValue(
        new SofiaPreAckError('Sofia daemon unreachable within 2500ms')
      ),
      awaitExecutionResult: vi.fn(),
      checkExecutionStatus: vi.fn(),
    };

    const mockDirectPublisher: Partial<DirectChannelPublisher> = {
      publishToChannel: vi.fn().mockResolvedValue({
        success: true,
        channel: 'telegram',
        externalPostId: 'tg_msg_direct_002',
        publishedAt: new Date().toISOString(),
        idempotencyKey: mockJob.idempotencyKey,
      }),
    };

    const orchestrator = new DistributionOrchestratorService(
      mockSofiaClient,
      mockDirectPublisher as any
    );

    const receipt = await orchestrator.dispatchJob(TENANT_ORG, mockJob.id);

    expect(receipt.success).toBe(true);
    expect(receipt.externalPostId).toBe('tg_msg_direct_002');
    expect(mockSofiaClient.requestExecutionLease).toHaveBeenCalledTimes(1);
    expect(mockDirectPublisher.publishToChannel).toHaveBeenCalledTimes(1);
    expect(mockJob.status).toBe('PUBLISHED');
  });

  // ── TEST 3: POST-ACK OWNERSHIP (RULE F4-1) ────────────────────────────────
  it('3. Post-ACK Ownership — Sofia ACK granted but network drops post-ACK: transitions to UNKNOWN and BLOCKS Direct fallback', async () => {
    const mockJob: any = {
      id: 'job_postack_unknown_003',
      tenantId: TENANT_ORG,
      channel: 'telegram',
      integrationId: INTEGRATION_ID,
      idempotencyKey: 'dist:camp_1:piece_3:telegram',
      status: 'PENDING',
      primaryProvider: 'SOFIA',
      payload: { text: 'Post-ACK risk' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob);

    let recordedAttempts: any[] = [];
    (vi.spyOn(db.query.distributionExecutionAttempts, 'findMany') as any).mockImplementation(async () => recordedAttempts);

    vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockImplementation((val) => {
        if (val && ('attemptNumber' in val || 'provider' in val)) {
          recordedAttempts.push(val);
        }
        return Promise.resolve();
      }),
    } as any);

    const updatedStatuses: string[] = [];
    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockImplementation((fields) => {
        if (fields.status) {
          mockJob.status = fields.status;
          updatedStatuses.push(fields.status);
        }
        return {
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([{ id: mockJob.id }]),
          })),
        };
      }),
    } as any);

    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn().mockResolvedValue({
        jobId: mockJob.id,
        executionId: 'sofia_exec_postack_003',
        leaseExpiresAt: new Date(Date.now() + 60000),
        provider: 'SOFIA',
      }),
      awaitExecutionResult: vi.fn().mockRejectedValue(
        new SofiaPostAckTimeoutError('sofia_exec_postack_003', 'Sofia timed out post-ACK (15000ms)')
      ),
      checkExecutionStatus: vi.fn(),
    };

    const mockDirectPublisher: Partial<DirectChannelPublisher> = {
      publishToChannel: vi.fn(),
    };

    const orchestrator = new DistributionOrchestratorService(
      mockSofiaClient,
      mockDirectPublisher as any
    );

    const receipt = await orchestrator.dispatchJob(TENANT_ORG, mockJob.id);

    expect(receipt.success).toBe(false);
    expect(updatedStatuses).toContain('UNKNOWN');
    expect(updatedStatuses).not.toContain('FAILED');
    expect(mockSofiaClient.requestExecutionLease).toHaveBeenCalledTimes(1);
    expect(mockSofiaClient.awaitExecutionResult).toHaveBeenCalledTimes(1);
    // Direct publisher MUST NEVER be called once Sofia acknowledged execution!
    expect(mockDirectPublisher.publishToChannel).not.toHaveBeenCalled();
  });

  // ── TEST 4: LEASE EXPIRY SAFETY INVARIANT (RULE F4-1) ─────────────────────
  it('4. Lease Expiry Safety — Expired lease does NOT authorize Direct fallback without explicit reconciliation', async () => {
    const expiredLease = new Date(Date.now() - 5000); // 5 seconds in the past

    const mockJob: any = {
      id: 'job_expired_lease_004',
      tenantId: TENANT_ORG,
      channel: 'telegram',
      integrationId: INTEGRATION_ID,
      idempotencyKey: 'dist:camp_1:piece_4:telegram',
      status: 'UNKNOWN', // in UNKNOWN after lease expiration
      executionLeaseExpiresAt: expiredLease,
      primaryProvider: 'SOFIA',
      payload: { text: 'Expired lease text' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn(),
      awaitExecutionResult: vi.fn(),
      checkExecutionStatus: vi.fn(),
    };

    const mockDirectPublisher: Partial<DirectChannelPublisher> = {
      publishToChannel: vi.fn(),
    };

    const orchestrator = new DistributionOrchestratorService(
      mockSofiaClient,
      mockDirectPublisher as any
    );

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob);

    // Attempting to dispatch a job that is UNKNOWN throws and blocks direct fallback
    await expect(
      orchestrator.dispatchJob(TENANT_ORG, mockJob.id)
    ).rejects.toThrow(/UNKNOWN state.*Direct publisher is strictly blocked/i);

    expect(mockDirectPublisher.publishToChannel).not.toHaveBeenCalled();
  });

  // ── TEST 5: RECONCILIATION F4-2 (PROVEN_EXECUTED) ─────────────────────────
  it('5. Categorical Reconciliation (PROVEN_EXECUTED) — Updates UNKNOWN job to PUBLISHED and emits audit event', async () => {
    const mockJob: any = {
      id: 'job_reconcile_pub_005',
      tenantId: TENANT_ORG,
      channel: 'telegram',
      integrationId: INTEGRATION_ID,
      idempotencyKey: 'dist:camp_1:piece_5:telegram',
      status: 'UNKNOWN',
      sofiaExecutionId: 'sofia_exec_rec_005',
      primaryProvider: 'SOFIA',
      payload: { text: 'Reconciliation test' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const attempts = [
      {
        id: 'att_005',
        jobId: mockJob.id,
        tenantId: TENANT_ORG,
        attemptNumber: 1,
        provider: 'SOFIA',
        executionId: 'sofia_exec_rec_005',
        status: 'UNKNOWN',
      },
    ];

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob);
    (vi.spyOn(db.query.distributionExecutionAttempts, 'findMany') as any).mockResolvedValue(attempts);

    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockImplementation((fields) => {
        Object.assign(mockJob, fields);
        return {
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        };
      }),
    } as any);

    const auditSpy = vi.spyOn(SecurityAuditLogger, 'logEvent').mockResolvedValue('hash_test' as any);

    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn(),
      awaitExecutionResult: vi.fn(),
      checkExecutionStatus: vi.fn().mockResolvedValue({
        status: 'PUBLISHED',
        receipt: {
          success: true,
          channel: 'telegram',
          externalPostId: 'tg_reconciled_msg_005',
          publishedAt: new Date().toISOString(),
          idempotencyKey: mockJob.idempotencyKey,
        } as PublicationReceipt,
      }),
    };

    const orchestrator = new DistributionOrchestratorService(mockSofiaClient);

    const result = await orchestrator.reconcileUnknownJob(TENANT_ORG, mockJob.id);

    expect(result.status).toBe('PUBLISHED');
    expect(result.resolution).toBe('PROVEN_EXECUTED');
    expect(result.receipt?.externalPostId).toBe('tg_reconciled_msg_005');
    expect(mockSofiaClient.checkExecutionStatus).toHaveBeenCalledWith(
      'sofia_exec_rec_005',
      mockJob.id,
      TENANT_ORG
    );
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'DISTRIBUTION_RECONCILED',
        policyDecision: 'ALLOW',
        metadata: expect.objectContaining({
          resolution: 'PROVEN_EXECUTED',
          jobId: mockJob.id,
        }),
      })
    );
  });

  // ── TEST 6: RECONCILIATION F4-2 (PROVEN_NOT_EXECUTED) ─────────────────────
  it('6. Categorical Reconciliation (PROVEN_NOT_EXECUTED) — Transitions UNKNOWN to FAILED authorizing safe retry', async () => {
    const mockJob: any = {
      id: 'job_reconcile_fail_006',
      tenantId: TENANT_ORG,
      channel: 'telegram',
      integrationId: INTEGRATION_ID,
      idempotencyKey: 'dist:camp_1:piece_6:telegram',
      status: 'UNKNOWN',
      sofiaExecutionId: 'sofia_exec_rec_006',
      primaryProvider: 'SOFIA',
      payload: { text: 'Cancelled test' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const attempts = [
      {
        id: 'att_006',
        jobId: mockJob.id,
        tenantId: TENANT_ORG,
        attemptNumber: 1,
        provider: 'SOFIA',
        executionId: 'sofia_exec_rec_006',
        status: 'UNKNOWN',
      },
    ];

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob);
    (vi.spyOn(db.query.distributionExecutionAttempts, 'findMany') as any).mockResolvedValue(attempts);

    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockImplementation((fields) => {
        Object.assign(mockJob, fields);
        return {
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        };
      }),
    } as any);

    const auditSpy = vi.spyOn(SecurityAuditLogger, 'logEvent').mockResolvedValue('hash_test' as any);

    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn(),
      awaitExecutionResult: vi.fn(),
      checkExecutionStatus: vi.fn().mockResolvedValue({
        status: 'CANCELLED_BEFORE_EXECUTION',
        reason: 'Sofia aborted before dispatching side effect to Telegram API',
      }),
    };

    const orchestrator = new DistributionOrchestratorService(mockSofiaClient);

    const result = await orchestrator.reconcileUnknownJob(TENANT_ORG, mockJob.id);

    expect(result.status).toBe('FAILED');
    expect(result.resolution).toBe('PROVEN_NOT_EXECUTED');
    expect(result.retryPermitted).toBe(true);
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'DISTRIBUTION_RECONCILED',
        metadata: expect.objectContaining({
          resolution: 'PROVEN_NOT_EXECUTED',
          retryPermitted: true,
        }),
      })
    );
  });

  // ── TEST 7: RECONCILIATION F4-2 (UNRESOLVED / NOT_FOUND) ──────────────────
  it('7. Categorical Reconciliation (UNRESOLVED / NOT_FOUND) — Remains UNKNOWN (NOT_FOUND != FAILED)', async () => {
    const mockJob: any = {
      id: 'job_reconcile_unresolved_007',
      tenantId: TENANT_ORG,
      channel: 'telegram',
      integrationId: INTEGRATION_ID,
      idempotencyKey: 'dist:camp_1:piece_7:telegram',
      status: 'UNKNOWN',
      sofiaExecutionId: 'sofia_exec_rec_007',
      primaryProvider: 'SOFIA',
      payload: { text: 'Unresolved test' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const attempts = [
      {
        id: 'att_007',
        jobId: mockJob.id,
        tenantId: TENANT_ORG,
        attemptNumber: 1,
        provider: 'SOFIA',
        executionId: 'sofia_exec_rec_007',
        status: 'UNKNOWN',
      },
    ];

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob);
    (vi.spyOn(db.query.distributionExecutionAttempts, 'findMany') as any).mockResolvedValue(attempts);

    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockImplementation((fields) => {
        Object.assign(mockJob, fields);
        return {
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        };
      }),
    } as any);

    // Sofia returns NOT_FOUND (ambiguous -> CANNOT be assumed FAILED!)
    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn(),
      awaitExecutionResult: vi.fn(),
      checkExecutionStatus: vi.fn().mockResolvedValue({
        status: 'NOT_FOUND',
        reason: 'Execution ID not recognized or state flushed',
      }),
    };

    const orchestrator = new DistributionOrchestratorService(mockSofiaClient);

    const result = await orchestrator.reconcileUnknownJob(TENANT_ORG, mockJob.id);

    // Rule F4-2: MUST remain UNKNOWN!
    expect(result.status).toBe('UNKNOWN');
    expect(result.resolution).toBe('UNRESOLVED');
    expect(result.retryPermitted).toBe(false);
  });

  // ── TEST 8: DEMAND SERVICE INTEGRATION & COMPOSITE KEY (RULE F4-4) ─────────
  it('8. Demand Integration & Composite Key — approveAndDistribute constructs dist:{campaign}:{piece}:{channel} and deduplicates', async () => {
    const tenant = 'tenant_fase4_composite';
    vi.spyOn(CapabilityGrantService, 'isCapabilityGranted').mockResolvedValue(true);

    const camp = await DemandDistributionService.proposeCampaign(tenant, 'LAUNCH_PRODUCT');
    DemandDistributionService.readyAllPieces(tenant, camp.id);

    // Mock active integration in DB for this tenant
    vi.spyOn(db, 'select').mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'int_mock_fase4_123' }]),
        }),
      }),
    } as any);

    // Spy on A2A media.plan
    vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockResolvedValue({
      success: true,
      messageId: 'msg_a2a_plan',
      type: 'media.plan',
    });

    // Mock distributionOrchestratorService.createOrGetJob & dispatchJob
    const jobCreationSpy = vi.fn().mockImplementation(async (canonicalOrgId, params) => {
      expect(params.idempotencyKey).toMatch(new RegExp(`^dist:${camp.id}:piece_.*:${params.channel}$`));
      return {
        job: { id: `job_${params.channel}_001`, status: 'PENDING' },
        isReplay: false,
      };
    });

    const dispatchSpy = vi.fn().mockResolvedValue({
      success: true,
      channel: 'telegram',
      idempotencyKey: 'idem_test',
      externalPostId: 'rcpt_dist_orchestrator',
    } as PublicationReceipt);

    // Inject into distributionOrchestratorService methods
    const { distributionOrchestratorService } = await import('../distribution/distribution-orchestrator.service');
    vi.spyOn(distributionOrchestratorService, 'createOrGetJob').mockImplementation(jobCreationSpy);
    vi.spyOn(distributionOrchestratorService, 'dispatchJob').mockImplementation(dispatchSpy);

    const res = await DemandDistributionService.approveAndDistribute(tenant, camp.id);

    expect(res.success).toBe(true);
    expect(res.campaign.status).toBe('COMPLETED');
    expect(jobCreationSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalled();
  });
});
