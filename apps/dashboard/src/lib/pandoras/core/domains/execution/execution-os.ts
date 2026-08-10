import { CapabilityRegistry } from './capability-registry';
import { FeedbackLoop } from './feedback-loop';
import { CapabilityResult, CapabilityError } from './contracts/capability-contracts';
import { ExecutionState } from './contracts/execution-state';
import { DispatchRequest } from './contracts/execution-contracts';
import { db } from '~/db';
import { executionRecords } from '~/db/schema';
import { and, eq } from 'drizzle-orm';

export class ExecutionOS {
  constructor(
    private registry: CapabilityRegistry,
    private feedbackLoop: FeedbackLoop
  ) {}

  async execute(request: DispatchRequest): Promise<CapabilityResult<any>> {
    const { capabilityId, version, input, context } = request;

    try {
      // 1. Resolver capability
      const capabilityHandler = this.registry.resolve(capabilityId, version);
      
      if (!capabilityHandler) {
        return {
          status: 'failed',
          error: {
            category: 'NOT_FOUND',
            message: `Capability ${capabilityId}:${version} is not registered in Execution OS.`,
            retryable: false
          }
        };
      }

      // 2. Fetch or create execution record (Idempotency)
      let execRecord = await db.query.executionRecords.findFirst({
        where: and(
          eq(executionRecords.organizationId, context.organizationId),
          eq(executionRecords.capabilityId, capabilityId),
          eq(executionRecords.idempotencyKey, context.idempotencyKey)
        )
      });

      if (execRecord) {
        if (execRecord.state === ExecutionState.SUCCEEDED) {
          console.log(`[ExecutionOS] Idempotency hit: ${capabilityId} for ${context.idempotencyKey} already succeeded.`);
          return { status: 'succeeded', data: execRecord.result as any };
        }
        if (execRecord.state === ExecutionState.RUNNING) {
          // Si está en running por un tiempo, tal vez falla, pero por ahora lanzamos error
          throw new Error(`Execution is currently RUNNING for idempotency key ${context.idempotencyKey}`);
        }
      } else {
        const [inserted] = await db.insert(executionRecords).values({
          organizationId: context.organizationId,
          missionId: context.missionId,
          intentId: context.intentId,
          capabilityId: capabilityId,
          idempotencyKey: context.idempotencyKey,
          state: ExecutionState.QUEUED
        }).returning();
        execRecord = inserted;
      }

      if (!execRecord) {
        throw new Error('Failed to create or load execution record.');
      }

      // 3. QUEUED -> RUNNING
      await db.update(executionRecords)
        .set({ state: ExecutionState.RUNNING, startedAt: new Date() })
        .where(eq(executionRecords.id, execRecord.id));

      // 4. Ejecutar capability
      const result = await capabilityHandler.execute(input, context);

      // 5. RUNNING -> SUCCEEDED | FAILED
      if (result.status === 'succeeded') {
        await db.update(executionRecords)
          .set({ state: ExecutionState.SUCCEEDED, completedAt: new Date(), result: result.data as any })
          .where(eq(executionRecords.id, execRecord.id));
          
        await this.feedbackLoop.emitExecutionSucceeded(request, result);
      } else {
        await db.update(executionRecords)
          .set({ state: ExecutionState.FAILED, completedAt: new Date(), error: result.error as any })
          .where(eq(executionRecords.id, execRecord.id));
          
        await this.feedbackLoop.emitExecutionFailed(request, result);
      }

      return result;
    } catch (error: any) {
      const capabilityError: CapabilityError = {
        category: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred during execution',
        retryable: true
      };
      
      const failedResult: CapabilityResult<any> = {
        status: 'failed',
        error: capabilityError
      };
      
      try {
        await this.feedbackLoop.emitExecutionFailed(request, failedResult);
      } catch (e) {
        console.error('[ExecutionOS] Failed to emit feedback for execution error', e);
      }
      
      return failedResult;
    }
  }
}
