export type MissionEventType = 
  | 'GOAL_CREATED'
  | 'MILESTONE_COMPLETED'
  | 'STRATEGY_CHANGED'
  | 'MISSION_BLOCKED'
  | 'APPROVAL_REQUIRED'
  | 'PHASE_CHANGED';

export interface MissionEvent<T = any> {
  id: string;
  type: MissionEventType;
  organizationId: string;
  missionId: string;
  packId: string;
  packVersion: string;
  occurredAt: Date;
  actor?: string; // id de usuario si fue manual
  payload: T;
  metadata?: Record<string, any>;
}

export interface MissionEventHandler {
  handle(event: MissionEvent): Promise<void>;
}

export type StrategyDecisionType = 
  | 'propose_action' 
  | 'request_clarification' 
  | 'pause' 
  | 'advance_mission' 
  | 'complete_mission';

export interface StrategyDecisionReasonFactor {
  type: string;
  source: string;
  value?: unknown;
}

export interface StrategyDecisionReason {
  summary: string;
  factors: StrategyDecisionReasonFactor[];
}

export interface StrategyDecision {
  id?: string;
  decisionType: StrategyDecisionType;
  packId?: string;
  packVersion?: string;
  decision: string;
  reason: StrategyDecisionReason;
  confidence?: number;
  workflow?: string; // workflow id en el OS si aplica
  metadata?: Record<string, any>;
}
