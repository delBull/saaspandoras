import { Goal, Mission, MissionConstraint, MissionMilestone } from '../../contracts';
import { MissionRepository } from '../../../ports/repositories/mission-repository.interface';
import { MissionEventBus } from './events/mission-event-bus';

export class MissionManager {
  
  constructor(
    private readonly repository: MissionRepository,
    private readonly eventBus: MissionEventBus = MissionEventBus.getInstance()
  ) {}

  /**
   * Crea y registra una nueva misión orientada a un Goal específico.
   */
  public async createMission(
    organizationId: string,
    packId: string,
    packVersion: string,
    objective: string, 
    criteria: string[], 
    constraints: MissionConstraint[] = []
  ): Promise<Mission> {
    const goalId = `goal_${Date.now()}`;
    const missionId = `mission_${Date.now()}`;
    
    const goal: Goal = {
      id: goalId,
      objective: objective,
      createdAt: new Date().toISOString(),
      status: 'active',
      successCriteria: criteria
    };

    const mission: Mission = {
      id: missionId,
      organizationId,
      packId,
      packVersion,
      goal: goal,
      status: 'active',
      currentPhase: 'initialization',
      state: {},
      milestones: criteria.map(c => ({ name: c, completed: false })),
      constraints: constraints,
      executions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createdMission = await this.repository.create(mission);
    
    this.eventBus.dispatch({
      id: `evt_${Date.now()}`,
      type: 'GOAL_CREATED',
      organizationId,
      missionId,
      packId,
      packVersion,
      occurredAt: new Date(),
      payload: { goal: goalId }
    });

    return createdMission;
  }

  public async getMission(id: string): Promise<Mission | null> {
    return await this.repository.getById(id);
  }

  public async getActiveMission(organizationId: string): Promise<Mission | null> {
    return await this.repository.getActiveMission(organizationId);
  }

  public async updateState(missionId: string, phase: string, stateDetails?: Record<string, any>): Promise<Mission> {
    const mission = await this.getMission(missionId);
    if (!mission) throw new Error(`[MissionManager] Mission ${missionId} not found`);
    
    const oldPhase = mission.currentPhase;
    mission.currentPhase = phase;
    if (stateDetails) mission.state = { ...mission.state, ...stateDetails };
    mission.updatedAt = new Date().toISOString();
    
    const updatedMission = await this.repository.update(mission);
    
    if (oldPhase !== phase) {
      this.eventBus.dispatch({
        id: `evt_${Date.now()}`,
        type: 'PHASE_CHANGED',
        organizationId: mission.organizationId,
        missionId: mission.id,
        packId: mission.packId,
        packVersion: mission.packVersion,
        occurredAt: new Date(),
        payload: { oldPhase, newPhase: phase }
      });
    }

    return updatedMission;
  }

  public async completeMilestone(missionId: string, milestoneName: string): Promise<Mission> {
    const mission = await this.getMission(missionId);
    if (!mission) throw new Error(`[MissionManager] Mission ${missionId} not found`);

    await this.repository.completeMilestone(missionId, milestoneName);
    
    this.eventBus.dispatch({
      id: `evt_${Date.now()}`,
      type: 'MILESTONE_COMPLETED',
      organizationId: mission.organizationId,
      missionId: mission.id,
      packId: mission.packId,
      packVersion: mission.packVersion,
      occurredAt: new Date(),
      payload: { milestone: milestoneName }
    });

    return (await this.getMission(missionId))!;
  }
}

