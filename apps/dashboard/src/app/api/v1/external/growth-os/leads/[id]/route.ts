import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { marketingLeads, marketingLeadEvents, growthActionsLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/growth-os/leads/[id]
 *
 * Returns full detail of a single marketing lead including event history.
 * Requires API key with: read:growth_os
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { client, error } = await validateExternalKey(req, "read:growth_os");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const lead = await db.query.marketingLeads.findFirst({
      where: eq(marketingLeads.id, id),
    });

    if (!lead || lead.isDeleted) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Event history
    const events = await db.query.marketingLeadEvents.findMany({
      where: eq(marketingLeadEvents.leadId, id),
      orderBy: [desc(marketingLeadEvents.createdAt)],
      limit: 50,
    });

    // Growth engine actions
    const actions = await db.query.growthActionsLog.findMany({
      where: eq(growthActionsLog.leadId, id),
      orderBy: [desc(growthActionsLog.executedAt)],
      limit: 20,
    });

    // Resolve project
    let project = null;
    if (lead.projectId) {
      const { projects } = await import("@/db/schema");
      project = await db.query.projects.findFirst({
        where: eq(projects.id, lead.projectId),
        columns: { id: true, slug: true, title: true, status: true },
      });
    }

    return NextResponse.json({
      success: true,
      lead: {
        ...lead,
        project,
        events: events.map(e => ({
          id: e.id,
          type: e.type,
          payload: e.payload,
          createdAt: e.createdAt,
        })),
        growth_actions: actions.map(a => ({
          ruleId: a.ruleId,
          actionType: a.actionType,
          status: a.status,
          executedAt: a.executedAt,
        })),
      },
    });
  } catch (e: any) {
    console.error("[external:growth-os:leads:id] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
