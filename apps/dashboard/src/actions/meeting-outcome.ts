'use server';

import { db } from "@/db";
import { marketingLeads, marketingLeadEvents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function completeMeetingOutcome(
  leadId: string,
  score: 'Excelente' | 'Buena' | 'Regular' | 'Mala',
  notes: string
) {
  try {
    const statusMap: Record<string, string> = {
      Excelente: 'converted',
      Buena: 'active',
      Regular: 'nurturing',
      Mala: 'nurturing',
    };

    const newStatus = statusMap[score] || 'nurturing';

    await db.update(marketingLeads)
      .set({
        status: newStatus as any,
        lastEngagementAt: new Date(),
        metadata: sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{lastMeeting}', ${JSON.stringify({ score, notes, date: new Date().toISOString() })}::jsonb)`,
      })
      .where(eq(marketingLeads.id, leadId));

    await db.insert(marketingLeadEvents).values({
      leadId,
      type: 'meeting_completed',
      payload: { score, notes },
      createdAt: new Date(),
    });

    return { success: true, newStatus };
  } catch (error) {
    console.error('[LeadOutcome] Error:', error);
    return { success: false, error: 'Error al guardar resultado' };
  }
}
