import { ExecutionRequest, ExecutionResult } from '../../contracts/universal';
import { db } from '@/db';
import { hermesJobs } from '@/db/schema';
import { and, eq, lt, or, sql } from 'drizzle-orm';

export type JobState = 'Queued' | 'Running' | 'Waiting Callback' | 'Completed' | 'Failed' | 'Dead Letter' | 'Retrying';

/**
 * 🕰️ Hermes OS — Scheduler
 * 
 * ADR-007: Strict state machine for all asynchronous agent operations.
 * Fully backed by PostgreSQL (hermesJobs) to survive serverless boundaries.
 */
export class Scheduler {
  public static async enqueue(request: ExecutionRequest): Promise<void> {
    const job = {
      id: request.executionId,
      tenantId: request.tenantId || 'system',
      state: 'Queued',
      request: request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(hermesJobs).values(job);
    console.log(`[Scheduler] Job ${request.executionId} enqueued.`);
  }

  public static async updateState(executionId: string, state: JobState, result?: ExecutionResult): Promise<void> {
    await db.update(hermesJobs)
      .set({
        state,
        result: result || null,
        updatedAt: new Date()
      })
      .where(eq(hermesJobs.id, executionId));
      
    console.log(`[Scheduler] Job ${executionId} transitioned to ${state}`);
  }

  public static async markDeadLetter(executionId: string, reason: string, details?: Record<string, any>): Promise<void> {
    const result: ExecutionResult = {
      status: 'failed',
      warnings: [`DEAD_LETTER: ${reason}`],
      telemetry: { executionId, reason, ...(details || {}) },
    };

    await db.update(hermesJobs)
      .set({
        state: 'Dead Letter',
        result,
        updatedAt: new Date(),
      })
      .where(eq(hermesJobs.id, executionId));

    console.warn(`[Scheduler] ⚠️ Job ${executionId} moved to Dead Letter queue. Reason: ${reason}`);
  }

  public static async setCallbackData(executionId: string, providerId: string, secret: string): Promise<void> {
    await db.update(hermesJobs)
      .set({
        providerId,
        callbackSecret: secret,
        state: 'Waiting Callback',
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000) // 1 hour TTL
      })
      .where(eq(hermesJobs.id, executionId));
      
    console.log(`[Scheduler] Job ${executionId} waiting for callback from ${providerId}`);
  }

  public static async getJob(executionId: string) {
    const jobs = await db.select().from(hermesJobs).where(eq(hermesJobs.id, executionId)).limit(1);
    return jobs[0];
  }

  public static async deleteJob(executionId: string): Promise<void> {
    await db.delete(hermesJobs).where(eq(hermesJobs.id, executionId));
    console.log(`[Scheduler] Job ${executionId} deleted.`);
  }

  private static readonly MAX_RETRIES = 3;
  private static readonly BACKOFF_MS = [30_000, 120_000, 300_000]; // 30s, 2min, 5min

  /**
   * Transition a 'Failed' job to 'Retrying' with exponential backoff.
   * If max retries exceeded, moves to Dead Letter instead.
   */
  public static async retryFailedJob(executionId: string, reason?: string): Promise<void> {
    const job = await this.getJob(executionId);
    if (!job || job.state !== 'Failed') return;

    const result = (job.result as Record<string, any>) || {};
    const telemetry = result.telemetry || {};
    const retryCount: number = telemetry.retryCount || 0;

    if (retryCount >= this.MAX_RETRIES) {
      await this.markDeadLetter(executionId, 'MAX_RETRIES_EXCEEDED', {
        retryCount,
        originalReason: reason || 'unknown',
      });
      return;
    }

    const backoffMs = this.BACKOFF_MS[Math.min(retryCount, this.BACKOFF_MS.length - 1)] || 300_000;
    const nextRetryAt = new Date(Date.now() + backoffMs);

    await db.update(hermesJobs)
      .set({
        state: 'Retrying',
        result: {
          ...result,
          telemetry: {
            ...telemetry,
            retryCount: retryCount + 1,
            nextRetryAt: nextRetryAt.toISOString(),
            retryReason: reason,
            lastRetryAt: new Date().toISOString(),
          },
        },
        updatedAt: new Date(),
      })
      .where(eq(hermesJobs.id, executionId));

    console.log(`[Scheduler] Job ${executionId} scheduled for retry #${retryCount + 1} at ${nextRetryAt.toISOString()}`);
  }

  /**
   * Production Hardening: Dead-letter worker, expired callback reaper, and retry processor.
   * 1. Re-enqueue 'Retrying' jobs past their nextRetryAt
   * 2. Auto-retry recent 'Failed' jobs (not yet 24h old)
   * 3. Expire 'Waiting Callback' jobs past expiration → Dead Letter
   * 4. Archive old 'Failed' jobs (>24h, no retries left) → Dead Letter
   */
  public static async processDeadLetterQueue(): Promise<{
    retried: number;
    expiredCallbacks: number;
    deadLettered: number;
    totalRetrying: number;
  }> {
    const now = new Date();

    // 1. Re-enqueue 'Retrying' jobs whose backoff has elapsed
    const readyToRetry = await db
      .select({ id: hermesJobs.id, result: hermesJobs.result })
      .from(hermesJobs)
      .where(eq(hermesJobs.state, 'Retrying'));

    let retried = 0;
    for (const job of readyToRetry) {
      const result = (job.result as Record<string, any>) || {};
      const nextRetryAt = result?.telemetry?.nextRetryAt;
      if (nextRetryAt && new Date(nextRetryAt) <= now) {
        await this.updateState(job.id, 'Queued');
        retried++;
        console.log(`[Scheduler] Job ${job.id} re-enqueued for retry (attempt ${(result.telemetry?.retryCount || 0)})`);
      }
    }

    // 2. Auto-retry recent 'Failed' jobs (<24h old) that haven't been retried yet
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentFailed = await db
      .select({ id: hermesJobs.id, result: hermesJobs.result })
      .from(hermesJobs)
      .where(
        and(
          eq(hermesJobs.state, 'Failed'),
          lt(hermesJobs.updatedAt, oneDayAgo)
        )
      );

    for (const job of recentFailed) {
      const result = (job.result as Record<string, any>) || {};
      const retryCount = result?.telemetry?.retryCount || 0;
      if (retryCount < this.MAX_RETRIES) {
        await this.retryFailedJob(job.id, result?.telemetry?.failureReason || 'auto-retry');
      } else {
        await this.markDeadLetter(job.id, 'MAX_RETRIES_EXCEEDED_24H', {
          archivedAt: now.toISOString(),
          retryCount,
        });
      }
    }

    // 3. Expire 'Waiting Callback' jobs past expiration
    const expired = await db
      .select({ id: hermesJobs.id })
      .from(hermesJobs)
      .where(
        and(
          eq(hermesJobs.state, 'Waiting Callback'),
          lt(hermesJobs.expiresAt, now)
        )
      );

    for (const job of expired) {
      await this.markDeadLetter(job.id, 'CALLBACK_TIMEOUT_EXPIRED', { expiredAt: now.toISOString() });
    }

    // 4. Count remaining Retrying jobs (still in backoff)
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(hermesJobs)
      .where(eq(hermesJobs.state, 'Retrying'));

    return {
      retried,
      expiredCallbacks: expired.length,
      deadLettered: recentFailed.length,
      totalRetrying: countRow?.count || 0,
    };
  }
}
