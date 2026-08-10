import { Mission } from '../../contracts';
import { StrategyDecision } from './events/contracts';

export class MissionPlanner {
  /**
   * Evalúa el estado estratégico actual de una Misión y decide qué herramienta
   * del Execution OS usar para hacerla avanzar (Strategy Decision).
   */
  async planNextAction(mission: Mission): Promise<StrategyDecision | null> {
    console.log(`[MissionPlanner] Evaluando Misión en curso (${mission.id}). Fase: '${mission.currentPhase}'`);

    // Lógica simplificada de validación
    if (mission.currentPhase === 'initialization' || mission.currentPhase === 'market_preparation') {
      
      if (mission.goal.objective.includes('S\'Narai') || mission.goal.objective.includes('Lanzar proyecto')) {
        console.log(`[MissionPlanner] 🗺️ Decisión: Delegar creación de campaña comercial al Execution OS.`);
        
        return {
          decisionType: 'propose_action',
          packId: mission.packId,
          packVersion: mission.packVersion,
          decision: "start product launch",
          confidence: 0.9,
          reason: {
            summary: "Product launch is the next strategic action for initialization.",
            factors: [
              { type: 'phase', source: 'mission_state', value: mission.currentPhase },
              { type: 'goal_match', source: 'mission_objective', value: mission.goal.objective }
            ]
          },
          workflow: 'commercial.product_launch.v1'
        };
      }
    } else if (mission.currentPhase === 'campaign_execution') {
        console.log(`[MissionPlanner] 🗺️ Decisión: Ejecutar primera generación de leads.`);
        return {
          decisionType: 'propose_action',
          packId: mission.packId,
          packVersion: mission.packVersion,
          decision: "start lead generation",
          confidence: 0.85,
          reason: {
            summary: "Lead generation is the next strategic action.",
            factors: [
              { type: 'milestone', source: 'branding_ready', value: 'completed' },
              { type: 'phase', source: 'mission_state', value: mission.currentPhase }
            ]
          },
          workflow: 'marketing.lead_generation.v1'
        };
    }

    console.log(`[MissionPlanner] ⏸️ No hay decisiones estratégicas operativas en este momento.`);
    return null;
  }
}

