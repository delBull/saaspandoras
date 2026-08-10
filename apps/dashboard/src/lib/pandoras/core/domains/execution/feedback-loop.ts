import { DispatchRequest } from './contracts/execution-contracts';
import { CapabilityResult } from './contracts/capability-contracts';
import { db } from '~/db';
import { missionEvents } from '~/db/schema';

export class FeedbackLoop {
  async emitExecutionSucceeded(request: DispatchRequest, result: CapabilityResult<any>): Promise<void> {
    await this.emitEvent(request, result, 'CAPABILITY_EXECUTED');
  }

  async emitExecutionFailed(request: DispatchRequest, result: CapabilityResult<any>): Promise<void> {
    await this.emitEvent(request, result, 'CAPABILITY_FAILED');
  }

  private async emitEvent(request: DispatchRequest, result: CapabilityResult<any>, eventType: string): Promise<void> {
    const payload = {
      intentId: request.context.intentId,
      organizationId: request.context.organizationId,
      capabilityId: request.capabilityId,
      version: request.version,
      idempotencyKey: request.context.idempotencyKey,
      status: result.status,
      details: result.status === 'succeeded' ? result.data : result.error,
      timestamp: new Date().toISOString()
    };

    // Reutilizamos missionEvents como evidencia para la Mission
    await db.insert(missionEvents).values({
      missionId: request.context.missionId,
      eventType: eventType,
      payload: payload
    });
  }
}
