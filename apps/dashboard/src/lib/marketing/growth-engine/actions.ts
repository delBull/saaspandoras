import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { marketingLeads, courses, growthActionsLog } from '@/db/schema';
import { GrowthActionType, LeadContextPayload, ProjectContextPayload, GrowthMetadata, LeadState, GrowthHistoryEntry } from './types';
import { notificationService, ensureNotificationServiceConfigured } from '@/lib/notifications';

// Stub for the actual email sender
import { 
  sendExploreWelcomeEmail, 
  sendInvestWelcomeEmail, 
  sendB2BWelcomeEmail, 
  sendB2BFollowupEmail,
  sendCallReminderEmail,
  sendBookingConfirmedEmail,
  sendNoShowRecoveryEmail,
  sendWaitlistSequenceEmail,
  sendGenesisWelcomeEmail
} from '@/lib/marketing/growth-engine/email-senders';

export async function executeGrowthActions(
  actions: GrowthActionType[],
  context: { lead: LeadContextPayload; project: ProjectContextPayload },
  ruleInfo?: { 
    ruleId: string; 
    ruleCondition?: string; 
    bypassCooldown?: boolean;
    overrideGuardrails?: boolean;
    isStressTest?: boolean;
  },
  scoreChange?: number
) {
  const startTime = Date.now();
  // 0. Configuration & Security
  const SAFE_MODE = process.env.GROWTH_SAFE_MODE === 'true';

  // 1. READ-AFTER-WRITE CONSISTENCY & OPTIMISTIC LOCKING PREP
  const freshLead = await db.query.marketingLeads.findFirst({
    where: eq(marketingLeads.id, context.lead.id),
    columns: { metadata: true, email: true, score: true, updatedAt: true }
  });

  if (!freshLead) {
    console.warn(`[Growth Engine] Lead ${context.lead.id} disappeared.`);
    return;
  }

  const { lead, project } = context;

  if (!lead.email && !lead.id) {
    console.warn(`[Growth Engine] Skipping actions for lead: incomplete identity.`);
    return;
  }

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

  // Escape Logic Safeguard (Surgical: Audit 2)
  let wasBypassUsed = !!ruleInfo?.bypassCooldown;
  const lastHotBypass = (growthMetadata as any).lastHotBypass || 0;
  if (wasBypassUsed && (Date.now() - lastHotBypass < 24 * 60 * 60 * 1000)) {
      console.warn(`[Growth Engine] Surgical: HOT bypass rate-limited for ${lead.email}. Reverting to cooldown.`);
      wasBypassUsed = false;
  }

  for (const action of actions) {
    // 3. IDEMPOTENCY & COOLDOWN CHECK (Audit 2 & 7)
    const lastExec = growthMetadata.executedActions[action];
    
    const getCooldown = (a: string) => {
        if (a.includes('WELCOME')) return 24 * 60 * 60 * 1000; // 24h
        if (a === 'SEND_SOW') return 48 * 60 * 60 * 1000; // 48h
        return 0;
    };
    
    const now = Date.now();
    const cooldown = getCooldown(action);

    if (!wasBypassUsed && lastExec) {
        const lastExecTime = typeof lastExec === 'number' ? lastExec : now;
        if (now - lastExecTime < cooldown) {
            console.log(`[Growth Engine] Cooldown active for ${action} on ${lead.email}.`);
            continue;
        }
        
        // Unique state-bound actions shouldn't run twice if cooldown is 0 but they are already done
        if ((action.includes('WELCOME') || action === 'SEND_SOW') && lastExec) {
             continue;
        }
    }

    // Surgical: Revenue Guardrails (Protection)
    const rolling24h = now - (24 * 60 * 60 * 1000);
    const rolling7d = now - (7 * 24 * 60 * 60 * 1000);
    
    const recentActions = Object.entries(growthMetadata.executedActions)
        .filter(([_, t]) => (t as number) > rolling24h);
    const weeklySOWs = Object.entries(growthMetadata.executedActions)
        .filter(([a, t]) => a === 'SEND_SOW' && (t as number) > rolling7d);

    const isOverridden = !!ruleInfo?.overrideGuardrails;

    if (!isOverridden) {
        if (action.includes('EMAIL') && recentActions.filter(([a]) => a.includes('EMAIL')).length >= 2) {
            console.warn(`[Growth Engine] Guardrail: Max 2 emails/day reached for ${lead.email}. Skipping ${action}.`);
            continue;
        }

        if (action === 'SEND_SOW' && weeklySOWs.length >= 2) {
            console.warn(`[Growth Engine] Guardrail: Max 2 SOWs/week reached for ${lead.email}. Skipping ${action}.`);
            continue;
        }
    } else {
        console.warn(`[Growth Engine] 🚩 ADMIN OVERRIDE: Guardrails bypassed for ${lead.email}`);
    }

    // CONCURRENCY LOCK (Action Level)
    if (growthMetadata.executingActions[action]) {
      console.warn(`[Growth Engine] Action ${action} is already executing for ${lead.email}. Skipping.`);
      continue;
    }

    let success = false;
    try {
      // Set lock
      growthMetadata.executingActions[action] = true;

      if (SAFE_MODE && (action.includes('SEND_WELCOME') || action.includes('NOTIFY') || action.includes('EMAIL'))) {
         console.log(`[Growth Engine] SAFE MODE: Skipped ${action}`);
         success = true;
         newlyExecuted.push(action); 
         continue; 
      }

      switch (action) {
        case 'SEND_WELCOME_EXPLORE_D1': {
          if (lead.email) {
            const res = await sendExploreWelcomeEmail({
              to: lead.email as string,
              projectName: project.name,
              differentiator: project.differentiator || 'Innovando en la Web3',
              projectSlug: project.slug,
              baseUrl: (project as any).baseUrl
            });
            success = res.success;
          } else {
            success = true; // Skip gracefully
          }
          break;
        }

        case 'SEND_WELCOME_INVEST_D1': {
          if (lead.email) {
            const res = await sendInvestWelcomeEmail({
              to: lead.email as string,
              projectName: project.name,
              projectSlug: project.slug,
              baseUrl: (project as any).baseUrl
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'SEND_WELCOME_B2B_D1': {
          if (lead.email) {
            const res = await sendB2BWelcomeEmail({
              to: lead.email as string,
              projectName: project.name,
              source: lead.metadata?.source || 'direct',
              subType: lead.metadata?.type || 'general'
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'SEND_FOLLOWUP_B2B_D2': {
          if (lead.email) {
            const res = await sendB2BFollowupEmail({
              to: lead.email as string,
              projectName: project.name,
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'SEND_CALL_REMINDER_D3':
        case 'SEND_CALL_REMINDER_D1':
        case 'SEND_CALL_REMINDER_D0': {
          if (lead.email) {
            const typeMap = {
              'SEND_CALL_REMINDER_D3': 'D-3',
              'SEND_CALL_REMINDER_D1': 'D-1',
              'SEND_CALL_REMINDER_D0': 'D-0'
            } as const;

            const res = await sendCallReminderEmail({
              to: lead.email as string,
              name: lead.name || 'Founder',
              meetingDate: lead.metadata?.booking?.date || 'por confirmar',
              meetingTime: lead.metadata?.booking?.time || 'por confirmar',
              type: typeMap[action]
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'SEND_BOOKING_CONFIRMED': {
          if (lead.email) {
            const res = await sendBookingConfirmedEmail({
              to: lead.email as string,
              name: lead.name || 'Founder',
              meetingDate: lead.metadata?.booking?.date || 'por confirmar',
              meetingTime: lead.metadata?.booking?.time || 'por confirmar',
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'SEND_BOOKING_CANCELLED' as any: // Added handling for cancelled
             console.log(`[Growth Engine] Handling booking cancellation for ${lead.email || 'anonymous'}`);
             success = true;
             break;

        case 'SEND_NO_SHOW_RECOVERY': {
          if (lead.email) {
            const res = await sendNoShowRecoveryEmail({
              to: lead.email as string,
              name: lead.name || 'Founder',
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'SEND_WAITLIST_WELCOME_D0': {
          if (lead.email) {
            const res = await sendWaitlistSequenceEmail({
              to: lead.email as string,
              step: 1
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'SEND_WAITLIST_NARRATIVE_D1': {
          if (lead.email) {
            const res = await sendWaitlistSequenceEmail({
              to: lead.email as string,
              step: 2
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'SEND_WAITLIST_STATUS_D2': {
          if (lead.email) {
            const res = await sendWaitlistSequenceEmail({
              to: lead.email as string,
              step: 3
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'SEND_WAITLIST_ACTIVATION_D3': {
          if (lead.email) {
            const res = await sendWaitlistSequenceEmail({
              to: lead.email as string,
              step: 4
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'SEND_GENESIS_WELCOME': {
          if (lead.email) {
            const res = await sendGenesisWelcomeEmail({
              to: lead.email as string
            });
            success = res.success;
          } else {
            success = true;
          }
          break;
        }

        case 'NOTIFY_TEAM':
          // Extreme: Urgency Tiers (Audit 1)
          const { classifyIntent } = await import("./engine");
          const urgency = classifyIntent(freshLead?.score || 0, (growthMetadata as any).state || 'NEW', currentMetadata);
          
          if (ruleInfo?.isStressTest) {
              console.log(`[Growth Engine] 🧪 MOCK: Notification Tier ${urgency} for ${lead.email || 'anonymous'}`);
              success = true;
          } else {
              ensureNotificationServiceConfigured();
              const leadWithScore = { ...lead, score: lead.score || 0 };
              success = await notificationService.notifyGrowthLead(leadWithScore, { ...project, urgencyTier: urgency } as any);
          }
          break;

        case 'ASSIGN_COURSE':
          // Mock discovery
          console.log(`[Growth Engine] Assigned course to ${lead.email || 'anonymous'}`);
          success = true;
          break;
          
        case 'UNLOCK_REWARD':
          console.log(`[Growth Engine] Mock: Unlocked reward`);
          success = true;
          break;

        case 'GENERATE_LEAD_BRIEF': {
          // Mock generation
          console.log(`[Growth Engine] Brief generated for ${lead.email || 'anonymous'}`);
          success = true;
          break;
        }

        case 'SEND_SOW': {
            // SOW (Statement of Work) logic
            if (ruleInfo?.isStressTest) {
                console.log(`[Growth Engine] 🧪 MOCK: SOW Sent to ${lead.email || 'anonymous'}`);
                success = true;
            } else if (lead.email) {
                ensureNotificationServiceConfigured();
                success = await notificationService.notifyGrowthLead({
                    ...lead,
                    metadata: { ...lead.metadata, system_note: 'HOT LEAD: SEND SOW IMMEDIATELY' }
                }, project);
            } else {
                success = true;
            }
            break;
        }

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

       // 4. Audit Trail (Audit 3 & 7: Elite Tracking)
       try {
           const { growthActionsLog } = await import("@/db/schema");
           await db.insert(growthActionsLog).values({
               leadId: lead.id,
               ruleId: ruleInfo?.ruleId || 'SYSTEM_ACTION',
               ruleCondition: ruleInfo?.ruleCondition || 'Condition Met',
               actionType: action,
               status: success ? 'completed' : 'failed',
               executionTimeMs: Date.now() - startTime,
               inputSnapshot: { 
                   score: freshLead?.score, 
                   metadata: { ...currentMetadata, growth: undefined } 
               },
               metadata: { projectSlug: project.slug, email: lead.email, isStress: ruleInfo?.isStressTest }
           });

           // Performance Alart (Audit 7: Surgical)
           const duration = Date.now() - startTime;
           if (duration > 200) {
               console.warn(`[Growth Engine] 🚨 Performance Alert: Action ${action} took ${duration}ms for ${lead.email}`);
           }
       } catch (logErr) {
       }
    }
  }

  // 3. Persist Changes with OPTIMISTIC LOCKING
  if (newlyExecuted.length > 0 || Object.keys(failures).length > 0) {
    // Update executed map with timestamps (Audit 7)
    for (const action of newlyExecuted) {
        growthMetadata.executedActions[action] = Date.now();
    }

    if (wasBypassUsed) {
        (growthMetadata as any).lastHotBypass = Date.now();
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
        score: (freshLead.score || 0) + (scoreChange || 0),
        lastAction: newlyExecuted[newlyExecuted.length - 1] || lead.lastAction,
        updatedAt: new Date() 
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

    const baseUrl = (project as any).baseUrl || 'https://dash.pandoras.finance';

    const existing = await db.query.courses.findFirst({
        where: activeCondition
    });

    if (existing) {
        return `${baseUrl}/en/education/course/${existing.id}`;
    }

    const draftId = `draft-${project.slug}`;
    const existingDraft = await db.query.courses.findFirst({
        where: (courses, { eq }) => eq(courses.id, draftId)
    });

    if (existingDraft) {
        return `${baseUrl}/en/education/course/${existingDraft.id}`;
    }

    // 3. Create NEW Project-Specific Course Draft with Generated Modules
    try {
        const modules = generateModulesTemplate(project);
        
        // Idempotent Insert using prefix-based ID
        await db.insert(courses).values({
            id: draftId,
            title: `Masterclass: ${project.name}`,
            description: `Curso personalizado para profundizar en ${project.name} y el ecosistema Pandoras.`,
            category: project.businessCategory || 'Web3',
            difficulty: 'beginner',
            duration: '15 min',
            isActive: false, 
            instructor: "Pandora's AI Architect",
            modules: modules,
            skillsCovered: ['Quick Onboarding', project.name, 'RWA & Tokenization'],
            createdAt: new Date(),
            updatedAt: new Date()
        } as any);

        return `${baseUrl}/en/education/course/${draftId}`;
    } catch (insertErr) {
        // If someone else inserted it between our check and now, just ignore and return the link
        console.warn(`[Growth Engine] Course draft insertion conflict for ${project.name}. Probably already exists.`);
        return `${baseUrl}/en/education/course/${draftId}`;
    }
}

/**
 * Option B: Template-based Module Generator (Guided AI approach)
 * Mixes Project Niche + Pandoras Infrastructure
 */
function generateModulesTemplate(project: ProjectContextPayload) {
  const niche = project.businessCategory || 'Tecnología';
  
  return [
    {
      id: "mod-1",
      title: `Bienvenida a ${project.name}`,
      content: `Hola! En este primer paso conocerás cómo ${project.name} está simplificando el acceso a ${niche}. Olvida lo complicado: aquí descubrirás cómo participar en este ecosistema de forma directa y transparente.`,
      duration: "5 min"
    },
    {
      id: "mod-2",
      title: `Protocolos de Utilidad con Pandoras`,
      content: `Usamos la tecnología de Pandoras Finance para crear "Protocolos de Utilidad". Esto significa que ${project.name} ahora ofrece beneficios reales y tangibles que puedes usar desde el primer día, sin necesidad de ser un experto en finanzas avanzadas.`,
      duration: "5 min"
    },
    {
      id: "mod-3",
      title: `Tus Primeros Pasos`,
      content: `Aprende cómo aprovechar las recompensas y servicios que ${project.name} tiene para ti. Todo está diseñado para que sea tan fácil como usar tu aplicación favorita, permitiéndote ser parte del crecimiento del proyecto de forma segura.`,
      duration: "5 min"
    }
  ];
}

/**
 * GENERATE LEAD BRIEF (Pre-Call Intel)
 * Computes a summary for the admin/team.
 */
function generateLeadBrief(lead: LeadContextPayload, project: ProjectContextPayload): string {
  const history = lead.metadata?.growth?.history || [];
  const score = lead.score || 0;
  const intent = lead.intent || 'explore';
  
  let brief = `LEAD BRIEF: ${lead.name || lead.email}\n`;
  brief += `Project: ${project.name}\n`;
  brief += `Score: ${score} (${score > 100 ? 'HIGH' : 'MEDIUM'})\n`;
  brief += `Intent: ${intent}\n`;
  brief += `States: ${history.map((h: any) => h.state).join(' -> ')}\n`;
  
  if (lead.metadata?.booking) {
    brief += `Booking: ${lead.metadata.booking.date} @ ${lead.metadata.booking.time}\n`;
  }
  
  if (lead.scope === 'b2b') {
    brief += `B2B Focus: Prioritize SOW/MSA discussion.\n`;
  }

  return brief;
}
