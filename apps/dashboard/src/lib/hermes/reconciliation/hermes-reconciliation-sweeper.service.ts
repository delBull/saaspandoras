/**
 * 🧹 HERMES RECONCILIATION SWEEPER SERVICE (FASE 6)
 * apps/dashboard/src/lib/hermes/reconciliation/hermes-reconciliation-sweeper.service.ts
 *
 * Implements the Autonomous Self-Healing Reconciliation Loop:
 * - F6-3: Tri-State Reconciliation (PROVEN_EXECUTED / PROVEN_NOT_EXECUTED / UNRESOLVED). NOT_FOUND != FAILED.
 * - F6-7: Timeout / Inactivity NEVER authorizes retry.
 * - F6-8: Reconciliation Lease: Concurrency-safe atomic conditional lock in DB prevents double reconciliation.
 * - F6-9: Progressive Backoff: Exponential schedule (30s -> 2m -> 5m -> 15m -> 1h -> 6h).
 * - F6-10: Financial Preservation: UNKNOWN never releases or settles funds without proof.
 */

import { db } from '@/db';
import { distributionJobs, hermesMediaRequests } from '@/db/schema';
import { eq, and, or, isNull, lte, sql } from 'drizzle-orm';
import { distributionOrchestratorService } from '../channels/distribution/distribution-orchestrator.service';
import { HermesMediaOrchestratorService } from '../media/hermes-media-orchestrator.service';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';

export interface SweepItemResult {
  id: string;
  type: 'distribution_job' | 'media_request';
  tenantId: string;
  reconciled: boolean;
  status: string;
  resolution: 'PROVEN_EXECUTED' | 'PROVEN_NOT_EXECUTED' | 'UNRESOLVED';
  error?: string;
}

export interface SweepCycleResult {
  distributionCount: number;
  mediaCount: number;
  reconciledCount: number;
  unresolvedCount: number;
  failedCount: number;
  items: SweepItemResult[];
  startedAt: string;
  completedAt: string;
}

export class HermesReconciliationSweeperService {
  public static readonly DEFAULT_BATCH_SIZE = 25;
  public static readonly LEASE_DURATION_SECONDS = 60;
  public static readonly BACKOFF_SCHEDULE_MS = [
    30000,   // 30s
    120000,  // 2m
    300000,  // 5m
    900000,  // 15m
    3600000, // 1h
    21600000 // 6h
  ];

  /**
   * Computes the next reconciliation delay using exponential backoff schedule (F6-9).
   */
  public static computeNextDelayMs(attemptNumber: number): number {
    const idx = Math.min(Math.max(0, attemptNumber), this.BACKOFF_SCHEDULE_MS.length - 1);
    return this.BACKOFF_SCHEDULE_MS[idx] ?? 21600000;
  }

  /**
   * Sweeps and reconciles distribution jobs in UNKNOWN status.
   */
  public static async sweepDistributionJobs(batchSize = this.DEFAULT_BATCH_SIZE): Promise<SweepItemResult[]> {
    const results: SweepItemResult[] = [];
    if (!db) return results;

    const now = new Date();

    try {
      // 1. Query candidate UNKNOWN jobs that are eligible for reconciliation
      const candidates = await db
        .select()
        .from(distributionJobs)
        .where(
          and(
            eq(distributionJobs.status, 'UNKNOWN'),
            or(
              isNull(distributionJobs.nextReconciliationAt),
              lte(distributionJobs.nextReconciliationAt, now)
            ),
            or(
              isNull(distributionJobs.reconciliationLockUntil),
              lte(distributionJobs.reconciliationLockUntil, now)
            )
          )
        )
        .limit(batchSize);

      for (const job of candidates) {
        // 2. F6-8: Acquire atomic conditional lock lease in DB
        const lockDuration = sql`now() + interval '60 seconds'`;
        const [locked] = await db
          .update(distributionJobs)
          .set({
            reconciliationLockUntil: sql`now() + interval '60 seconds'`,
            updatedAt: now,
          })
          .where(
            and(
              eq(distributionJobs.id, job.id),
              eq(distributionJobs.status, 'UNKNOWN'),
              or(
                isNull(distributionJobs.reconciliationLockUntil),
                lte(distributionJobs.reconciliationLockUntil, now)
              )
            )
          )
          .returning();

        if (!locked) {
          // Concurrently acquired by another sweeper instance -> skip safely
          continue;
        }

        // 3. Reconcile job with zero-client input
        try {
          const outcome = await distributionOrchestratorService.reconcileUnknownJob(job.tenantId, job.id);
          const currentAttempts = (job.reconciliationAttempts || 0) + 1;
          const nextDelayMs = this.computeNextDelayMs(currentAttempts);
          const nextReconciliationAt = new Date(Date.now() + nextDelayMs);

          // Update tracking & release lock
          await db
            .update(distributionJobs)
            .set({
              reconciliationAttempts: currentAttempts,
              lastReconciledAt: now,
              nextReconciliationAt: outcome.reconciled ? null : nextReconciliationAt,
              reconciliationLockUntil: null,
            })
            .where(eq(distributionJobs.id, job.id));

          results.push({
            id: job.id,
            type: 'distribution_job',
            tenantId: job.tenantId,
            reconciled: outcome.reconciled,
            status: outcome.status,
            resolution: outcome.resolution,
          });
        } catch (jobErr: any) {
          // Release lock on unexpected failure
          await db
            .update(distributionJobs)
            .set({ reconciliationLockUntil: null })
            .where(eq(distributionJobs.id, job.id));

          results.push({
            id: job.id,
            type: 'distribution_job',
            tenantId: job.tenantId,
            reconciled: false,
            status: 'UNKNOWN',
            resolution: 'UNRESOLVED',
            error: jobErr?.message || 'Sweeper reconciliation error',
          });
        }
      }
    } catch (err) {
      console.error('[HermesReconciliationSweeper] Error sweeping distribution jobs:', err);
    }

    return results;
  }

