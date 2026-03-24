import { db } from '@/db';
import { marketingLeadEvents, marketingLeads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { GrowthEvent } from './types';
import { resolveGrowthAction } from './engine';
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
    // 1. Fetch full lead to ensure context is correct (including project)
    const lead = await db.query.marketingLeads.findFirst({
        where: eq(marketingLeads.id, leadContext.id),
        with: { project: true }
    });

    if (!lead) {
      console.warn(`[Growth OS] Lead ${leadContext.id} not found for event ${event}`);
      return;
    }

    // 2. Log Event (Immutable Audit Trail)
    await db.insert(marketingLeadEvents).values({
        leadId: lead.id,
        type: event,
        payload: {
          system_triggered: true,
          ...leadContext.metadata
        }
    });

    // 3. Resolve Logic via Pure Engine
    const engineResult = resolveGrowthAction(event, {
        ...lead as any,
        metadata: lead.metadata as any
    });

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
