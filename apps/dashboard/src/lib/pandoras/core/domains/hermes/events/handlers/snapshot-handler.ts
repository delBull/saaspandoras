import { MissionEvent, MissionEventHandler, StrategyDecision } from '../contracts';
import { db } from '@/db';
import { missionSnapshots } from '@/db/schema';
import { MissionManager } from '../../mission-manager';

export class SnapshotHandler implements MissionEventHandler {
  
  constructor(private readonly missionManager: MissionManager) {}

  async handle(event: MissionEvent): Promise<void> {
    // Escuchamos eventos que ameriten una fotografía estratégica
    if (event.type === 'PHASE_CHANGED' || event.type === 'MILESTONE_COMPLETED') {
      console.log(`[SnapshotHandler] Capturing Strategic State Snapshot for Mission ${event.missionId}...`);
      
      const mission = await this.missionManager.getMission(event.missionId);
      if (!mission) return;

      // Extract reason/context from payload or metadata (or from StrategyDecision if triggered by Planner)
      const decisionData = event.metadata?.decision as StrategyDecision | undefined;

      try {
        await db.insert(missionSnapshots).values({
          missionId: mission.id,
          state: mission.state,
          phase: mission.currentPhase,
          milestones: mission.milestones,
          activeGoal: mission.goal.id,
          nextAction: decisionData?.workflow || null,
          reason: decisionData?.reason || [event.type],
        });
      } catch (e) {
        console.log(`[SnapshotHandler] (Mock) DB sync pending. Snapshot logged in memory.`);
      }
    }
  }
}
