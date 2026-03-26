import { db } from '@/db';
import { marketingLeadEvents, marketingLeads } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { GrowthEvent } from './types';
import { computeBehavioralMetrics, resolveGrowthAction } from './engine';
import { executeGrowthActions } from './actions';

/**
 * 🚀 GROWTH OS - EVENT SERVICE
 * Bridge between application code and the Growth Engine.
 * Use this to trigger events programmatically from server-side logic.
 */
export async function processGrowthEvent(
  event: GrowthEvent, 
  leadContext: { id: string; email?: string | null; projectId: number; intent?: string; metadata?: any },
  ruleInfo?: { ruleId?: string; ruleCondition?: string; isStressTest?: boolean }
) {
  try {
    // 1. Fetch full lead with events and project
    const lead = await db.query.marketingLeads.findFirst({
        where: eq(marketingLeads.id, leadContext.id),
        with: { 
          project: true,
          events: {
            orderBy: (events, { desc }) => [desc(events.createdAt)],
            limit: 50
          }
        }
    });

    if (!lead) {
      console.warn(`[Growth OS] Lead ${leadContext.id} not found for event ${event}`);
      return;
    }

    // 2. Log NEW Event
    await db.insert(marketingLeadEvents).values({
        leadId: lead.id,
        type: event,
        payload: {
          system_triggered: true,
          ...leadContext.metadata
        }
    });

    // 2.5 Compute Behavioral Layer (REAL-TIME)
    const { intentScore, engagementLevel } = computeBehavioralMetrics(lead as any, lead.events);
    
    // 3. Resolve Logic via Pure Engine
    const engineResult = resolveGrowthAction(event, {
        ...lead as any,
        intentScore,
        engagementLevel,
        metadata: lead.metadata as any
    }, (lead as any).project);

    // 4. Execute Side Effects (Emails, Notifications, Score Changes)
    if (engineResult) {
      await executeGrowthActions(
        engineResult.actions, 
        { lead: lead as any, project: (lead as any).project },
        { 
            ruleId: engineResult.ruleId || ruleInfo?.ruleId || `SYS_EVENT_${event}`, 
            ruleCondition: engineResult.ruleCondition || ruleInfo?.ruleCondition,
            isStressTest: ruleInfo?.isStressTest
        },
        engineResult.scoreChange
      );
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ [Growth OS] Service Error (${event}):`, error);
    throw error;
  }
}

/**
 * 💓 HEARTBEAT - AUTOMATION TRIGGER
 * Processes all active leads to trigger time-based actions.
 * Recommended interval: Every 6-12 hours via Cron.
 */
export async function processHeartbeat() {
    console.log("💓 [Growth OS] Starting Heartbeat Processing...");
    let processed = 0;
    let errors = 0;

    try {
        // Fetch leads in active/nurturing/scheduled states that aren't converted/archived
        const activeLeads = await db.query.marketingLeads.findMany({
            where: (leads, { inArray }) => inArray(leads.status, [
                'active', 'nurturing', 'whitelisted', 'scheduled'
            ])
        });

        console.log(`💓 [Growth OS] Evaluating ${activeLeads.length} active leads...`);

        for (const lead of activeLeads) {
            try {
                await processGrowthEvent('HEARTBEAT', {
                    id: lead.id,
                    email: lead.email,
                    projectId: lead.projectId,
                    intent: lead.intent,
                    metadata: lead.metadata
                });
                processed++;
            } catch (err) {
                console.error(`❌ [Growth OS] Heartbeat failed for lead ${lead.id}:`, err);
                errors++;
            }
        }

        return { processed, errors };
    } catch (error) {
        console.error("❌ [Growth OS] Heartbeat Critical Error:", error);
        throw error;
    }
}
