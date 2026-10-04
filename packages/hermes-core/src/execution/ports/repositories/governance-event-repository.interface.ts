import { GovernanceEvent } from '@saasfly/hermes-core';
import { TenantScope } from '../../../control-plane/application/context';

export interface GovernanceEventRepository {
  append(event: GovernanceEvent): Promise<void>;
  getByAggregate(aggregateId: string, scope: TenantScope): Promise<GovernanceEvent[]>;
  getByOrganization(scope: TenantScope): Promise<GovernanceEvent[]>;
}
