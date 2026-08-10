import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { operationalIntentGovernanceEvents } from '@/db/schema';
import { GovernanceEvent } from '../../core/domains/governance/events/contracts';
import { TenantScope } from '../../core/domains/control-plane/application/context';
import { GovernanceEventRepository } from '../../core/ports/repositories/governance-event-repository.interface';

export class PostgresGovernanceEventRepository implements GovernanceEventRepository {
  
  async append(event: GovernanceEvent): Promise<void> {
    await db.insert(operationalIntentGovernanceEvents).values({
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
  }

  async getByAggregate(aggregateId: string, scope: TenantScope): Promise<GovernanceEvent[]> {
    const rows = await db.select()
      .from(operationalIntentGovernanceEvents)
      .where(and(
        eq(operationalIntentGovernanceEvents.intentId, aggregateId),
        eq(operationalIntentGovernanceEvents.organizationId, scope.organizationId)
      ))
      .orderBy(operationalIntentGovernanceEvents.occurredAt);
      
    return rows.map(row => this.mapToDomain(row));
  }

  async getByOrganization(scope: TenantScope): Promise<GovernanceEvent[]> {
    const rows = await db.select()
      .from(operationalIntentGovernanceEvents)
      .where(eq(operationalIntentGovernanceEvents.organizationId, scope.organizationId))
      .orderBy(operationalIntentGovernanceEvents.occurredAt);
      
    return rows.map(row => this.mapToDomain(row));
  }

  private mapToDomain(row: any): GovernanceEvent {
    return {
      id: row.id,
      aggregateType: row.aggregateType,
      aggregateId: row.aggregateId,
      intentId: row.intentId,
      organizationId: row.organizationId,
      actorId: row.actorId || undefined,
      actorType: row.actorType,
      type: row.eventType as any,
      occurredAt: row.occurredAt,
      payload: row.payload,
      correlationId: row.correlationId || undefined,
      causationId: row.causationId || undefined,
    };
  }
}
