import { NormalizedInboundMessage } from '../../channels/normalized-message';
import { JourneySnapshot } from './conversation-context';
import { db } from '@/db';
import { projects, hermesJourneys, hermesJourneyStages, hermesActorJourneys } from '@/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';

export interface JourneyEnginePort {
  retrieveContext(normalized: NormalizedInboundMessage): Promise<JourneySnapshot>;
}

export class JourneyEngine implements JourneyEnginePort {
  
  /**
   * Orchestrates the retrieval of the active Journey and its corresponding state
   * for the given actor within the organization from persistent DB.
   */
  async retrieveContext(normalized: NormalizedInboundMessage): Promise<JourneySnapshot> {
    const actorId = normalized.actor.externalActorId;
    const organizationId = normalized.organizationId;
    
    try {
      // 1. Resolve project/organization (dual-read: UUID or slug)
      const project = await db.query.projects.findFirst({
        where: or(
          eq(projects.organizationId, organizationId),
          eq(projects.slug, organizationId)
        ),
        columns: { id: true, organizationId: true, slug: true, status: true }
      });

      // 🛡️ SECURITY GUARD (FAIL-CLOSED): If tenant cannot be resolved, fail closed immediately
      if (!project) {
        console.warn(`[JourneyEngine] Security: Tenant '${organizationId}' not found. Failing closed.`);
        return this.buildFailClosedSnapshot(organizationId);
      }

      const canonicalOrgId = project.organizationId;
      const orgSlug = project.slug;

      // 2. Query active default journey strictly isolated to this tenant's UUID / slug
      const activeJourney = await db.query.hermesJourneys.findFirst({
        where: and(
          or(
            eq(hermesJourneys.organizationId, canonicalOrgId),
            eq(hermesJourneys.organizationId, orgSlug)
          ),
          eq(hermesJourneys.status, 'ACTIVE')
        ),
        orderBy: [asc(hermesJourneys.createdAt)]
      });

      if (!activeJourney) {
        console.warn(`[JourneyEngine] No active journey found for tenant '${canonicalOrgId}'. Failing closed.`);
        return this.buildFailClosedSnapshot(canonicalOrgId);
      }

      // 3. Load stages for this journey
      const stages = await db
        .select()
        .from(hermesJourneyStages)
        .where(eq(hermesJourneyStages.journeyId, activeJourney.id))
        .orderBy(asc(hermesJourneyStages.orderIndex));

      if (stages.length === 0) {
        console.warn(`[JourneyEngine] Journey '${activeJourney.id}' has no stages. Failing closed.`);
        return this.buildFailClosedSnapshot(canonicalOrgId);
      }

      // 4. Query or initialize actor journey progress strictly scoped to this tenant AND this actor
      const actorJourney = await db.query.hermesActorJourneys.findFirst({
        where: and(
          or(
            eq(hermesActorJourneys.organizationId, canonicalOrgId),
            eq(hermesActorJourneys.organizationId, orgSlug)
          ),
          eq(hermesActorJourneys.actorId, actorId),
          eq(hermesActorJourneys.status, 'IN_PROGRESS')
        )
      });

      const currentStage = stages.find(s => s.name === actorJourney?.currentStageId || s.id === actorJourney?.currentStageId) || stages[0]!;
      const objectives = Array.isArray(currentStage.objectives) ? (currentStage.objectives as string[]) : [currentStage.name];

      // Compute transitions strictly within this journey's stages
      const allowedTransitions = stages
        .filter(s => s.id !== currentStage.id)
        .map(s => s.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'));

      if (allowedTransitions.length === 0) {
        allowedTransitions.push('STAGE_COMPLETED', 'JOURNEY_ADVANCED');
      }

      return {
        journeyId: activeJourney.id,
        currentStage: currentStage.name,
        objectives,
        allowedTransitions
      };
    } catch (err) {
      console.error(`[JourneyEngine] Error resolving journey for org ${organizationId}:`, err);
      return this.buildFailClosedSnapshot(organizationId);
    }
  }

  /**
   * 🛡️ Strict Fail-Closed Snapshot:
   * Returns a zero-permission, empty objective context. Never degrades into generic
   * cross-tenant trial contexts that could leak instructions or assumptions.
   */
  private buildFailClosedSnapshot(organizationId: string): JourneySnapshot {
    return {
      journeyId: `unassigned_${organizationId}`,
      currentStage: 'UNASSIGNED',
      objectives: [],
      allowedTransitions: []
    };
  }
}
