import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { marketingLeads, courses } from '@/db/schema';
import { GrowthActionType, LeadContextPayload, ProjectContextPayload, GrowthMetadata, LeadState, GrowthHistoryEntry } from './types';
import { notificationService, ensureNotificationServiceConfigured } from '@/lib/notifications';

// Stub for the actual email sender
import { sendExploreWelcomeEmail, sendInvestWelcomeEmail } from '@/lib/marketing/growth-engine/email-senders';

export async function executeGrowthActions(
  actions: GrowthActionType[],
  context: { lead: LeadContextPayload; project: ProjectContextPayload }
) {
  // 0. Configuration & Security
  const SAFE_MODE = process.env.GROWTH_SAFE_MODE === 'true';

  // 1. READ-AFTER-WRITE CONSISTENCY & OPTIMISTIC LOCKING PREP
  const freshLead = await db.query.marketingLeads.findFirst({
    where: eq(marketingLeads.id, context.lead.id),
    columns: { metadata: true, email: true, updatedAt: true }
  });

  if (!freshLead) {
    console.warn(`[Growth Engine] Lead ${context.lead.id} disappeared.`);
    return;
  }

  const { lead, project } = context;

  // 2. Metadata Initialization
  const currentMetadata = (freshLead.metadata || {}) as any;
  const growthMetadata: GrowthMetadata = currentMetadata.growth || {
    state: 'NEW',
    updatedAt: Date.now(),
    history: [],
    executedActions: {},
    failedActions: {},
    executingActions: {}
  };

  // Ensure fields exist (for legacy leads)
  if (!growthMetadata.failedActions) growthMetadata.failedActions = {};
  if (!growthMetadata.executingActions) growthMetadata.executingActions = {};
  if (!growthMetadata.executedActions) growthMetadata.executedActions = {};

  const newlyExecuted: GrowthActionType[] = [];
  const failures: Record<string, string> = {};

  for (const action of actions) {
    // IDEMPOTENCY CHECK (O(1))
    if (growthMetadata.executedActions[action]) {
      continue;
    }

    // CONCURRENCY LOCK (Action Level)
    if (growthMetadata.executingActions[action]) {
      console.warn(`[Growth Engine] Action ${action} is already executing for ${lead.email}. Skipping.`);
      continue;
    }

    try {
      // Set lock
      growthMetadata.executingActions[action] = true;

      if (SAFE_MODE && (action.includes('SEND_WELCOME') || action.includes('NOTIFY') || action.includes('EMAIL'))) {
         console.log(`[Growth Engine] SAFE MODE: Skipped ${action}`);
         newlyExecuted.push(action); 
         delete growthMetadata.executingActions[action];
         continue;
      }

      let success = false;

      switch (action) {
    case 'SEND_WELCOME_EXPLORE_D1': {
          const res = await sendExploreWelcomeEmail({
            to: lead.email,
            projectName: project.name,
            differentiator: project.differentiator || 'Innovando en la Web3',
            projectSlug: project.slug,
            baseUrl: (project as any).baseUrl
          });
          success = res.success;
          break;
        }

        case 'SEND_WELCOME_INVEST_D1': {
          const res = await sendInvestWelcomeEmail({
            to: lead.email,
            projectName: project.name,
            projectSlug: project.slug,
            baseUrl: (project as any).baseUrl
          });
          success = res.success;
          break;
        }

        case 'NOTIFY_TEAM':
          ensureNotificationServiceConfigured();
          success = await notificationService.notifyGrowthLead(lead, project);
          break;

        case 'ASSIGN_COURSE':
          const courseLink = await discoverOrGenerateCourse(project);
          console.log(`[Growth Engine] Assigned course: ${courseLink}`);
          success = true; // Assignment is logical success
          break;
          
        case 'UNLOCK_REWARD':
          console.log(`[Growth Engine] Mock: Unlocked reward`);
          success = true;
          break;

        default:
          console.warn(`[Growth Engine] Unknown action: ${action}`);
          success = false;
      }

      if (success) {
        newlyExecuted.push(action);
        // Remove from failed if it was there before
        if (growthMetadata.failedActions[action]) {
            delete growthMetadata.failedActions[action];
        }
      } else {
        failures[action] = "Action returned false or skipped (check logs)";
      }
      
    } catch (error: any) {
       console.error(`[Growth Engine] Error in ${action}:`, error);
       failures[action] = error.message || String(error);
    } finally {
       // Release lock
       delete growthMetadata.executingActions[action];
    }
  }

  // 3. Persist Changes with OPTIMISTIC LOCKING
  if (newlyExecuted.length > 0 || Object.keys(failures).length > 0) {
    // Update executed map
    for (const action of newlyExecuted) {
        growthMetadata.executedActions[action] = true;
    }

    // Update failures map
    for (const [action, err] of Object.entries(failures)) {
        growthMetadata.failedActions[action] = {
            error: err,
            at: Date.now()
        };
    }
    
    currentMetadata.growth = growthMetadata;
    
    // THE BLINDAJE: Optimistic locking condition
    const updateResult = await db.update(marketingLeads)
      .set({ 
        metadata: currentMetadata,
        updatedAt: new Date() // Standard auto-update
      })
      .where(and(
        eq(marketingLeads.id, lead.id),
        eq(marketingLeads.updatedAt, freshLead.updatedAt as any) // Guard against parallel updates
      ));

    if (updateResult.length === 0) {
        console.error(`[Growth Engine] OPTIMISTIC LOCK FAILURE for ${lead.email}. Another worker updated the lead. ${newlyExecuted.length} actions might be duplicated in next run.`);
    } else {
        console.log(`[Growth Engine] Successfully persisted ${newlyExecuted.length} actions for ${lead.email}`);
    }
  }
}

