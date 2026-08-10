import { StrategyDecision } from '../../core/domains/hermes/events/contracts';
import { StrategyDecisionRepository } from '../../core/ports/repositories/strategy-decision-repository.interface';

export class MemoryStrategyDecisionRepository implements StrategyDecisionRepository {
  private decisions: Map<string, StrategyDecision & { organizationId: string; missionId: string }> = new Map();

  async create(missionId: string, organizationId: string, decision: StrategyDecision): Promise<StrategyDecision> {
    const id = decision.id || `sdec_${Date.now()}`;
    const newDecision = { ...decision, id, organizationId, missionId };
    this.decisions.set(id, newDecision);
    return newDecision;
  }

  async getById(id: string): Promise<StrategyDecision | null> {
    return this.decisions.get(id) || null;
  }

  async getByMissionId(missionId: string): Promise<StrategyDecision[]> {
    return Array.from(this.decisions.values()).filter(d => d.missionId === missionId);
  }
}
