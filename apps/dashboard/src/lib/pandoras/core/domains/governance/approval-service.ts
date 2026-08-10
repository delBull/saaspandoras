import { OperationalIntent } from '../../contracts/governance-contracts';
import { GovernanceEventBus } from './events/governance-event-bus';
import { TenantScope } from '../control-plane/application/context';
import { ApprovalTransaction } from '../../ports/transactions/approval-transaction.interface';
import { GovernanceEvent } from './events/contracts';

export class ApprovalService {

  constructor(
    private readonly transaction: ApprovalTransaction,
    private readonly eventBus: GovernanceEventBus = GovernanceEventBus.getInstance()
  ) {}

  async approve(intentId: string, scope: TenantScope, actorId: string, reason?: string, idempotencyKey?: string): Promise<void> {
    const event: GovernanceEvent = {
      id: `gevt_${Date.now()}`, // Could be generated properly
      type: 'OPERATIONAL_INTENT_APPROVED',
      organizationId: scope.organizationId,
      intentId: intentId,
      aggregateType: 'operational_intent',
      aggregateId: intentId,
      missionId: 'unknown_mission_id_for_now',
      actorId: actorId,
      actorType: 'human',
      occurredAt: new Date(),
      payload: { reason }
    };
    
    // Outbox payload is the event itself usually
    const outboxPayload = { event };

    const result = await this.transaction.execute(intentId, scope, 'pending_approval', 'approved', event, outboxPayload);
    
    if (!result.transitioned) {
      throw new Error(`[ApprovalService] State transition failed for intent ${intentId}: ${result.reason}`);
    }

    console.log(`[ApprovalService] Intent ${intentId} APPROVED by ${actorId}`);

    // Bridge: Dispatch in memory until Outbox Processor is implemented
    this.eventBus.dispatch(event);
  }

  async reject(intentId: string, scope: TenantScope, actorId: string, reason: string, idempotencyKey?: string): Promise<void> {
    const event: GovernanceEvent = {
      id: `gevt_${Date.now()}`,
      type: 'OPERATIONAL_INTENT_REJECTED',
      organizationId: scope.organizationId,
      intentId: intentId,
      aggregateType: 'operational_intent',
      aggregateId: intentId,
      missionId: 'unknown_mission_id_for_now',
      actorId: actorId,
      actorType: 'human',
      occurredAt: new Date(),
      payload: { reason }
    };

    const outboxPayload = { event };

    const result = await this.transaction.execute(intentId, scope, 'pending_approval', 'rejected', event, outboxPayload);
    if (!result.transitioned) {
      throw new Error(`[ApprovalService] State transition failed for intent ${intentId}: ${result.reason}`);
    }

    console.log(`[ApprovalService] Intent ${intentId} REJECTED by ${actorId}. Reason: ${reason}`);

    this.eventBus.dispatch(event);

    // Inmediatamente transicionarlo a Cancelled
    await this.cancel(intentId, scope, 'System', `Auto-cancelled after rejection: ${reason}`);
  }

  async cancel(intentId: string, scope: TenantScope, actorId: string, reason?: string): Promise<void> {
    const event: GovernanceEvent = {
      id: `gevt_${Date.now()}`,
      type: 'OPERATIONAL_INTENT_CANCELLED',
      organizationId: scope.organizationId,
      intentId: intentId,
      aggregateType: 'operational_intent',
      aggregateId: intentId,
      missionId: 'unknown_mission_id_for_now',
      actorId: actorId,
      actorType: 'system',
      occurredAt: new Date(),
      payload: { reason }
    };

    const outboxPayload = { event };

    const result = await this.transaction.execute(intentId, scope, 'rejected', 'cancelled', event, outboxPayload);
    if (!result.transitioned) {
      // It might already be cancelled or not in a rejectable state for auto-cancel, ignore or log
      console.warn(`[ApprovalService] Could not auto-cancel intent ${intentId}: ${result.reason}`);
      return;
    }

    console.log(`[ApprovalService] Intent ${intentId} CANCELLED by ${actorId}`);

    this.eventBus.dispatch(event);
  }
}
