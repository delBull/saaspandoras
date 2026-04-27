import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/db';
import { marketingLeads, courses, growthActionsLog, projects } from '@/db/schema';
import { GrowthActionType, LeadContextPayload, ProjectContextPayload, GrowthMetadata, LeadState } from './types';
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
  sendGenesisWelcomeEmail,
  sendEducationalNurtureEmail,
  sendVIPConciergeEmail,
  sendPostPurchaseSuccessEmail
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
  scoreChange: number = 0,
  engineResult?: any
) {
  const startTime = Date.now();
  const { lead, project } = context;

  if (!lead.email && !lead.id) {
    console.warn(`[Growth Engine] Skipping actions for lead: incomplete identity.`);
    return;
  }

  // 1. SERIALIZED EXECUTION LOCK (Safety: Audit 8 - HIGH CONCURRENCY)
  // We use a transaction with FOR UPDATE on the lead record to serialize parallel runs for the SAME user.
  return await db.transaction(async (tx) => {
    // Acquire exclusive lock on the lead record
    const [lockedLead] = await tx.select()
        .from(marketingLeads)
        .where(eq(marketingLeads.id, lead.id as any))
        .for('update');
    
    if (!lockedLead) {
        console.error(`[Growth Engine] ❌ CRITICAL: Could not acquire lock for lead ${lead.id}`);
        return { success: false, error: 'Lock acquisition failed' };
    }

    // Refresh context from locked record to get the most recent state
    const freshMetadata = (lockedLead.metadata || {}) as any;
    const growthMetadata: GrowthMetadata = freshMetadata.growth || {
      state: 'CURIOUS',
      updatedAt: Date.now(),
      history: [],
      executedActions: {},
      failedActions: {},
      executingActions: {}
    };

    for (const action of actions) {
        // 2.5. ATOMIC IDEMPOTENCY GUARD (Safety: Audit 7.5 - UNIVERSAL)
        // Since we are inside a FOR UPDATE transaction, this check is now 100% atomic across processes.
        const recentGlobalExec = await tx.query.growthActionsLog.findFirst({
            where: and(
                eq(growthActionsLog.leadId, lead.id as any),
                eq(growthActionsLog.actionType, action),
                gt(growthActionsLog.executedAt, new Date(Date.now() - 60000)) // 60s safety window
            )
        });

        if (recentGlobalExec) {
            console.error(`[Growth OS] 🛡️ IDEMPOTENCY GUARD: ${action} already executed or in progress for ${lead.email}. Skipping.`);
            continue;
        }

        // Pre-claim the execution IMMEDIATELY
        await tx.insert(growthActionsLog).values({
            leadId: lead.id as any,
            ruleId: ruleInfo?.ruleId || 'SYSTEM_ACTION',
            ruleCondition: ruleInfo?.ruleCondition || 'UPGRADE_LOCK',
            actionType: action,
            status: 'pending',
            executionTimeMs: 0,
            metadata: { projectSlug: project.slug, email: lead.email, lock: true }
        });

        let success = false;
        const actionStartTime = Date.now();

        try {
            switch (action) {
                case 'SEND_WELCOME_EXPLORE_D1': {
                    if (lead.email) {
                        const res = await sendExploreWelcomeEmail({
                            to: lead.email as string,
                            projectName: project.name,
                            differentiator: project.differentiator || 'Innovando en la Web3',
                            projectSlug: project.slug,
                            baseUrl: (project as any).baseUrl,
                            whatsappPhone: project.whatsappPhone || undefined
                        });
                        success = res.success;
                    } else {
                        success = true;
                    }
                    break;
                }

                case 'SEND_WELCOME_INVEST_D1': {
                    if (lead.email) {
                        const res = await sendInvestWelcomeEmail({
                            to: lead.email as string,
                            projectName: project.name,
                            projectSlug: project.slug,
                            baseUrl: (project as any).baseUrl,
                            whatsappPhone: project.whatsappPhone || undefined
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
                    // --- DUAL LAYER GUARD ---
                    if (growthMetadata.executedActions?.[action]) {
                        console.log(`[Growth OS] 🛡️ Metadata block: ${action} for ${lead.email}`);
                        success = true; break;
                    }

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
                    // --- DUAL LAYER GUARD ---
                    if (growthMetadata.executedActions?.[action]) {
                        console.log(`[Growth OS] 🛡️ Metadata block: ${action} for ${lead.email}`);
                        success = true; break;
                    }

                    const res = await sendWaitlistSequenceEmail({
                      to: lead.email as string,
                      step: 1,
                      projectName: project.name,
                      projectSlug: project.slug,
                      brandHeader: project.name?.toUpperCase() + " // ACCESO EXCLUSIVO",
                      engagementLevel: lead.engagementLevel,
                      whatsappPhone: project.whatsappPhone || undefined
                    });
                    success = res.success;
                  } else {
                    success = true;
                  }
                  break;
                }

                case 'SEND_WAITLIST_NARRATIVE_D1': {
                  if (lead.email) {
                    // --- DUAL LAYER GUARD ---
                    if (growthMetadata.executedActions?.[action]) {
                        console.log(`[Growth OS] 🛡️ Metadata block: ${action} for ${lead.email}`);
                        success = true; break;
                    }

                    const res = await sendWaitlistSequenceEmail({
                      to: lead.email as string,
                      step: 2,
                      projectName: project.name,
                      projectSlug: project.slug,
                      brandHeader: project.name?.toUpperCase() + " // ACCESO EXCLUSIVO",
                      engagementLevel: lead.engagementLevel,
                      whatsappPhone: project.whatsappPhone || undefined
                    });
                    success = res.success;
                  } else {
                    success = true;
                  }
                  break;
                }

                case 'SEND_WAITLIST_STATUS_D2': {
                  if (lead.email) {
                    // --- DUAL LAYER GUARD ---
                    if (growthMetadata.executedActions?.[action]) {
                        console.log(`[Growth OS] 🛡️ Metadata block: ${action} for ${lead.email}`);
                        success = true; break;
                    }

                    const res = await sendWaitlistSequenceEmail({
                      to: lead.email as string,
                      step: 3,
                      projectName: project.name,
                      projectSlug: project.slug,
                      brandHeader: project.name?.toUpperCase() + " // ACCESO EXCLUSIVO",
                      engagementLevel: lead.engagementLevel,
                      whatsappPhone: project.whatsappPhone || undefined
                    });
                    success = res.success;
                  } else {
                    success = true;
                  }
                  break;
                }

                case 'SEND_WAITLIST_ACTIVATION_D3': {
                  if (lead.email) {
                    // --- DUAL LAYER GUARD ---
                    if (growthMetadata.executedActions?.[action]) {
                        console.log(`[Growth OS] 🛡️ Metadata block: ${action} for ${lead.email}`);
                        success = true; break;
                    }

                    const res = await sendWaitlistSequenceEmail({
                      to: lead.email as string,
                      step: 4,
                      projectName: project.name,
                      projectSlug: project.slug,
                      brandHeader: project.name?.toUpperCase() + " // ACCESO EXCLUSIVO",
                      engagementLevel: lead.engagementLevel,
                      whatsappPhone: project.whatsappPhone || undefined
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
                      to: lead.email as string,
                      projectName: project.name,
                      brandHeader: project.name?.toUpperCase() + " // ACCESO EXCLUSIVO",
                      whatsappPhone: project.whatsappPhone || undefined
                    });
                    success = res.success;
                  } else {
                    success = true;
                  }
                  break;
                }

                case 'SEND_VIP_CONCIERGE_WELCOME': {
                  if (lead.email) {
                    // --- DUAL LAYER GUARD ---
                    if (growthMetadata.executedActions?.[action]) {
                        console.log(`[Growth OS] 🛡️ Metadata block: ${action} for ${lead.email}`);
                        success = true; break;
                    }

                    const res = await sendVIPConciergeEmail({
                      to: lead.email as string,
                      projectName: project.name,
                      brandHeader: project.name?.toUpperCase() + " // ESTADO VIP",
                      whatsappPhone: project.whatsappPhone || undefined
                    });
                    success = res.success;
                  } else {
                    success = true;
                  }
                  break;
                }

                case 'NOTIFY_TEAM': {
                    const { classifyIntent, computeBehavioralMetrics } = await import("./engine");
                    
                    // Re-run real-time metrics so VIP overrides appear instantly in the Discord Alert
                    const realtimeMetrics = computeBehavioralMetrics(lead, []);
                    const effectiveScore = Math.max(lockedLead?.score || 0, realtimeMetrics.intentScore);
                    const effectivePriority = realtimeMetrics.priorityScore;

                    const intentCategory = classifyIntent(effectiveScore, growthMetadata.state);

                    if (ruleInfo?.isStressTest) {
                        success = true;
                        break;
                    }

                    // --- DUAL LAYER GUARD ---
                    if (growthMetadata.executedActions?.[action]) {
                        console.log(`[Growth OS] 🛡️ Metadata block: ${action} for ${lead.email}`);
                        success = true; break;
                    }

                    if (project.discordWebhookUrl) {
                        ensureNotificationServiceConfigured();
                        const leadWithScore = { ...lead, score: effectiveScore, priorityScore: effectivePriority };
                        success = await notificationService.notifyGrowthLead(leadWithScore, { ...project, urgencyTier: intentCategory } as any);
                    } else if (intentCategory === 'closing' || intentCategory === 'high') {
                        ensureNotificationServiceConfigured();
                        const leadWithScore2 = { ...lead, score: effectiveScore, priorityScore: effectivePriority };
                        success = await notificationService.notifyGrowthLead(leadWithScore2, { ...project, urgencyTier: intentCategory } as any);
                    } else {
                        success = true;
                    }
                    break;
                }

                case 'SEND_EDUCATIONAL_NURTURE': {
                    if (lead.email) {
                        const courseUrl = await discoverOrGenerateCourse(project);
                        const res = await sendEducationalNurtureEmail({
                            to: lead.email as string,
                            name: lead.name || 'Futuro Colaborador',
                            projectName: project.name,
                            courseUrl
                        });
                        success = res.success;
                    } else {
                        success = true;
                    }
                    break;
                }

                case 'SEND_POST_PURCHASE_SUCCESS': {
                    if (lead.email) {
                        // Fetch fresh project stats for accuracy (Funding %, Phase)
                        const [freshProject] = await tx.select()
                            .from(projects)
                            .where(eq(projects.id, project.id))
                            .limit(1);

                        const raised = Number(freshProject?.raisedAmount || 0);
                        const target = Number(freshProject?.targetAmount || 1);
                        const fundingPercentage = Math.min(100, Math.round((raised / target) * 100));
                        
                        const res = await sendPostPurchaseSuccessEmail({
                            to: lead.email as string,
                            projectName: project.name,
                            projectSlug: project.slug,
                            businessCategory: project.businessCategory || 'other',
                            fundingPercentage,
                            currentPhase: freshProject?.status === 'live' ? 'Participación Abierta' : 'Fase Privada'
                        });
                        success = res.success;
                    } else {
                        success = true;
                    }
                    break;
                }

                default:
                    console.warn(`[Growth Engine] Unknown action: ${action}`);
                    success = true; // Avoid infinite loop/block
            }

            // Update log result within the same transaction
            await tx.update(growthActionsLog)
                .set({
                    status: success ? 'completed' : 'failed',
                    executionTimeMs: Date.now() - actionStartTime
                })
                .where(and(
                    eq(growthActionsLog.leadId, lead.id as any),
                    eq(growthActionsLog.actionType, action),
                    eq(growthActionsLog.status, 'pending')
                ));

            // Update local and DB metadata if successful
            if (success) {
                growthMetadata.executedActions[action] = Date.now();
                await tx.update(marketingLeads)
                    .set({ 
                        metadata: { ...freshMetadata, growth: growthMetadata },
                        score: (lockedLead.score || 0) + (scoreChange || 0),
                        updatedAt: new Date()
                    })
                    .where(eq(marketingLeads.id, lead.id as any));
            }

        } catch (error) {
            console.error(`[Growth Engine] Error executing ${action}:`, error);
            await tx.update(growthActionsLog)
                .set({ status: 'failed', metadata: { error: String(error) } })
                .where(and(eq(growthActionsLog.leadId, lead.id as any), eq(growthActionsLog.actionType, action), eq(growthActionsLog.status, 'pending')));
        }
    }

    return { success: true, actionsExecuted: actions.length };
  });
}

async function discoverOrGenerateCourse(project: ProjectContextPayload): Promise<string> {
    const baseUrl = (project as any).baseUrl || 'https://dash.pandoras.finance';
    const draftId = `draft-${project.slug}`;
    
    const existing = await db.query.courses.findFirst({
        where: (courses, { eq, or, ilike, and }) => 
            and(
                eq(courses.isActive, true),
                or(ilike(courses.title, `%${project.name}%`), eq(courses.category, project.businessCategory || 'Web3'))
            )
    });

    if (existing) return `${baseUrl}/en/education/course/${existing.id}`;

    try {
        await db.insert(courses).values({
            id: draftId,
            title: `Masterclass: ${project.name}`,
            description: `Curso personalizado para ${project.name}.`,
            category: project.businessCategory || 'Web3',
            isActive: false, 
            createdAt: new Date(),
            updatedAt: new Date()
        } as any);
    } catch (e) {}

    return `${baseUrl}/en/education/course/${draftId}`;
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
