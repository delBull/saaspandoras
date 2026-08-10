import { ControlPlaneContext } from '../context';
import { MissionControlView } from '../../view-models';
import { MissionRepository } from '~/lib/pandoras/ports/repositories/mission-repository.interface';

export class GetActiveMissionsQuery {
  constructor(
    private readonly missionRepo: MissionRepository
  ) {}

  async execute(context: ControlPlaneContext, requestedOrganizationId: string): Promise<MissionControlView[]> {
    context.assertOrganizationAccess(requestedOrganizationId);
    
    const mission = await this.missionRepo.getActiveMission(requestedOrganizationId);
    if (!mission) {
      return [];
    }
    
    return [
      {
        missionId: mission.id,
        goalName: mission.goal.objective,
        phase: mission.currentPhase,
        pack: `${mission.packId} ${mission.packVersion}`,
        milestones: mission.milestones.map((m: any) => ({
          name: m.name,
          completed: m.completed,
          completedAt: m.completedAt ? new Date(m.completedAt) : undefined
        })),
        // nextStrategicDecision depends on linking to a StrategyDecision which we might not have in the mock yet
        // For now, if the mission has a pending intent, we could show it, but keeping it empty if not available
      }
    ];
  }
}
