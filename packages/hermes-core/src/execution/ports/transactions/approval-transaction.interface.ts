import { TenantScope } from '../../../control-plane/application/context';
import { GovernanceEvent } from '@saasfly/hermes-core';
import { TransitionResult } from '../repositories/operational-intent-repository.interface';
import { OperationalIntent } from '../../../contracts/governance-contracts';

export interface ApprovalTransaction {
  execute(
    intentId: string,
    scope: TenantScope,
    expectedStatus: OperationalIntent['status'],
    nextStatus: OperationalIntent['status'],
    event: GovernanceEvent,
    outboxPayload: any
  ): Promise<TransitionResult>;
}
