/**
 * 🧪 DISTRIBUTION STATE MACHINE & SOFIA LEASE HANDSHAKE TEST SUITE (FASE 3)
 * apps/dashboard/src/lib/hermes/channels/__tests__/distribution-state-machine.test.ts
 *
 * Verifies the 15 Acceptance Criteria:
 * 1. Concurrent approval -> exactly one DistributionJob
 * 2. Same idempotencyKey across processes -> one job
 * 3. Sofia ACK -> execution ownership persisted
 * 4. Sofia ACK + network timeout -> UNKNOWN
 * 5. UNKNOWN -> NEVER DirectPublisher automatically
 * 6. Pre-ACK connection failure -> DirectPublisher permitted
 * 7. DirectPublisher receipt -> job becomes PUBLISHED
 * 8. Sofia receipt -> job becomes PUBLISHED
 * 9. Duplicate dispatch -> existing job/receipt returned
 * 10. Invalid state transition -> rejected
 * 11. Tenant A cannot access Tenant B jobs
 * 12. PUBLISHING + retry cannot create second external publication
 * 13. Crash/retry does not create a second job
 * 14. Direct fallback permitted ONLY on pre-ACK failure
 * 15. Audit event trail recorded on critical events
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DistributionStateMachine,
  type DistributionJobStatus,
} from '../distribution/distribution-state-machine';
import {
  DistributionOrchestratorService,
  type CreateDistributionJobInput,
} from '../distribution/distribution-orchestrator.service';
import {
  type ISofiaExecutionClient,
  SofiaPreAckError,
  SofiaPostAckTimeoutError,
} from '../distribution/sofia-execution-client';
import { DirectChannelPublisher } from '../publishers/direct-channel-publisher';
import { db } from '@/db';
import { distributionJobs, distributionExecutionAttempts } from '@/db/schema';
import type { PublicationReceipt } from '../publishers/publisher.types';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';

describe('🏛️ Hermes Distribution State Machine & Execution Lease Handshake (Fase 3)', () => {
  const TENANT_A_ORG = 'org_uuid_tenant_alpha_1111';
  const TENANT_B_ORG = 'org_uuid_tenant_beta_2222';
  const INTEGRATION_ID_A = 'int_telegram_alpha_123';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── TEST 1 & 2 & 13: DURABLE IDEMPOTENCY & SINGLE JOB CREATION ──
  it('1. Durable Idempotency — Concurrent creation & retries with same idempotencyKey resolve to exactly one job', async () => {
    const existingJob = {
      id: 'job_uuid_canonical_001',
      tenantId: TENANT_A_ORG,
      campaignId: 'camp_1',
      pieceId: 'piece_1',
      channel: 'telegram',
      integrationId: INTEGRATION_ID_A,
      idempotencyKey: 'camp_1:piece_1:telegram:v1',
      status: 'PENDING',
      payload: { text: 'Hello', contentType: 'text', idempotencyKey: 'camp_1:piece_1:telegram:v1' },
      primaryProvider: 'SOFIA',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Simulate DB insert onConflictDoNothing + findFirst returning the existing record
    vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue({ rowCount: 0 }),
      }),
    } as any);

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(existingJob as any);

    const orchestrator = new DistributionOrchestratorService();
    const input: CreateDistributionJobInput = {
      campaignId: 'camp_1',
      pieceId: 'piece_1',
      channel: 'telegram',
      integrationId: INTEGRATION_ID_A,
      idempotencyKey: 'camp_1:piece_1:telegram:v1',
      payload: { text: 'Hello', contentType: 'text', idempotencyKey: 'camp_1:piece_1:telegram:v1' },
    };

    const call1 = await orchestrator.createOrGetJob(TENANT_A_ORG, input);
    const call2 = await orchestrator.createOrGetJob(TENANT_A_ORG, input);

    expect(call1.job.id).toBe('job_uuid_canonical_001');
    expect(call2.job.id).toBe('job_uuid_canonical_001');
    expect(call1.isNew).toBe(false);
    expect(call2.isNew).toBe(false);
  });

  // ── TEST 3 & 8: SOFIA LEASE ACK & RECEIPT (HAPPY PATH) ──
  it('3. Sofia Handshake — Sofia ACK persists execution ownership; receipt transitions job to PUBLISHED', async () => {
    const mockJob = {
      id: 'job_sofia_happy_01',
      tenantId: TENANT_A_ORG,
      campaignId: 'camp_1',
      pieceId: 'piece_1',
      channel: 'telegram',
      integrationId: INTEGRATION_ID_A,
      idempotencyKey: 'idem_sofia_happy',
      status: 'PENDING',
      primaryProvider: 'SOFIA',
      payload: { text: 'Hello Sofia', contentType: 'text', idempotencyKey: 'idem_sofia_happy' },
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob as any);
    vi.spyOn(db.query.distributionExecutionAttempts, 'findMany').mockResolvedValue([]);

    const insertedAttempts: any[] = [];
    vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockImplementation((val) => {
        insertedAttempts.push(val);
        return Promise.resolve();
      }),
    } as any);

    const updatedJobStatuses: string[] = [];
    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockImplementation((fields) => {
        if (fields.status) updatedJobStatuses.push(fields.status);
        return {
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        };
      }),
    } as any);

    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn().mockResolvedValue({
        jobId: mockJob.id,
        executionId: 'sofia_exec_777',
        leaseExpiresAt: new Date(Date.now() + 300000),
        provider: 'SOFIA',
      }),
      awaitExecutionResult: vi.fn().mockResolvedValue({
        success: true,
        channel: 'telegram',
        externalPostId: 'tg_msg_1001',
        externalUrl: 'https://t.me/channel/1001',
        publishedAt: new Date().toISOString(),
        idempotencyKey: 'idem_sofia_happy',
      }),
      checkExecutionStatus: vi.fn(),
    };

    const orchestrator = new DistributionOrchestratorService(mockSofiaClient);
    const receipt = await orchestrator.dispatchJob(TENANT_A_ORG, mockJob.id);

    expect(receipt.success).toBe(true);
    expect(receipt.externalPostId).toBe('tg_msg_1001');

    // Verify lease handshake occurred
    expect(mockSofiaClient.requestExecutionLease).toHaveBeenCalled();
    expect(mockSofiaClient.awaitExecutionResult).toHaveBeenCalled();

    // Verify status transitions: DISPATCHING -> ACKNOWLEDGED -> PUBLISHED
    expect(updatedJobStatuses).toContain('DISPATCHING');
    expect(updatedJobStatuses).toContain('ACKNOWLEDGED');
    expect(updatedJobStatuses).toContain('PUBLISHED');
  });

  // ── TEST 4 & 5: SOFIA POST-ACK TIMEOUT TRANSITIONS TO UNKNOWN (NEVER FALLBACK) ──
  it('4. Post-ACK Failure — Sofia ACK + network timeout transitions to UNKNOWN; Direct fallback is strictly BLOCKED', async () => {
    const mockJob = {
      id: 'job_sofia_unknown_01',
      tenantId: TENANT_A_ORG,
      campaignId: 'camp_1',
      pieceId: 'piece_1',
      channel: 'telegram',
      integrationId: INTEGRATION_ID_A,
      idempotencyKey: 'idem_sofia_timeout',
      status: 'PENDING',
      primaryProvider: 'SOFIA',
      payload: { text: 'Lost in flight', contentType: 'text', idempotencyKey: 'idem_sofia_timeout' },
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob as any);
    vi.spyOn(db.query.distributionExecutionAttempts, 'findMany').mockResolvedValue([]);
    vi.spyOn(db, 'insert').mockReturnValue({ values: vi.fn().mockResolvedValue({}) } as any);

    const updatedStatuses: string[] = [];
    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockImplementation((fields) => {
        if (fields.status) updatedStatuses.push(fields.status);
        return { where: vi.fn().mockResolvedValue({ rowCount: 1 }) };
      }),
    } as any);

    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn().mockResolvedValue({
        jobId: mockJob.id,
        executionId: 'sofia_exec_timeout_888',
        leaseExpiresAt: new Date(Date.now() + 300000),
        provider: 'SOFIA',
      }),
      awaitExecutionResult: vi.fn().mockRejectedValue(
        new SofiaPostAckTimeoutError('sofia_exec_timeout_888', 'Gateway Timeout 504')
      ),
      checkExecutionStatus: vi.fn(),
    };

    const directPublisherMock = {
      publishToChannel: vi.fn(),
    };

    const orchestrator = new DistributionOrchestratorService(mockSofiaClient, directPublisherMock as any);
    const receipt = await orchestrator.dispatchJob(TENANT_A_ORG, mockJob.id);

    // Invariant 1: Receipt reflects non-success
    expect(receipt.success).toBe(false);

    // Invariant 2: Status transitioned to UNKNOWN (NOT FAILED!)
    expect(updatedStatuses).toContain('UNKNOWN');
    expect(updatedStatuses).not.toContain('FAILED');

    // Invariant 3: Direct publisher was NEVER invoked!
    expect(directPublisherMock.publishToChannel).not.toHaveBeenCalled();

    // Invariant 4: Subsequent dispatch on UNKNOWN job throws and blocks
    mockJob.status = 'UNKNOWN';
    await expect(orchestrator.dispatchJob(TENANT_A_ORG, mockJob.id)).rejects.toThrow(
      /UNKNOWN state.*Direct publisher is strictly blocked/i
    );
  });

  // ── TEST 6 & 7: PRE-ACK FAILURE PERMITS DIRECT PUBLISHER (SOFIA NEVER LEASED) ──
  it('6. Pre-ACK Connection Failure — DirectPublisher permitted and executes as Attempt #2', async () => {
    const mockJob = {
      id: 'job_preack_fail_01',
      tenantId: TENANT_A_ORG,
      campaignId: 'camp_1',
      pieceId: 'piece_1',
      channel: 'telegram',
      integrationId: INTEGRATION_ID_A,
      idempotencyKey: 'idem_preack_fail',
      status: 'PENDING',
      primaryProvider: 'SOFIA',
      payload: { text: 'Direct rescue', contentType: 'text', idempotencyKey: 'idem_preack_fail' },
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob as any);

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
        return { where: vi.fn().mockResolvedValue({ rowCount: 1 }) };
      }),
    } as any);

    // Sofia fails BEFORE lease ACK
    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn().mockRejectedValue(
        new SofiaPreAckError('Connection refused: Mac Mini daemon offline')
      ),
      awaitExecutionResult: vi.fn(),
      checkExecutionStatus: vi.fn(),
    };

    // Direct publisher mock succeeds
    const mockDirectPublisher: Partial<DirectChannelPublisher> = {
      publishToChannel: vi.fn().mockResolvedValue({
        success: true,
        channel: 'telegram',
        externalPostId: 'direct_tg_msg_555',
        externalUrl: 'https://t.me/channel/555',
        publishedAt: new Date().toISOString(),
        idempotencyKey: 'idem_preack_fail',
      }),
    };

    const orchestrator = new DistributionOrchestratorService(
      mockSofiaClient,
      mockDirectPublisher as any
    );

    const receipt = await orchestrator.dispatchJob(TENANT_A_ORG, mockJob.id);

    expect(receipt.success).toBe(true);
    expect(receipt.externalPostId).toBe('direct_tg_msg_555');

    // Direct publisher was invoked because Sofia failed pre-ACK
    expect(mockDirectPublisher.publishToChannel).toHaveBeenCalledWith(
      TENANT_A_ORG,
      INTEGRATION_ID_A,
      mockJob.payload
    );

    // Two attempts recorded: Attempt 1 (SOFIA, FAILED) and Attempt 2 (DIRECT, DISPATCHING)
    expect(recordedAttempts).toHaveLength(2);
    expect(recordedAttempts[0].provider).toBe('SOFIA');
    expect(recordedAttempts[1].provider).toBe('DIRECT');
  });

  // ── TEST 9: DUPLICATE DISPATCH ON PUBLISHED RETURNS EXISTING RECEIPT ──
  it('9. Terminal Idempotency — Calling dispatch on already PUBLISHED job returns existing receipt', async () => {
    const publishedReceipt: PublicationReceipt = {
      success: true,
      channel: 'telegram',
      externalPostId: 'tg_done_111',
      publishedAt: '2026-09-11T12:00:00Z',
      idempotencyKey: 'idem_done',
    };

    const mockPublishedJob = {
      id: 'job_done_01',
      tenantId: TENANT_A_ORG,
      status: 'PUBLISHED',
      receipt: publishedReceipt,
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockPublishedJob as any);

    const mockSofia = { requestExecutionLease: vi.fn(), awaitExecutionResult: vi.fn(), checkExecutionStatus: vi.fn() };
    const orchestrator = new DistributionOrchestratorService(mockSofia);

    const receipt = await orchestrator.dispatchJob(TENANT_A_ORG, mockPublishedJob.id);

    expect(receipt).toEqual(publishedReceipt);
    expect(mockSofia.requestExecutionLease).not.toHaveBeenCalled();
  });

  // ── TEST 10: INVALID STATE TRANSITIONS ARE REJECTED ──
  it('10. State Transition Safety — Invalid transitions throw descriptive errors', () => {
    // UNKNOWN -> DISPATCHING is forbidden
    expect(DistributionStateMachine.canTransition('UNKNOWN', 'DISPATCHING')).toBe(false);
    expect(() => DistributionStateMachine.assertTransition('UNKNOWN', 'DISPATCHING', 'test_job')).toThrow(
      /Invalid job state transition from 'UNKNOWN' to 'DISPATCHING'/
    );

    // PUBLISHED -> FAILED is forbidden (terminal)
    expect(DistributionStateMachine.canTransition('PUBLISHED', 'FAILED')).toBe(false);
    expect(() => DistributionStateMachine.assertTransition('PUBLISHED', 'FAILED', 'test_job')).toThrow(
      /Invalid job state transition from 'PUBLISHED' to 'FAILED'/
    );

    // PENDING -> DISPATCHING is valid
    expect(DistributionStateMachine.canTransition('PENDING', 'DISPATCHING')).toBe(true);
  });

  // ── TEST 11: TENANT A CANNOT ACCESS TENANT B JOBS ──
  it('11. Multi-Tenant Boundary — Tenant A cannot dispatch or access Tenant B jobs', async () => {
    // DB returns null because tenantId filter is canonicalOrgId
    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(undefined);

    const orchestrator = new DistributionOrchestratorService();
    await expect(orchestrator.dispatchJob(TENANT_A_ORG, 'job_belonging_to_tenant_b')).rejects.toThrow(
      /not found for tenant/i
    );
  });

  // ── TEST 12: PUBLISHING + RETRY CANNOT CREATE SECOND EXTERNAL PUBLICATION ──
  it('12. In-Flight Protection — Calling dispatch on a job in PUBLISHING state throws lock error', async () => {
    const mockInFlightJob = {
      id: 'job_inflight_01',
      tenantId: TENANT_A_ORG,
      status: 'PUBLISHING',
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockInFlightJob as any);

    const orchestrator = new DistributionOrchestratorService();
    await expect(orchestrator.dispatchJob(TENANT_A_ORG, mockInFlightJob.id)).rejects.toThrow(
      /currently in PUBLISHING state\. Duplicate publication blocked/i
    );
  });

  // ── TEST 13 (P0-3): LEASE EXPIRATION FENCING INVARIANT ──
  it('13. Lease Fencing Invariant — Expired lease does NOT authorize Direct fallback without explicit reconciliation', () => {
    // Attempt with lease expired 1 hour ago
    const expiredAttempt = {
      provider: 'SOFIA' as const,
      status: 'ACKNOWLEDGED' as const,
      leaseExpiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour in the past
    };

    const check = DistributionStateMachine.canAttemptDirectFallback('ACKNOWLEDGED', [expiredAttempt]);

    // Absolute safety invariant: Sofia ACK blocks Direct fallback regardless of lease expiration
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Sofia holds execution lease');
    expect(check.reason).toContain('Expiry does not authorize fallback');
  });

  // ── TEST 14 (P0-4): DIRECT PROVIDER AMBIGUITY TRANSITIONS TO UNKNOWN ──
  it('14. Direct Provider Ambiguity — Ambiguous network timeout post-dispatch transitions to UNKNOWN (not FAILED)', async () => {
    const mockJob = {
      id: 'job_direct_timeout_01',
      tenantId: TENANT_A_ORG,
      campaignId: 'camp_1',
      pieceId: 'piece_1',
      channel: 'telegram',
      integrationId: INTEGRATION_ID_A,
      idempotencyKey: 'idem_direct_timeout',
      status: 'PENDING',
      primaryProvider: 'DIRECT',
      payload: { text: 'Direct dispatch', contentType: 'text', idempotencyKey: 'idem_direct_timeout' },
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob as any);
    vi.spyOn(db.query.distributionExecutionAttempts, 'findMany').mockResolvedValue([]);

    const updatedJobStatuses: string[] = [];
    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockImplementation((fields) => {
        if (fields.status) updatedJobStatuses.push(fields.status);
        return { where: vi.fn().mockResolvedValue({ rowCount: 1 }) };
      }),
    } as any);

    vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    } as any);

    // Direct publisher experiences network timeout (ambiguous side-effect)
    const mockDirectPublisher: Partial<DirectChannelPublisher> = {
      publishToChannel: vi.fn().mockResolvedValue({
        success: false,
        channel: 'telegram',
        idempotencyKey: 'idem_direct_timeout',
        errorCode: 'PROVIDER_NETWORK_ERROR',
        errorMessage: 'Network timeout after sending HTTP POST to Telegram API',
        retryable: true,
      }),
    };

    const orchestrator = new DistributionOrchestratorService(undefined, mockDirectPublisher as any);
    const receipt = await orchestrator.dispatchJob(TENANT_A_ORG, mockJob.id);

    expect(receipt.success).toBe(false);
    expect(receipt.retryable).toBe(false);
    expect(receipt.errorMessage).toContain('Execution transitioned to UNKNOWN');

    // Transitions: PUBLISHING -> UNKNOWN (NEVER FAILED)
    expect(updatedJobStatuses).toContain('PUBLISHING');
    expect(updatedJobStatuses).toContain('UNKNOWN');
    expect(updatedJobStatuses).not.toContain('FAILED');
  });

  // ── TEST 15 (Set 2 Obs 4): PRIMARY PROVIDER DIRECT EXECUTES DIRECTLY ──
  it('15. Primary Provider DIRECT — Directly dispatches without requiring Sofia failure', async () => {
    const mockJob = {
      id: 'job_direct_primary_01',
      tenantId: TENANT_A_ORG,
      campaignId: 'camp_1',
      pieceId: 'piece_1',
      channel: 'telegram',
      integrationId: INTEGRATION_ID_A,
      idempotencyKey: 'idem_direct_primary',
      status: 'PENDING',
      primaryProvider: 'DIRECT',
      payload: { text: 'Direct primary', contentType: 'text', idempotencyKey: 'idem_direct_primary' },
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob as any);
    vi.spyOn(db.query.distributionExecutionAttempts, 'findMany').mockResolvedValue([]);

    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({ rowCount: 1 }) }),
    } as any);
    vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    } as any);

    const mockDirectPublisher: Partial<DirectChannelPublisher> = {
      publishToChannel: vi.fn().mockResolvedValue({
        success: true,
        channel: 'telegram',
        externalPostId: 'direct_msg_999',
        publishedAt: new Date().toISOString(),
        idempotencyKey: 'idem_direct_primary',
      }),
    };

    const orchestrator = new DistributionOrchestratorService(undefined, mockDirectPublisher as any);
    const receipt = await orchestrator.dispatchJob(TENANT_A_ORG, mockJob.id);

    expect(receipt.success).toBe(true);
    expect(receipt.externalPostId).toBe('direct_msg_999');
    expect(mockDirectPublisher.publishToChannel).toHaveBeenCalled();
  });

  // ── TEST 16 (P0-2): ATOMIC CONCURRENCY LOCK REJECTS SECOND WORKER ──
  it('16. Atomic Concurrency Lock — Rejects execution when job is already locked by concurrent worker', async () => {
    const mockJob = {
      id: 'job_concurrent_01',
      tenantId: TENANT_A_ORG,
      campaignId: 'camp_1',
      pieceId: 'piece_1',
      channel: 'telegram',
      integrationId: INTEGRATION_ID_A,
      idempotencyKey: 'idem_concurrent',
      status: 'PENDING',
      primaryProvider: 'SOFIA',
      payload: { text: 'Concurrent test', contentType: 'text', idempotencyKey: 'idem_concurrent' },
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob as any);
    vi.spyOn(db.query.distributionExecutionAttempts, 'findMany').mockResolvedValue([]);

    // Simulate conditional update matching 0 rows (another worker already changed status from PENDING)
    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 0 }),
      }),
    } as any);

    const orchestrator = new DistributionOrchestratorService();
    await expect(orchestrator.dispatchJob(TENANT_A_ORG, mockJob.id)).rejects.toThrow(
      /Concurrency lock failed: Job 'job_concurrent_01' is already being dispatched by another worker/i
    );
  });

  // ── TEST 17 (P0-5): AUDIT TRAIL RECORDED ON TRANSITIONS ──
  it('17. Comprehensive Audit Trail — Emits tamper-evident forensic audit event on state transitions', async () => {
    const auditSpy = vi.spyOn(SecurityAuditLogger, 'logEvent').mockResolvedValue({} as any);

    const mockJob = {
      id: 'job_audit_trace_01',
      tenantId: TENANT_A_ORG,
      campaignId: 'camp_1',
      pieceId: 'piece_1',
      channel: 'telegram',
      integrationId: INTEGRATION_ID_A,
      idempotencyKey: 'idem_audit_trace',
      status: 'PENDING',
      primaryProvider: 'SOFIA',
      payload: { text: 'Audit trace test', contentType: 'text', idempotencyKey: 'idem_audit_trace' },
    };

    vi.spyOn(db.query.distributionJobs, 'findFirst').mockResolvedValue(mockJob as any);
    vi.spyOn(db.query.distributionExecutionAttempts, 'findMany').mockResolvedValue([]);

    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({ rowCount: 1 }) }),
    } as any);
    vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    } as any);

    const mockSofiaClient: ISofiaExecutionClient = {
      requestExecutionLease: vi.fn().mockResolvedValue({
        jobId: mockJob.id,
        executionId: 'sofia_exec_888',
        leaseExpiresAt: new Date(Date.now() + 300000),
        provider: 'SOFIA',
      }),
      awaitExecutionResult: vi.fn().mockResolvedValue({
        success: true,
        channel: 'telegram',
        externalPostId: 'tg_msg_888',
        publishedAt: new Date().toISOString(),
        idempotencyKey: 'idem_audit_trace',
      }),
      checkExecutionStatus: vi.fn(),
    };

    const orchestrator = new DistributionOrchestratorService(mockSofiaClient);
    await orchestrator.dispatchJob(TENANT_A_ORG, mockJob.id);

    const loggedEventTypes = auditSpy.mock.calls.map((c) => c[0].eventType);
    expect(loggedEventTypes).toContain('DISTRIBUTION_DISPATCHING');
    expect(loggedEventTypes).toContain('SOFIA_LEASE_ACQUIRED');
    expect(loggedEventTypes).toContain('DISTRIBUTION_ACKNOWLEDGED');
    expect(loggedEventTypes).toContain('DISTRIBUTION_PUBLISHING');
    expect(loggedEventTypes).toContain('DISTRIBUTION_PUBLISHED');
  });
});
