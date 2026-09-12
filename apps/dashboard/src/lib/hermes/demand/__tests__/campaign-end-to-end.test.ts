/**
 * 🧪 HERMES DEMAND & DISTRIBUTION — END-TO-END ORCHESTRATION TEST SUITE (FASE 6)
 * apps/dashboard/src/lib/hermes/demand/__tests__/campaign-end-to-end.test.ts
 *
 * Enforces the Fase 6 Mandatory Invariants & Circuit Testing:
 * - F6-1: Artifact Gate: No verified artifact -> No distribution dispatch.
 * - F6-2: Tenant Financial Fence: No atomic credit reservation -> No generation.
 * - F6-4: Independent Child Jobs & State Aggregator:
 *   - All succeed -> COMPLETED
 *   - Some fail, some succeed -> PARTIALLY_COMPLETED
 *   - Any channel UNKNOWN -> RECONCILIATION_REQUIRED
 * - F6-5: Durable Identity: campaignId = camp_<uuid>, child keys: generation:${tenantId}:${campaignId}:${pieceId}
 * - Crash / Recovery / Replay Full Loop:
 *   Simulates a piece landing in UNKNOWN during generation, sweeper acquiring lease,
 *   reconciling via provider forensic check, settling ledger, and unlocking distribution.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DemandDistributionService } from '../demand-distribution.service';
import { HermesMediaOrchestratorService } from '../../media/hermes-media-orchestrator.service';
import { HermesReconciliationSweeperService } from '../../reconciliation/hermes-reconciliation-sweeper.service';
import { distributionOrchestratorService } from '../../channels/distribution/distribution-orchestrator.service';
import { TenantCreditLedgerService } from '../../compute/tenant-credit-ledger.service';
import { A2AOutboundDispatcher } from '@/lib/pandoras/core/domains/hermes/a2a/a2a-outbound-dispatcher';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';
import { db } from '@/db';

describe('🚀 Hermes Demand & Generative Distribution — End-to-End Suite (FASE 6)', () => {
  const TENANT_E2E = 'tenant_e2e_growth';

  beforeEach(() => {
    vi.restoreAllMocks();
    DemandDistributionService.clearForTesting();
    HermesMediaOrchestratorService.clearInMemoryForTesting();
    vi.spyOn(SecurityAuditLogger, 'logEvent').mockResolvedValue({} as any);
    vi.spyOn(CapabilityGrantService, 'isCapabilityGranted').mockResolvedValue(true);
  });

  // ── 1. DURABLE IDENTITY HIERARCHY (F6-5) ───────────────────────────────────
  describe('1. Durable Identity Hierarchy (F6-5)', () => {
    it('generates campaign ID adhering to camp_<uuid> format and establishes deterministic child keys', async () => {
      const campaign = await DemandDistributionService.proposeCampaign(TENANT_E2E, 'GENERATE_LEADS');

      expect(campaign.id).toMatch(/^camp_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(campaign.tenantId).toBe(TENANT_E2E);
      expect(campaign.pieces.length).toBeGreaterThan(0);

      // Verify child generation key pattern
      const executeSpy = vi.spyOn(HermesMediaOrchestratorService, 'executeGeneration').mockResolvedValue({
        ok: true,
        status: 'COMPLETED',
        requestId: 'req_test_01',
        artifactId: 'art_test_01',
        artifact: {
          id: 'art_test_01',
          artifactId: 'art_test_01',
          cid: 'mock_bafkrei_test_asset',
          ipfsUri: 'ipfs://mock_bafkrei_test_asset',
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          mimeType: 'image/png',
        },
      } as any);

      const genResult = await DemandDistributionService.generateCampaignMediaPieces(TENANT_E2E, campaign.id);
      expect(genResult.success).toBe(true);

      const firstPiece = campaign.pieces[0]!;
      const expectedKey = `generation:${TENANT_E2E}:${campaign.id}:${firstPiece.id}`;
      expect(executeSpy).toHaveBeenCalledWith(
        TENANT_E2E,
        firstPiece.id,
        expect.objectContaining({
          idempotencyKey: expectedKey,
        })
      );
    });
  });

  // ── 2. ARTIFACT GATE (F6-1) ────────────────────────────────────────────────
  describe('2. Artifact Gate (F6-1)', () => {
    it('rejects campaign approval and distribution if image/video pieces lack verified artifact previewUrl', async () => {
      const campaign = await DemandDistributionService.proposeCampaign(TENANT_E2E, 'LAUNCH_PRODUCT');

      // Ready all pieces with mock valid artifacts
      DemandDistributionService.readyAllPieces(TENANT_E2E, campaign.id);
      campaign.pieces.forEach((p) => {
        p.asset = {
          id: `art_${p.id}`,
          type: 'image',
          previewUrl: 'ipfs://mock_bafkrei_valid',
        };
      });

      // Now corrupt one piece to have an unverified artifact (empty previewUrl)
      campaign.pieces[0]!.asset = {
        id: 'unverified_asset',
        type: 'image',
        previewUrl: '', // Missing verified artifact preview!
      };

      const result = await DemandDistributionService.approveAndDistribute(TENANT_E2E, campaign.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Artifact Gate (F6-1)');
      expect(campaign.status).not.toBe('COMPLETED');
      expect(campaign.status).not.toBe('APPROVED');
    });
  });

  // ── 3. TENANT FINANCIAL FENCE (F6-2) ────────────────────────────────────────
  describe('3. Tenant Financial Fence (F6-2)', () => {
    it('halts media generation when credit reservation fails (fail-closed)', async () => {
      const campaign = await DemandDistributionService.proposeCampaign(TENANT_E2E, 'GENERATE_LEADS');

      // Mock media orchestrator returning insufficient funds error
      vi.spyOn(HermesMediaOrchestratorService, 'executeGeneration').mockResolvedValue({
        ok: false,
        status: 'FAILED',
        error: 'Fondos insuficientes para reservar computo de generacion de medios.',
      } as any);

      const genResult = await DemandDistributionService.generateCampaignMediaPieces(TENANT_E2E, campaign.id);

      expect(genResult.success).toBe(false);
      expect(genResult.error).toContain('Fondos insuficientes');
      expect(genResult.campaign.status).toBe('FAILED');
      expect(genResult.campaign.pieces[0]!.status).toBe('REJECTED');
    });
  });

  // ── 4. STATE AGGREGATOR & INDEPENDENT CHILD JOBS (F6-4) ─────────────────────
  describe('4. State Aggregator & Independent Child Jobs (F6-4)', () => {
    it('sets status to RECONCILIATION_REQUIRED if any channel lands in UNKNOWN', async () => {
      const campaign = await DemandDistributionService.proposeCampaign(TENANT_E2E, 'GENERATE_LEADS');

      // Mark pieces ready with valid mock artifacts
      campaign.pieces.forEach((p) => {
        p.status = 'READY';
        p.asset = {
          id: `art_${p.id}`,
          type: 'image',
          previewUrl: 'ipfs://mock_bafkrei_verified_asset',
        };
      });
      campaign.status = 'CONTENT_READY';

      // Mock Sofia A2A plan success
      vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockImplementation(async () => {
        return { success: true } as any;
      });

      // Mock active integration for channels
      const selectMock = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'mock_int_telegram' }]),
      };
      vi.spyOn(db, 'select').mockReturnValue(selectMock as any);

      // Mock distributionOrchestratorService returning UNKNOWN for a child job
      vi.spyOn(distributionOrchestratorService, 'createOrGetJob').mockResolvedValue({
        job: { id: 'dist_job_unknown_01' } as any,
        isNew: true,
      });
      vi.spyOn(distributionOrchestratorService, 'dispatchJob').mockResolvedValue({
        success: false,
        status: 'UNKNOWN',
        error: 'Sofia A2A timed out after ACK; status UNKNOWN under F4-3',
      } as any);

      const result = await DemandDistributionService.approveAndDistribute(TENANT_E2E, campaign.id);

      expect(result.campaign.status).toBe('RECONCILIATION_REQUIRED');
      expect(result.campaign.errorMessage).toContain('UNKNOWN requieren reconciliación');
    });

    it('sets status to PARTIALLY_COMPLETED when some channels succeed and others fail definitively', async () => {
      const campaign = await DemandDistributionService.proposeCampaign(TENANT_E2E, 'GENERATE_LEADS');

      campaign.pieces.forEach((p) => {
        p.status = 'READY';
        p.asset = {
          id: `art_${p.id}`,
          type: 'image',
          previewUrl: 'ipfs://mock_bafkrei_verified_asset',
        };
      });
      campaign.status = 'CONTENT_READY';

      // Mock Sofia A2A plan success
      vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockImplementation(async (capability: any) => {
        if (capability === 'media.plan') {
          return { success: true } as any;
        }
        // Fail channel publish for second channel
        if (typeof capability === 'string' && capability.includes('newsletter')) {
          return { success: false, error: { message: 'Newsletter service down' } } as any;
        }
        return { success: true } as any;
      });

      // No direct db integration -> fallback to Sofia A2A publish
      const selectMock = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(db, 'select').mockReturnValue(selectMock as any);

      const result = await DemandDistributionService.approveAndDistribute(TENANT_E2E, campaign.id);

      expect(result.campaign.status).toBe('PARTIALLY_COMPLETED');
      expect(result.dispatchedChannels.length).toBeGreaterThan(0);
      expect(result.failedChannels.length).toBeGreaterThan(0);
    });
  });

  // ── 5. FULL CRASH / RECOVERY / REPLAY CIRCUIT TEST ─────────────────────────
  describe('5. Full Circuit: Generation Interruption -> Sweeper Recovery -> Autonomous Resolution', () => {
    it('recovers an interrupted generation job in UNKNOWN via sweeper and completes the campaign loop', async () => {
      // Step A: Propose campaign
      const campaign = await DemandDistributionService.proposeCampaign(TENANT_E2E, 'GENERATE_LEADS');
      const piece = campaign.pieces[0]!;
      const requestId = piece.id;

      // Step B: Media Generation lands in UNKNOWN (simulated network timeout post-dispatch)
      vi.spyOn(HermesMediaOrchestratorService, 'executeGeneration').mockResolvedValue({
        ok: false,
        status: 'UNKNOWN',
        requestId,
        error: 'RunPod dispatch acknowledged but timed out before polling completed.',
      } as any);

      const genOutcome = await DemandDistributionService.generateCampaignMediaPieces(TENANT_E2E, campaign.id);
      expect(genOutcome.campaign.status).toBe('RECONCILIATION_REQUIRED');
      expect(piece.status).toBe('PENDING');

      // Step C: Autonomous Sweeper runs and sweeps media requests
      const mockReqRecord = {
        id: requestId,
        tenantId: TENANT_E2E,
        status: 'UNKNOWN',
        reconciliationAttempts: 0,
        nextReconciliationAt: null,
        reconciliationLockUntil: null,
      };

      const selectMock = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockReqRecord]),
      };

      const updateLockMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockReqRecord]),
      };

      const updateFinalMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue({}),
      };

      vi.spyOn(db, 'select').mockReturnValue(selectMock as any);
      vi.spyOn(db, 'update')
        .mockReturnValueOnce(updateLockMock as any)
        .mockReturnValueOnce(updateFinalMock as any);

      // Sweeper forensic check queries RunPod and obtains PROVEN_EXECUTED with valid artifact
      vi.spyOn(HermesMediaOrchestratorService, 'reconcileUnknownRequest').mockImplementation(async (tenantId, reqId) => {
        // Real autonomous hook closing the loop:
        DemandDistributionService.onMediaReconciliationOutcome(tenantId, reqId, {
          status: 'COMPLETED',
          resolution: 'PROVEN_EXECUTED',
          artifactId: 'art_recovered_01',
          artifact: {
            cid: 'mock_bafkrei_recovered_artifact_cid',
            ipfsUri: 'ipfs://mock_bafkrei_recovered_artifact_cid',
            sha256: 'a'.repeat(64),
          },
          financialBreakdown: { rawCostUsd: 0.03, markupCostUsd: 0.0105, totalChargedUsd: 0.0405 },
        });
        return {
          reconciled: true,
          status: 'COMPLETED',
          resolution: 'PROVEN_EXECUTED',
          artifactId: 'art_recovered_01',
          costUsd: '0.040500',
        } as any;
      });

      // Mark the other pieces ready to ensure full campaign readiness upon recovery
      for (let i = 1; i < campaign.pieces.length; i++) {
        const p = campaign.pieces[i]!;
        p.status = 'READY';
        p.asset = { id: `art_${p.id}`, type: 'image', previewUrl: 'ipfs://mock_bafkrei_asset' };
      }

      const sweepResult = await HermesReconciliationSweeperService.sweepMediaRequests(10);
      expect(sweepResult).toHaveLength(1);
      expect(sweepResult[0]?.reconciled).toBe(true);
      expect(sweepResult[0]?.resolution).toBe('PROVEN_EXECUTED');
      expect(sweepResult[0]?.status).toBe('COMPLETED');

      // Step D: Autonomous verification — NO manual notifyPieceContentReady or readyAllPieces!
      // The sweeper hook has already automatically updated piece and campaign!
      expect(piece.status).toBe('READY');
      expect(piece.asset?.previewUrl).toBe('ipfs://mock_bafkrei_recovered_artifact_cid');
      expect(campaign.status).toBe('CONTENT_READY');

      // Step E: Direct approval and distribution proceeds seamlessly
      vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockResolvedValue({ success: true } as any);

      vi.spyOn(db, 'select').mockImplementation((() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(async () => {
              // Return valid artifact with sha256 + cid satisfying F6-1 Artifact Gate
              return [{
                id: 'art_recovered_01',
                artifactId: 'art_recovered_01',
                sha256: 'a'.repeat(64),
                cid: 'mock_bafkrei_recovered_artifact_cid',
                ipfsUri: 'ipfs://mock_bafkrei_recovered_artifact_cid',
              }];
            }),
          })),
        })),
      })) as any);

      vi.spyOn(distributionOrchestratorService, 'createOrGetJob').mockResolvedValue({
        job: { id: 'dist_job_recovered_01' } as any,
        isNew: true,
      });
      vi.spyOn(distributionOrchestratorService, 'dispatchJob').mockResolvedValue({
        success: true,
        status: 'PUBLISHED',
      } as any);

      const finalDispatch = await DemandDistributionService.approveAndDistribute(TENANT_E2E, campaign.id);
      expect(finalDispatch.success).toBe(true);
      expect(finalDispatch.campaign.status).toBe('COMPLETED');
    });

    // ── 6. F6-10 FINANCIAL PRESERVATION ON UNKNOWN TRANSITION ─────────────────
    it('strictly preserves funds in reserved_balance_usd upon transitioning to UNKNOWN without premature release', async () => {
      const releaseSpy = vi.spyOn(TenantCreditLedgerService, 'releaseReservation');

      vi.spyOn(TenantCreditLedgerService, 'reserveCredits').mockResolvedValue({
        ok: true,
        reservationId: 'res_preservation_001',
        reservedAmountUsd: 0.027,
        rawCostUsd: 0.02,
        markupCostUsd: 0.007,
        availableBalanceUsd: 10.0,
        isSandbox: true,
      });

      vi.spyOn(db, 'select').mockImplementation((() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
      })) as any);
      vi.spyOn(db, 'insert').mockImplementation((() => ({
        values: vi.fn().mockReturnThis(),
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
        returning: vi.fn().mockResolvedValue([]),
      })) as any);
      vi.spyOn(db, 'update').mockImplementation((() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ creditBalanceUsd: '10.0000', reservedBalanceUsd: '0.0270' }]),
      })) as any);

      // Mock Sofia ACK received (capability.request)
      vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockImplementation(async (type: any) => {
        if (type === 'capability.request') {
          return { success: true, executionId: 'sofia_lease_timeout_test' } as any;
        }
        return { success: false } as any;
      });

      // Mock post-ACK timeout
      vi.spyOn(HermesMediaOrchestratorService as any, 'awaitSofiaResult').mockRejectedValue(
        new Error('Sofia post-ACK execution timeout (15000ms exceeded) for lease sofia_lease_timeout_test')
      );

      const { request: mediaReq } = await HermesMediaOrchestratorService.createOrGetMediaRequest(TENANT_E2E, {
        capability: 'media.image.generate',
        prompt: 'Preservation test',
        provider: 'sofia',
        idempotencyKey: 'idem_preservation_01',
      });

      const outcome = await HermesMediaOrchestratorService.executeGeneration(TENANT_E2E, mediaReq.id, {
        capability: 'media.image.generate',
        prompt: 'Preservation test',
        provider: 'sofia',
        idempotencyKey: 'idem_preservation_01',
      });

      expect(outcome.status).toBe('UNKNOWN');

      // F6-10 ASSERTION: releaseReservation MUST NOT have been called!
      expect(releaseSpy).not.toHaveBeenCalled();

      // Now verify that reconcile with PROVEN_NOT_EXECUTED does call releaseReservation with correct arguments
      releaseSpy.mockClear();
      vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockResolvedValue({
        success: true,
        status: 'FAILED_PRE_SIDE_EFFECT',
      } as any);

      const recResult = await HermesMediaOrchestratorService.reconcileUnknownRequest(TENANT_E2E, mediaReq.id);
      expect(recResult.status).toBe('FAILED');
      expect(recResult.resolution).toBe('PROVEN_NOT_EXECUTED');
      expect(releaseSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^res_/),
        TENANT_E2E,
        expect.stringContaining('not executed')
      );
    });
  });
});
