import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { marketingLeads, projects } from "@/db/schema";
import { eq, and, gte, lte, desc, ilike, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/growth-os/leads
 *
 * Returns a paginated list of marketing leads for Bull's Lab.
 * Requires API key with: read:growth_os
 *
 * Query params:
 *   ?projectSlug=narai       -- Filter by project slug
 *   ?status=converted        -- Filter by status
 *   ?quality=high            -- Filter by quality (low|medium|high)
 *   ?intent=invest           -- Filter by intent
 *   ?since=2026-04-01        -- ISO date - created after
 *   ?limit=50                -- Max results (default 50, max 200)
 *   ?offset=0                -- Pagination offset
 */
export async function GET(req: NextRequest) {
  const { client, error } = await validateExternalKey(req, "read:growth_os");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);

    const projectSlug = searchParams.get("projectSlug") || null;
    const status      = searchParams.get("status") || null;
    const quality     = searchParams.get("quality") || null;
    const intent      = searchParams.get("intent") || null;
    const since       = searchParams.get("since") || null;
    const limitRaw    = parseInt(searchParams.get("limit") || "50", 10);
    const offset      = parseInt(searchParams.get("offset") || "0", 10);
    const limit       = Math.min(limitRaw, 200); // Hard cap

    // Resolve project filter
    let projectId: number | null = null;
    if (projectSlug) {
      const project = await db.query.projects.findFirst({
        where: eq(projects.slug, projectSlug),
        columns: { id: true },
      });
      if (!project) {
        return NextResponse.json({ error: `Project '${projectSlug}' not found` }, { status: 404 });
      }
      projectId = project.id;
    }

    // Build conditions
    const conditions: any[] = [eq(marketingLeads.isDeleted, false)];
    if (projectId)    conditions.push(eq(marketingLeads.projectId, projectId));
    if (status)       conditions.push(eq(marketingLeads.status, status as any));
    if (quality)      conditions.push(eq(marketingLeads.quality, quality as any));
    if (intent)       conditions.push(eq(marketingLeads.intent, intent as any));
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) conditions.push(gte(marketingLeads.createdAt, sinceDate));
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    // Count total (for pagination metadata)
    const countResult = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(marketingLeads)
      .where(whereClause);
    const total = countResult[0]?.total ?? 0;

    // Fetch leads
    const leads = await db.query.marketingLeads.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(marketingLeads.createdAt)],
      columns: {
        id: true,
        projectId: true,
        email: true,         // Full email — internal use only
        name: true,
        walletAddress: true,
        phoneNumber: true,
        status: true,
        quality: true,
        intent: true,
        score: true,
        origin: true,
        referrer: true,
        conversionValue: true,
        probability: true,
        lastAction: true,
        lastEngagementAt: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
      },
    });

    // Resolve project names for display
    const projectIds = [...new Set(leads.map(l => l.projectId).filter(Boolean))];
    const projectMap: Record<number, string> = {};
    if (projectIds.length > 0) {
      const projectRows = await db.query.projects.findMany({
        where: (p, { inArray }) => inArray(p.id, projectIds as number[]),
        columns: { id: true, slug: true, title: true },
      });
      projectRows.forEach(p => { projectMap[p.id] = p.slug; });
    }

    const enrichedLeads = leads.map(lead => ({
      ...lead,
      project_slug: lead.projectId ? projectMap[lead.projectId] ?? null : null,
    }));

    return NextResponse.json({
      success: true,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
      leads: enrichedLeads,
    });
  } catch (e: any) {
    console.error("[external:growth-os:leads] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
