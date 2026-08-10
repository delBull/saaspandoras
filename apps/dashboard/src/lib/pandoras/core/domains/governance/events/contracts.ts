import { OperationalIntent } from '../../../contracts/governance-contracts';

export type GovernanceEventType = 
  | 'OPERATIONAL_INTENT_CREATED'
  | 'OPERATIONAL_INTENT_APPROVED'
  | 'OPERATIONAL_INTENT_REJECTED'
  | 'OPERATIONAL_INTENT_CANCELLED';

export interface GovernanceEvent<T = any> {
  id: string;
  organizationId: string;
  actorId?: string;
  actorType: string;
  type: GovernanceEventType; // kept as type for backwards compatibility in typescript, ADR says eventType
  aggregateType: string;
  aggregateId: string;
  
  // Backwards compatibility for now
  missionId?: string;
  intentId: string;
  actor?: string; 

  occurredAt: Date;
  payload: T;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, any>;
}

export interface GovernanceEventHandler {
  handle(event: GovernanceEvent): Promise<void>;
}
