import { OperationalIntent } from '../../contracts/governance-contracts';

import { TenantScope } from '../../domains/control-plane/application/context';

export type TransitionFailureReason =
  | 'NOT_FOUND'
  | 'TENANT_MISMATCH'
  | 'INVALID_STATE'
  | 'ALREADY_PROCESSED';

export interface TransitionResult {
  transitioned: boolean;
  reason?: TransitionFailureReason;
}

export interface OperationalIntentRepository {
  create(intent: OperationalIntent): Promise<OperationalIntent>;
  findById(id: string, scope: TenantScope): Promise<OperationalIntent | null>;
  findPending(scope: TenantScope): Promise<OperationalIntent[]>;
  transitionStatus(
    id: string,
    scope: TenantScope,
    expectedStatus: OperationalIntent['status'],
    nextStatus: OperationalIntent['status']
  ): Promise<TransitionResult>;
}
