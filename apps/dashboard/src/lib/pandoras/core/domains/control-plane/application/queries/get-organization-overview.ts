import { ControlPlaneContext } from '../context';
import { OrganizationOverviewView } from '../../view-models';
import { MissionRepository } from '~/lib/pandoras/ports/repositories/mission-repository.interface';
import { OperationalIntentRepository } from '~/lib/pandoras/core/ports/repositories/operational-intent-repository.interface';
import { db } from '~/db';
import { projects, installedProducts } from '~/db/schema';
import { eq, sql } from 'drizzle-orm';

export class GetOrganizationOverviewQuery {
  constructor(
    private readonly intentRepo: OperationalIntentRepository,
    private readonly missionRepo: MissionRepository
  ) {}
  
  async execute(context: ControlPlaneContext, requestedOrganizationId: string): Promise<OrganizationOverviewView> {
    const scope = context.requireOrganizationScope(requestedOrganizationId);

    // Consulta de datos reales:
    const pendingIntents = await this.intentRepo.findPending(scope);
    
    // Obtener info del proyecto / organización:
    const project = await this.findProject(requestedOrganizationId);

    let packsCount = 0;
    if (project) {
      const packsResult = await db.select({ count: sql<number>`count(*)` })
        .from(installedProducts)
        .where(eq(installedProducts.projectId, project.id));
      packsCount = packsResult[0]?.count ?? 0;
    }
      
    // Obtener la misión activa actual (si hay):
    const activeMission = await this.missionRepo.getActiveMission(requestedOrganizationId);

    return {
      organizationId: requestedOrganizationId,
      name: project?.name ?? "Unknown Organization",
      metrics: {
        activeGoals: activeMission ? 1 : 0, 
        activeMissions: activeMission ? 1 : 0,
        pendingDecisions: pendingIntents.length,
        installedPacks: Number(packsCount) || 0
      },
      currentStrategicActivity: activeMission ? {
        missionId: activeMission.id,
        missionName: activeMission.goal.objective,
        phase: activeMission.currentPhase,
        progressPercentage: this.calculateMissionProgress(activeMission),
        nextAction: pendingIntents.length > 0 ? "Review Pending Proposal" : "Execute Strategy",
        status: pendingIntents.length > 0 ? "Awaiting Governance" : "Operational"
      } : undefined
    };
  }

  private async findProject(requestedOrganizationId: string): Promise<{ id: number; slug: string; name: string } | undefined> {
    if (!requestedOrganizationId.startsWith('org_')) return undefined;
    
    const [project] = await db.select({ id: projects.id, slug: projects.slug, name: projects.title })
      .from(projects)
      .where(eq(projects.slug, requestedOrganizationId.slice(4)))
      .limit(1);
    return project;
  }

  private calculateMissionProgress(mission: any): number {
    if (!mission.milestones || mission.milestones.length === 0) return 0;
    const completed = mission.milestones.filter((m: any) => m.completed).length;
    return Math.round((completed / mission.milestones.length) * 100);
  }
}
