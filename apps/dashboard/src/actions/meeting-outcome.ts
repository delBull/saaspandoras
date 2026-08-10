'use server';

import { db } from "@/db";
import { marketingLeads, marketingLeadEvents, daoMembers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getAuth, isAdmin } from "@/lib/auth";

export async function completeMeetingOutcome(
  leadId: string,
  score: 'Excelente' | 'Buena' | 'Regular' | 'Mala',
  notes: string
) {
  try {
    // ZERO TRUST: require a verified session and tenant scope.
    // Only admins or dao_members of the lead's own project may update it.
    const auth = await getAuth();
    if (!auth.isVerified || !auth.session?.address) {
      return { success: false, error: 'No autorizado. Debes iniciar sesión.' };
    }
    const address = auth.session.address;

    const lead = await db.query.marketingLeads.findFirst({
      where: eq(marketingLeads.id, leadId),
      columns: { id: true, projectId: true },
    });
    if (!lead) return { success: false, error: 'Lead no encontrado' };

    const isAdminUser = await isAdmin(address);
    if (!isAdminUser) {
      const membership = await db.select({ id: daoMembers.id })
        .from(daoMembers)
        .where(and(
          eq(daoMembers.wallet, address),
          eq(daoMembers.projectId, lead.projectId)
        ))
        .limit(1);
      if (membership.length === 0) {
        return { success: false, error: 'No autorizado. Sin acceso a este proyecto.' };
      }
    }

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
