import { MissionEvent, MissionEventHandler, StrategyDecision } from '../contracts';
import { MissionManager } from '../../mission-manager';
import { MissionPlanner } from '../../mission-planner';
import { MissionEventBus } from '../mission-event-bus';
import { IntentManager } from '../../../governance/intent-manager';
import { StrategyDecisionRepository } from '../../../../ports/repositories/strategy-decision-repository.interface';

export class PlannerHandler implements MissionEventHandler {
  
  constructor(
    private readonly missionManager: MissionManager,
    private readonly missionPlanner: MissionPlanner,
    private readonly eventBus: MissionEventBus,
    private readonly intentManager: IntentManager,
    private readonly strategyDecisionRepo: StrategyDecisionRepository
  ) {}

  async handle(event: MissionEvent): Promise<void> {
    // Escucha eventos relevantes
    if (event.type === 'MILESTONE_COMPLETED' || event.type === 'PHASE_CHANGED') {
      console.log(`[PlannerHandler] Intercepted ${event.type}. Evaluating mission state...`);
      
      const mission = await this.missionManager.getMission(event.missionId);
      if (!mission) return;

      const decision: StrategyDecision | null = await this.missionPlanner.planNextAction(mission);

      if (decision) {
        console.log(`[PlannerHandler] Strategy Decision produced: ${decision.decision}`);
        
        // Persistir la decisión antes de cualquier otra cosa (Audit Trail)
        const persistedDecision = await this.strategyDecisionRepo.create(
          mission.id, 
          mission.organizationId, 
          decision
        );

        console.log(`[PlannerHandler] Strategy Decision persisted with ID: ${persistedDecision.id}`);

        // Despacha un evento para separar responsabilidades estratégicas
        this.eventBus.dispatch({
          id: `evt_${Date.now()}`,
          type: 'STRATEGY_CHANGED',
          organizationId: mission.organizationId,
          missionId: mission.id,
          packId: mission.packId,
          packVersion: mission.packVersion,
          occurredAt: new Date(),
          payload: { action: persistedDecision.workflow },
          metadata: { decision: persistedDecision }
        });

        // Entregamos la decisión estratégica a la capa de Gobernanza
        console.log(`[PlannerHandler] Handing over Strategy Decision to Governance Layer...`);
        await this.intentManager.proposeIntent(
          mission.organizationId,
          mission.id,
          mission.packId,
          mission.packVersion,
          persistedDecision.id!,
          persistedDecision
        );
      }
    }
  }
}

