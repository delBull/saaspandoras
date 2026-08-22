import { NormalizedInboundMessage } from '../../channels/normalized-message';
import { JourneySnapshot } from './conversation-context';
import { db } from '@/db';
import { projects, hermesJourneys, hermesJourneyStages, hermesJourneyTransitions, hermesActorJourneys } from '@/db/schema';
import { eq, or, and, asc, sql } from 'drizzle-orm';
import { JourneyTransitionValidator } from '../journeys/transition-validator';
import { 
  JourneyActionProposal, 
  ActorJourneyState, 
  JourneyDefinition as DomainJourneyDefinition, 
  JourneyTransition as DomainJourneyTransition 
} from '../journeys/contracts';

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export interface AdvanceActorStageParams {
  organizationId: string;
  actorId: string;
  targetStageId: string;
  expectedCurrentStageId?: string;
  journeyId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AdvanceActorStageResult {
  success: boolean;
  journeyId?: string;
  previousStageId?: string;
  currentStageId?: string;
  reason?: string;
  conflict?: boolean;
}

export interface JourneyEnginePort {
  retrieveContext(normalized: NormalizedInboundMessage): Promise<JourneySnapshot>;
  advanceActorStage(params: AdvanceActorStageParams): Promise<AdvanceActorStageResult>;
}

export class JourneyEngine implements JourneyEnginePort {
  private readonly validator: JourneyTransitionValidator;

  constructor() {
    this.validator = new JourneyTransitionValidator();
  }
  
  /**
   * Orchestrates the retrieval of the active Journey and its corresponding state
   * for the given actor within the organization from persistent DB.
   */
  async retrieveContext(normalized: NormalizedInboundMessage): Promise<JourneySnapshot> {
    const actorId = normalized.actor.externalActorId;
    const organizationId = normalized.organizationId;
    
    try {
      // 1. Resolve project/organization (safe dual-read: UUID or slug)
      const project = await db.query.projects.findFirst({
        where: isUuid(organizationId)
          ? eq(projects.organizationId, organizationId)
          : eq(projects.slug, organizationId),
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
          eq(hermesActorJourneys.journeyId, activeJourney.id),
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
   * 🛡️ Multi-Channel Real-Time Journey Stage Advancement:
   * Validates transition invariants against JourneyTransitionValidator,
   * performs optimistic concurrency checks, and commits atomic upsert to PostgreSQL.
   */
  async advanceActorStage(params: AdvanceActorStageParams): Promise<AdvanceActorStageResult> {
    const { organizationId, actorId, targetStageId, expectedCurrentStageId, reason } = params;

    try {
      // 1. Resolve canonical organization (Fail-Closed)
      const project = await db.query.projects.findFirst({
        where: isUuid(organizationId)
          ? eq(projects.organizationId, organizationId)
          : eq(projects.slug, organizationId),
        columns: { id: true, organizationId: true, slug: true, status: true }
      });

      if (!project) {
        console.warn(`[JourneyEngine] advanceActorStage: Unknown tenant '${organizationId}'. Failing closed.`);
        return { success: false, reason: `Unknown tenant '${organizationId}'` };
      }

      const canonicalOrgId = project.organizationId;
      const orgSlug = project.slug;

      // 2. Fetch Journey
      const activeJourney = params.journeyId
        ? await db.query.hermesJourneys.findFirst({
            where: and(
              eq(hermesJourneys.id, params.journeyId),
              or(
                eq(hermesJourneys.organizationId, canonicalOrgId),
                eq(hermesJourneys.organizationId, orgSlug)
              )
            )
          })
        : await db.query.hermesJourneys.findFirst({
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
        return { success: false, reason: `No active journey found for tenant '${canonicalOrgId}'` };
      }

      // 3. Load stages
      const stages = await db
        .select()
        .from(hermesJourneyStages)
        .where(eq(hermesJourneyStages.journeyId, activeJourney.id))
        .orderBy(asc(hermesJourneyStages.orderIndex));

      if (stages.length === 0) {
        return { success: false, reason: `Journey '${activeJourney.id}' has no stages configured` };
      }

      // 4. Load or initialize actor journey record
      const actorJourney = await db.query.hermesActorJourneys.findFirst({
        where: and(
          or(
            eq(hermesActorJourneys.organizationId, canonicalOrgId),
            eq(hermesActorJourneys.organizationId, orgSlug)
          ),
          eq(hermesActorJourneys.actorId, actorId),
          eq(hermesActorJourneys.journeyId, activeJourney.id),
          eq(hermesActorJourneys.status, 'IN_PROGRESS')
        )
      });

      const currentStage = stages.find(s => s.name === actorJourney?.currentStageId || s.id === actorJourney?.currentStageId) || stages[0]!;
      const currentStageId = currentStage.name;

      // 5. Optimistic Concurrency Check
      if (expectedCurrentStageId && currentStageId !== expectedCurrentStageId && currentStage.id !== expectedCurrentStageId) {
        return {
          success: false,
          conflict: true,
          previousStageId: currentStageId,
          reason: `Optimistic concurrency conflict: expected stage '${expectedCurrentStageId}', but actor is currently at '${currentStageId}'`
        };
      }

      // 6. Check target stage existence
      const targetStage = stages.find(s => 
        s.name.toLowerCase() === targetStageId.toLowerCase() || 
        s.id.toLowerCase() === targetStageId.toLowerCase()
      );

      if (!targetStage && targetStageId !== 'COMPLETE' && targetStageId !== 'ABORT') {
        return {
          success: false,
          reason: `Target stage '${targetStageId}' is not defined in Journey '${activeJourney.id}'`
        };
      }

      // 7. Load explicit transitions from DB or synthesize graph transitions
      const dbTransitions = await db
        .select()
        .from(hermesJourneyTransitions)
        .where(and(
          eq(hermesJourneyTransitions.journeyId, activeJourney.id),
          eq(hermesJourneyTransitions.status, 'ACTIVE')
        ));

      const availableTransitions: DomainJourneyTransition[] = dbTransitions.length > 0
        ? dbTransitions.map(t => ({
            id: t.id,
            journeyId: t.journeyId,
            fromStageId: t.fromStageId,
            toStageId: t.toStageId,
            trigger: t.trigger,
            condition: t.condition,
            priority: t.priority
          }))
        : stages.flatMap((s, idx) => {
            const list: DomainJourneyTransition[] = [
              {
                id: `seq_abort_${s.id}`,
                journeyId: activeJourney.id,
                fromStageId: s.name,
                toStageId: 'ABORT',
                trigger: null,
                condition: null,
                priority: 0
              }
            ];
            // Only allow transition to immediately next stage (linear progression)
            if (idx + 1 < stages.length) {
              list.push({
                id: `seq_fwd_${s.id}`,
                journeyId: activeJourney.id,
                fromStageId: s.name,
                toStageId: stages[idx + 1]!.name,
                trigger: null,
                condition: null,
                priority: 1
              });
            } else {
              list.push({
                id: `seq_complete_${s.id}`,
                journeyId: activeJourney.id,
                fromStageId: s.name,
                toStageId: 'COMPLETE',
                trigger: null,
                condition: null,
                priority: 1
              });
            }
            return list;
          });

      // 8. Validate via Pure Domain JourneyTransitionValidator
      const domainJourney: DomainJourneyDefinition = {
        id: activeJourney.id,
        organizationId: canonicalOrgId,
        name: activeJourney.name,
        description: activeJourney.description,
        version: activeJourney.version,
        status: activeJourney.status as 'ACTIVE' | 'INACTIVE',
        isDefault: activeJourney.isDefault
      };

      const domainActorState: ActorJourneyState = {
        id: actorJourney?.id || `act_${Date.now()}`,
        organizationId: canonicalOrgId,
        actorId,
        journeyId: activeJourney.id,
        journeyVersion: activeJourney.version,
        currentStageId: currentStage.name,
        status: (actorJourney?.status || 'IN_PROGRESS') as 'IN_PROGRESS',
        startedAt: actorJourney?.startedAt || new Date(),
        lastAdvancedAt: actorJourney?.lastAdvancedAt || new Date(),
        completedAt: actorJourney?.completedAt || null
      };

      const proposal: JourneyActionProposal = {
        type: targetStageId === 'COMPLETE' ? 'COMPLETE' : targetStageId === 'ABORT' ? 'ABORT' : 'REQUEST_STAGE_TRANSITION',
        organizationId: canonicalOrgId,
        actorId,
        journeyId: activeJourney.id,
        journeyVersion: activeJourney.version,
        targetStageId: targetStage ? targetStage.name : targetStageId,
        reason: reason || 'Advancing journey via interaction'
      };

      const validationDecision = this.validator.validateTransition(
        proposal,
        domainActorState,
        domainJourney,
        availableTransitions
      );

      if (!validationDecision.allowed) {
        return {
          success: false,
          previousStageId: currentStage.name,
          reason: `Transition rejected by Journey Graph Validator: ${validationDecision.reason}`
        };
      }

      // 9. Atomic Upsert with DB Unique Constraint
      const nextStageName = targetStage ? targetStage.name : targetStageId;
      const isFinal = targetStageId === 'COMPLETE' || targetStageId === 'ABORT';
      const nextStatus = targetStageId === 'COMPLETE' ? 'COMPLETED' : targetStageId === 'ABORT' ? 'ABORTED' : 'IN_PROGRESS';

      await db.insert(hermesActorJourneys).values({
        organizationId: canonicalOrgId,
        actorId,
        journeyId: activeJourney.id,
        journeyVersion: activeJourney.version,
        currentStageId: nextStageName,
        status: nextStatus,
        startedAt: actorJourney?.startedAt || new Date(),
        lastAdvancedAt: new Date(),
        completedAt: isFinal ? new Date() : null,
      }).onConflictDoUpdate({
        target: [hermesActorJourneys.organizationId, hermesActorJourneys.actorId, hermesActorJourneys.journeyId],
        set: {
          currentStageId: nextStageName,
          status: nextStatus,
          journeyVersion: activeJourney.version,
          lastAdvancedAt: new Date(),
          completedAt: isFinal ? new Date() : null,
        }
      });

      return {
        success: true,
        journeyId: activeJourney.id,
        previousStageId: currentStage.name,
        currentStageId: nextStageName,
        reason: validationDecision.reason
      };

    } catch (error: any) {
      console.error(`[JourneyEngine] advanceActorStage failed for ${organizationId}/${actorId}:`, error);
      return { success: false, reason: error.message || 'Internal database error' };
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
