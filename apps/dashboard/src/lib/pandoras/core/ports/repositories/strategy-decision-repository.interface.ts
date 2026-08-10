import { StrategyDecision } from '../../domains/hermes/events/contracts';

export interface StrategyDecisionRepository {
  create(missionId: string, organizationId: string, decision: StrategyDecision): Promise<StrategyDecision>;
  getById(id: string): Promise<StrategyDecision | null>;
  getByMissionId(missionId: string): Promise<StrategyDecision[]>;
}
