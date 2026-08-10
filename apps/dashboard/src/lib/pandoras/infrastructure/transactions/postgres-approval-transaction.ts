import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { operationalIntents, operationalIntentGovernanceEvents, outboxEvents } from '@/db/schema';
import { ApprovalTransaction } from '../../core/ports/transactions/approval-transaction.interface';
import { TenantScope } from '../../core/domains/control-plane/application/context';
import { GovernanceEvent } from '../../core/domains/governance/events/contracts';
import { OperationalIntent } from '../../core/contracts/governance-contracts';
import { TransitionResult } from '../../core/ports/repositories/operational-intent-repository.interface';

export class PostgresApprovalTransaction implements ApprovalTransaction {
  
  async execute(
    intentId: string,
    scope: TenantScope,
    expectedStatus: OperationalIntent['status'],
    nextStatus: OperationalIntent['status'],
    event: GovernanceEvent,
    outboxPayload: any
  ): Promise<TransitionResult> {
    
    // We execute everything inside a single PostgreSQL transaction
    return await db.transaction(async (tx) => {
      
      // 1. ATOMIC MUTATION using state-guarded UPDATE
      const updated = await tx.update(operationalIntents)
        .set({
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(and(
          eq(operationalIntents.id, intentId),
          eq(operationalIntents.organizationId, scope.organizationId),
          eq(operationalIntents.status, expectedStatus)
        ))
        .returning({ id: operationalIntents.id });

      if (updated.length === 0) {
        // Rows affected = 0. We must determine WHY the update failed, to honor the contract.
        // We do a tenant-scoped read to check the current state within the same transaction.
        const intentRows = await tx.select({ status: operationalIntents.status, orgId: operationalIntents.organizationId })
          .from(operationalIntents)
          .where(eq(operationalIntents.id, intentId))
          .limit(1);

        if (intentRows.length === 0) {
          return { transitioned: false, reason: 'NOT_FOUND' };
        }

        const row = intentRows[0]!;
        if (row.orgId !== scope.organizationId) {
          return { transitioned: false, reason: 'TENANT_MISMATCH' };
        }

        if (row.status === nextStatus) {
          return { transitioned: false, reason: 'ALREADY_PROCESSED' };
        }

        return { transitioned: false, reason: 'INVALID_STATE' };
      }

      // 2. Append Governance Event
      await tx.insert(operationalIntentGovernanceEvents).values({
        intentId: event.intentId,
        organizationId: event.organizationId,
        actorId: event.actorId || null,
        actorType: event.actorType,
        eventType: event.type,
        aggregateType: 'operational_intent',
        aggregateId: event.intentId,
        payload: event.payload as any,
        occurredAt: event.occurredAt,
        correlationId: event.correlationId || null,
        causationId: event.causationId || null,
      });

      // 3. Append Outbox Event
      await tx.insert(outboxEvents).values({
        organizationId: event.organizationId,
        aggregateType: 'operational_intent',
        aggregateId: event.intentId,
        eventType: event.type,
        payload: outboxPayload,
        status: 'pending',
        attempts: 0,
      });

      return { transitioned: true };
    });
  }
}
