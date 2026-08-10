import { GovernanceEvent } from '../../core/domains/governance/events/contracts';
import { GovernanceEventRepository } from '../../core/ports/repositories/governance-event-repository.interface';
import { TenantScope } from '../../core/domains/control-plane/application/context';

export class MemoryGovernanceEventRepository implements GovernanceEventRepository {
  private events: GovernanceEvent[] = [];

  async append(event: GovernanceEvent): Promise<void> {
    // Enforces append-only. Cannot modify existing.
    this.events.push({ ...event });
  }

  async getByAggregate(aggregateId: string, scope: TenantScope): Promise<GovernanceEvent[]> {
    return this.events.filter(
      e => e.intentId === aggregateId && e.organizationId === scope.organizationId
    );
  }

  async getByOrganization(scope: TenantScope): Promise<GovernanceEvent[]> {
    return this.events.filter(
      e => e.organizationId === scope.organizationId
    );
  }
}
