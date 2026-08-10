import { MissionRepository } from '../../ports/repositories/mission-repository.interface';
import { Mission } from '../../core/contracts/mission-contracts';

export class MemoryMissionRepository implements MissionRepository {
  private missions: Map<string, Mission> = new Map();
  private events: Array<{missionId: string, type: string, payload: any}> = [];

  async create(mission: Mission): Promise<Mission> {
    this.missions.set(mission.id, { ...mission });
    return mission;
  }

  async getActiveMission(organizationId: string): Promise<Mission | null> {
    for (const mission of this.missions.values()) {
      if (mission.organizationId === organizationId && mission.status === 'active') {
        return { ...mission };
      }
    }
    return null;
  }

  async getById(missionId: string): Promise<Mission | null> {
    const mission = this.missions.get(missionId);
    return mission ? { ...mission } : null;
  }

  async update(mission: Mission): Promise<Mission> {
    if (!this.missions.has(mission.id)) {
      throw new Error(`Mission ${mission.id} not found`);
    }
    const updated = { ...this.missions.get(mission.id)!, ...mission, updatedAt: new Date().toISOString() };
    this.missions.set(mission.id, updated);
    return updated;
  }

  async completeMilestone(missionId: string, milestoneKey: string): Promise<void> {
    const mission = this.missions.get(missionId);
    if (mission) {
      const ms = mission.milestones.find(m => m.name === milestoneKey);
      if (ms) {
        ms.completed = true;
        ms.completedAt = new Date().toISOString();
      }
    }
  }

  async logEvent(missionId: string, eventType: string, payload: Record<string, any>): Promise<void> {
    this.events.push({ missionId, type: eventType, payload });
  }
}