  /**
   * Sweeps and reconciles media generation requests in UNKNOWN status.
   */
  public static async sweepMediaRequests(batchSize = this.DEFAULT_BATCH_SIZE): Promise<SweepItemResult[]> {
    const results: SweepItemResult[] = [];
    if (!db) return results;

    const now = new Date();

    try {
      // 1. Query candidate UNKNOWN media requests
      const candidates = await db
        .select()
        .from(hermesMediaRequests)
        .where(
          and(
            eq(hermesMediaRequests.status, 'UNKNOWN'),
            or(
              isNull(hermesMediaRequests.nextReconciliationAt),
              lte(hermesMediaRequests.nextReconciliationAt, now)
            ),
            or(
              isNull(hermesMediaRequests.reconciliationLockUntil),
              lte(hermesMediaRequests.reconciliationLockUntil, now)
            )
          )
        )
        .limit(batchSize);

      for (const req of candidates) {
        // 2. F6-8: Acquire atomic conditional lock lease in DB
        const [locked] = await db
          .update(hermesMediaRequests)
          .set({
            reconciliationLockUntil: sql`now() + interval '60 seconds'`,
          })
          .where(
            and(
              eq(hermesMediaRequests.id, req.id),
              eq(hermesMediaRequests.status, 'UNKNOWN'),
              or(
                isNull(hermesMediaRequests.reconciliationLockUntil),
                lte(hermesMediaRequests.reconciliationLockUntil, now)
              )
            )
          )
          .returning();

        if (!locked) {
          continue;
        }

        try {
          const outcome = await HermesMediaOrchestratorService.reconcileUnknownRequest(req.tenantId, req.id);
          const currentAttempts = (req.reconciliationAttempts || 0) + 1;
          const nextDelayMs = this.computeNextDelayMs(currentAttempts);
          const nextReconciliationAt = new Date(Date.now() + nextDelayMs);

          await db
            .update(hermesMediaRequests)
            .set({
              reconciliationAttempts: currentAttempts,
              lastReconciledAt: now,
              nextReconciliationAt: outcome.reconciled ? null : nextReconciliationAt,
              reconciliationLockUntil: null,
            })
            .where(eq(hermesMediaRequests.id, req.id));

          results.push({
            id: req.id,
            type: 'media_request',
            tenantId: req.tenantId,
            reconciled: outcome.reconciled,
            status: outcome.status,
            resolution: outcome.resolution,
            error: outcome.error,
          });
        } catch (reqErr: any) {
          await db
            .update(hermesMediaRequests)
            .set({ reconciliationLockUntil: null })
            .where(eq(hermesMediaRequests.id, req.id));

          results.push({
            id: req.id,
            type: 'media_request',
            tenantId: req.tenantId,
            reconciled: false,
            status: 'UNKNOWN',
            resolution: 'UNRESOLVED',
            error: reqErr?.message || 'Sweeper media reconciliation error',
          });
        }
      }
    } catch (err) {
      console.error('[HermesReconciliationSweeper] Error sweeping media requests:', err);
    }

    return results;
  }

  /**
   * Executes a full reconciliation sweep across all domains.
   */
  public static async sweepAll(batchSize = this.DEFAULT_BATCH_SIZE): Promise<SweepCycleResult> {
    const startedAt = new Date().toISOString();
    const distResults = await this.sweepDistributionJobs(batchSize);
    const mediaResults = await this.sweepMediaRequests(batchSize);
    const allItems = [...distResults, ...mediaResults];
    const completedAt = new Date().toISOString();

    const reconciledCount = allItems.filter(i => i.reconciled).length;
    const unresolvedCount = allItems.filter(i => i.resolution === 'UNRESOLVED').length;
    const failedCount = allItems.filter(i => i.status === 'FAILED').length;

    return {
      distributionCount: distResults.length,
      mediaCount: mediaResults.length,
      reconciledCount,
      unresolvedCount,
      failedCount,
      items: allItems,
      startedAt,
      completedAt,
    };
  }
}
