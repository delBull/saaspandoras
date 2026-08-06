import { ExecutionRequest, ExecutionResult } from '../../contracts/universal';
import { db } from '@/db';
import { hermesJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
}