/**
 * Utility to compute the new Growth Metadata object safely without running side-effects.
 */
export function computeNextGrowthMetadata(
  currentMetadata: any,
  nextState: LeadState
): GrowthMetadata {
  const meta = currentMetadata || {};
  const growth: GrowthMetadata = meta.growth || {
    state: 'NEW',
    updatedAt: Date.now(),
    history: [],
    executedActions: {},
    failedActions: {},
    executingActions: {}
  };

  if (growth.state !== nextState) {
    growth.history.push({
      state: growth.state,
      at: growth.updatedAt
    });
    growth.state = nextState;
    growth.updatedAt = Date.now();
  }

  // Migrations
  if (Array.isArray(growth.executedActions)) {
      const map: Record<string, boolean> = {};
      (growth.executedActions as any).forEach((a: string) => map[a] = true);
      growth.executedActions = map;
  }
  if (!growth.failedActions) growth.failedActions = {};
  if (!growth.executingActions) growth.executingActions = {};

  return growth;
}

/**
 * PHASE 2: Moat Bridge - Finds an existing course or triggers AI generation
 */
async function discoverOrGenerateCourse(project: ProjectContextPayload): Promise<string> {
    const activeCondition = (courses: any, { eq, or, ilike, and }: any) => 
        and(
            eq(courses.isActive, true),
            or(
                ilike(courses.title, `%${project.name}%`),
                eq(courses.category, project.businessCategory || 'Web3'),
                ilike(courses.description, `%${project.name}%`)
            )
        );

    const existing = await db.query.courses.findFirst({
        where: activeCondition
    });

    if (existing) {
        return `https://dash.pandoras.finance/education/courses/${existing.id}`;
    }

    const draftId = `draft-${project.slug}`;
    const existingDraft = await db.query.courses.findFirst({
        where: (courses, { eq }) => eq(courses.id, draftId)
    });

    if (existingDraft) {
        return `https://dash.pandoras.finance/education/courses/${existingDraft.id}`;
    }

    // 3. Create NEW Project-Specific Course Draft
    try {
        // Idempotent Insert using prefix-based ID
        await db.insert(courses).values({
            id: draftId,
            title: `Masterclass: ${project.name}`,
            description: `Curso personalizado generado por IA para profundizar en ${project.name}.`,
            category: project.businessCategory || 'Web3',
            difficulty: 'beginner',
            duration: '15 min',
            isActive: false, 
            instructor: "Pandora's AI Architect",
            modules: [],
            skillsCovered: ['Quick Onboarding', project.name],
            createdAt: new Date(),
            updatedAt: new Date()
        } as any);

        return `https://dash.pandoras.finance/education/courses/${draftId}`;
    } catch (insertErr) {
        // If someone else inserted it between our check and now, just ignore and return the link
        console.warn(`[Growth Engine] Course draft insertion conflict for ${project.name}. Probably already exists.`);
        return `https://dash.pandoras.finance/education/courses/${draftId}`;
    }
}
