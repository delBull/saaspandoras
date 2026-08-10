import { GovernanceEvent } from '../../domains/governance/events/contracts';
import { TenantScope } from '../../domains/control-plane/application/context';

export interface GovernanceEventRepository {
  append(event: GovernanceEvent): Promise<void>;
  getByAggregate(aggregateId: string, scope: TenantScope): Promise<GovernanceEvent[]>;
  getByOrganization(scope: TenantScope): Promise<GovernanceEvent[]>;
}
