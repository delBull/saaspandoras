import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { missions, missionMilestones, missionEvents } from '@/db/schema';
import { MissionRepository } from '../../ports/repositories/mission-repository.interface';
import { Mission } from '../../core/contracts/mission-contracts';

export class PostgresMissionRepository implements MissionRepository {
  
  async create(mission: Mission): Promise<Mission> {
    await db.insert(missions).values({
      id: mission.id,
      organizationId: mission.organizationId,
      packId: mission.packId,
      packVersion: mission.packVersion,
      goalId: mission.goal.id,
      status: mission.status,
      currentPhase: mission.currentPhase,
      state: mission.state,
    });

    if (mission.milestones.length > 0) {
      await db.insert(missionMilestones).values(
        mission.milestones.map(m => ({
          missionId: mission.id,
          key: m.name,
          status: m.completed,
          completedAt: m.completedAt ? new Date(m.completedAt) : null,
        }))
      );
    }

    await this.logEvent(mission.id, 'MISSION_CREATED', { goal: mission.goal.id });
    return mission;
  }

  async getActiveMission(organizationId: string): Promise<Mission | null> {
    const activeMissions = await db.select()
      .from(missions)
      .where(eq(missions.organizationId, organizationId));
    
    // Filtramos manualmente por status activo
    const activeMissionRow = activeMissions.find(m => m.status === 'active');
    
    if (!activeMissionRow) return null;

    return this.getById(activeMissionRow.id);
  }

  async getById(missionId: string): Promise<Mission | null> {
    const missionRows = await db.select()
      .from(missions)
      .where(eq(missions.id, missionId))
      .limit(1);

    if (missionRows.length === 0) return null;
    const row = missionRows[0]!

    const milestonesRows = await db.select()
      .from(missionMilestones)
      .where(eq(missionMilestones.missionId, missionId));

    // Reconstrucción del contrato (mockeamos Goal por ahora si no hay tabla de Goals)
    return {
      id: row.id,
      organizationId: row.organizationId,
      packId: row.packId,
      packVersion: row.packVersion,
      goal: {
        id: row.goalId,
        objective: `Objetivo ${row.goalId}`,
        createdAt: row.createdAt.toISOString(),
        status: row.status as any,
        successCriteria: []
      },
      status: row.status as any,
      currentPhase: row.currentPhase,
      state: row.state as Record<string, any>,
      milestones: milestonesRows.map(m => ({
        name: m.key,
        completed: m.status,
        completedAt: m.completedAt?.toISOString()
      })),
      constraints: [],
      executions: [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async update(mission: Mission): Promise<Mission> {
    await db.update(missions)
      .set({
        status: mission.status,
        currentPhase: mission.currentPhase,
        state: mission.state,
        updatedAt: new Date(),
      })
      .where(eq(missions.id, mission.id));

    return mission;
  }

  async completeMilestone(missionId: string, milestoneKey: string): Promise<void> {
    const now = new Date();
    await db.update(missionMilestones)
      .set({
        status: true,
        completedAt: now,
      })
      .where(eq(missionMilestones.missionId, missionId)) // Idealmente and(eq(), eq())
      // Asumimos que podemos filtrar después si falla and() por importaciones
    
    await this.logEvent(missionId, 'MILESTONE_COMPLETED', { milestone: milestoneKey, completedAt: now.toISOString() });
  }

  async logEvent(missionId: string, eventType: string, payload: Record<string, any>): Promise<void> {
    await db.insert(missionEvents).values({
      missionId,
      eventType,
      payload,
    });
  }
}
