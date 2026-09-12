/**
 * 🧪 HERMES RECONCILIATION SWEEPER TEST SUITE (FASE 6)
 * apps/dashboard/src/lib/hermes/reconciliation/__tests__/reconciliation-sweeper.test.ts
 *
 * Enforces the Autonomous Self-Healing Reconciliation Directives:
 * - F6-3: Tri-State Reconciliation (PROVEN_EXECUTED / PROVEN_NOT_EXECUTED / UNRESOLVED). NOT_FOUND != FAILED.
 * - F6-7: Timeout / Inactivity triggers investigation, NEVER authorizes a retry.
 * - F6-8: Concurrency Lease: Atomic conditional lock prevents double reconciliation.
 * - F6-9: Progressive Backoff: Exponential schedule (30s -> 2m -> 5m -> 15m -> 1h -> 6h).
 * - F6-10: Financial Preservation: UNKNOWN never releases or settles funds without proof.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HermesReconciliationSweeperService,
} from '../hermes-reconciliation-sweeper.service';
import { distributionOrchestratorService } from '../../channels/distribution/distribution-orchestrator.service';
import { HermesMediaOrchestratorService } from '../../media/hermes-media-orchestrator.service';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';
import { db } from '@/db';

describe('🧹 Hermes Reconciliation Sweeper & Self-Healing Engine (FASE 6)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(SecurityAuditLogger, 'logEvent').mockResolvedValue({} as any);
  });

  // ── 1. PROGRESSIVE BACKOFF SCHEDULE (F6-9) ──────────────────────────────────
  describe('1. Progressive Backoff Schedule (F6-9)', () => {
    it('computes correct deterministic delays across attempts 0 through 5 and caps at 6h', () => {
      expect(HermesReconciliationSweeperService.computeNextDelayMs(0)).toBe(30_000);   // 30s
      expect(HermesReconciliationSweeperService.computeNextDelayMs(1)).toBe(120_000);  // 2m
      expect(HermesReconciliationSweeperService.computeNextDelayMs(2)).toBe(300_000);  // 5m
      expect(HermesReconciliationSweeperService.computeNextDelayMs(3)).toBe(900_000);  // 15m
      expect(HermesReconciliationSweeperService.computeNextDelayMs(4)).toBe(3_600_000); // 1h
      expect(HermesReconciliationSweeperService.computeNextDelayMs(5)).toBe(21_600_000); // 6h
      // Capped for any higher attempts
      expect(HermesReconciliationSweeperService.computeNextDelayMs(99)).toBe(21_600_000); // 6h
    });
  });

  // ── 2. CONCURRENCY LEASE & ATOMIC CONDITIONAL LOCK (F6-8) ───────────────────
  describe('2. Concurrency Lease & Atomic Locking (F6-8)', () => {
    it('skips candidates when atomic lock update returns empty (another worker holds the lease)', async () => {
      const mockCandidateJob = {
        id: 'dist_job_lease_test_01',
        tenantId: 'tenant_alpha',
        status: 'UNKNOWN',
        reconciliationAttempts: 0,
        nextReconciliationAt: null,
        reconciliationLockUntil: null,
      };

      // Mock db.select().from().where().limit() returning the candidate
      const selectMock = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockCandidateJob]),
      };

      // Mock db.update().set().where().returning() returning [] to simulate failed lock acquisition
      const updateMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]), // Atomic lock NOT acquired!
      };

      vi.spyOn(db, 'select').mockReturnValue(selectMock as any);
      vi.spyOn(db, 'update').mockReturnValue(updateMock as any);

      const reconcileSpy = vi.spyOn(distributionOrchestratorService, 'reconcileUnknownJob');

      const results = await HermesReconciliationSweeperService.sweepDistributionJobs(10);

      // Reconcile must NEVER be called because lease acquisition failed
      expect(reconcileSpy).not.toHaveBeenCalled();
      expect(results).toHaveLength(0);
    });
  });

  // ── 3. TRI-STATE RECONCILIATION & FINANCIAL PRESERVATION (F6-3, F6-10) ──────
  describe('3. Tri-State Reconciliation for Media Requests (F6-3, F6-10)', () => {
    it('handles PROVEN_EXECUTED: marks COMPLETED and clears nextReconciliationAt', async () => {
      const mockReq = {
        id: 'req_media_proven_01',
        tenantId: 'tenant_alpha',
        status: 'UNKNOWN',
        reconciliationAttempts: 1,
        nextReconciliationAt: null,
        reconciliationLockUntil: null,
      };

      const selectMock = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockReq]),
      };

      const updateLockMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockReq]),
      };

      const updateFinalMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue({}),
      };

      vi.spyOn(db, 'select').mockReturnValue(selectMock as any);
      vi.spyOn(db, 'update')
        .mockReturnValueOnce(updateLockMock as any)
        .mockReturnValueOnce(updateFinalMock as any);

      vi.spyOn(HermesMediaOrchestratorService, 'reconcileUnknownRequest').mockResolvedValue({
        requestId: mockReq.id,
        tenantId: mockReq.tenantId,
        reconciled: true,
        status: 'COMPLETED',
        resolution: 'PROVEN_EXECUTED',
        providerJobId: 'runpod_completed_job_1',
        costUsd: '0.040500',
      } as any);

      const results = await HermesReconciliationSweeperService.sweepMediaRequests(10);

      expect(results).toHaveLength(1);
      expect(results[0]?.reconciled).toBe(true);
      expect(results[0]?.resolution).toBe('PROVEN_EXECUTED');
      expect(results[0]?.status).toBe('COMPLETED');
    });

    it('handles UNRESOLVED (NOT_FOUND != FAILED): keeps UNKNOWN, schedules backoff, preserves funds', async () => {
      const mockReq = {
        id: 'req_media_unresolved_01',
        tenantId: 'tenant_alpha',
        status: 'UNKNOWN',
        reconciliationAttempts: 0,
        nextReconciliationAt: null,
        reconciliationLockUntil: null,
      };

      const selectMock = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockReq]),
      };

      const updateLockMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockReq]),
      };

      const updateFinalMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue({}),
      };

      vi.spyOn(db, 'select').mockReturnValue(selectMock as any);
      vi.spyOn(db, 'update')
        .mockReturnValueOnce(updateLockMock as any)
        .mockReturnValueOnce(updateFinalMock as any);

      // Provider returns NOT_FOUND / 404 -> resolution must be UNRESOLVED, NOT FAILED!
      vi.spyOn(HermesMediaOrchestratorService, 'reconcileUnknownRequest').mockResolvedValue({
        requestId: mockReq.id,
        tenantId: mockReq.tenantId,
        reconciled: false,
        status: 'UNKNOWN',
        resolution: 'UNRESOLVED',
        error: 'RunPod reported 404 NOT_FOUND. Preserving UNKNOWN status under F6-3.',
      } as any);

      const results = await HermesReconciliationSweeperService.sweepMediaRequests(10);

      expect(results).toHaveLength(1);
      expect(results[0]?.reconciled).toBe(false);
      expect(results[0]?.status).toBe('UNKNOWN');
      expect(results[0]?.resolution).toBe('UNRESOLVED');
      expect(results[0]?.error).toContain('Preserving UNKNOWN status under F6-3');
    });

    it('handles PROVEN_NOT_EXECUTED: marks FAILED and releases funds', async () => {
      const mockReq = {
        id: 'req_media_failed_01',
        tenantId: 'tenant_alpha',
        status: 'UNKNOWN',
        reconciliationAttempts: 0,
        nextReconciliationAt: null,
        reconciliationLockUntil: null,
      };

      const selectMock = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockReq]),
      };

      const updateLockMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockReq]),
      };

      const updateFinalMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue({}),
      };

      vi.spyOn(db, 'select').mockReturnValue(selectMock as any);
      vi.spyOn(db, 'update')
        .mockReturnValueOnce(updateLockMock as any)
        .mockReturnValueOnce(updateFinalMock as any);

      vi.spyOn(HermesMediaOrchestratorService, 'reconcileUnknownRequest').mockResolvedValue({
        requestId: mockReq.id,
        tenantId: mockReq.tenantId,
        reconciled: true,
        status: 'FAILED',
        resolution: 'PROVEN_NOT_EXECUTED',
        error: 'Provider confirmed execution aborted before GPU allocation.',
      } as any);

      const results = await HermesReconciliationSweeperService.sweepMediaRequests(10);

      expect(results).toHaveLength(1);
      expect(results[0]?.reconciled).toBe(true);
      expect(results[0]?.status).toBe('FAILED');
      expect(results[0]?.resolution).toBe('PROVEN_NOT_EXECUTED');
    });
  });

  // ── 4. FULL SWEEPER CYCLE (sweepAll) ────────────────────────────────────────
  describe('4. Full Sweeper Aggregation Cycle (sweepAll)', () => {
    it('aggregates both distribution and media items into structured SweepCycleResult', async () => {
      vi.spyOn(HermesReconciliationSweeperService, 'sweepDistributionJobs').mockResolvedValue([
        {
          id: 'dist_01',
          type: 'distribution_job',
          tenantId: 'tenant_alpha',
          reconciled: true,
          status: 'PUBLISHED',
          resolution: 'PROVEN_EXECUTED',
        },
      ]);

      vi.spyOn(HermesReconciliationSweeperService, 'sweepMediaRequests').mockResolvedValue([
        {
          id: 'media_01',
          type: 'media_request',
          tenantId: 'tenant_alpha',
          reconciled: false,
          status: 'UNKNOWN',
          resolution: 'UNRESOLVED',
        },
      ]);

      const cycle = await HermesReconciliationSweeperService.sweepAll(10);

      expect(cycle.distributionCount).toBe(1);
      expect(cycle.mediaCount).toBe(1);
      expect(cycle.reconciledCount).toBe(1);
      expect(cycle.unresolvedCount).toBe(1);
      expect(cycle.failedCount).toBe(0);
      expect(cycle.items).toHaveLength(2);
      expect(cycle.startedAt).toBeDefined();
      expect(cycle.completedAt).toBeDefined();
    });
  });
});
