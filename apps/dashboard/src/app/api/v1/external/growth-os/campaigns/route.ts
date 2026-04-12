import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { campaigns, campaignStats, demandDrafts, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/growth-os/campaigns
 *
 * Returns active campaigns with their stats for Bull's Lab.
 * Requires API key with: read:growth_os
 *
 * Query params:
 *   ?projectSlug=narai      -- Filter by project slug
 *   ?status=active          -- Filter by status (default: all)
 */
export async function GET(req: NextRequest) {
  const { client, error } = await validateExternalKey(req, "read:growth_os");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const projectSlug = searchParams.get("projectSlug") || null;
    const status = searchParams.get("status") || null;

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

    const allCampaigns = await db.query.campaigns.findMany({
      where: (c, { and, eq }) => {
        const conds: any[] = [];
        if (projectId) conds.push(eq(c.projectId, projectId));
        if (status)    conds.push(eq(c.status, status as any));
        return conds.length > 0 ? and(...conds) : undefined;
      },
      with: {
        stats: true,
        project: {
          columns: { id: true, slug: true, title: true },
        },
      },
      orderBy: [desc(campaigns.createdAt)],
      limit: 100,
    });

    return NextResponse.json({
      success: true,
      total: allCampaigns.length,
      campaigns: allCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        platform: c.platform,
        scope: c.scope,
        status: c.status,
        source: c.source,
        budget: c.budget,
        project: c.project,
        stats: c.stats
          ? {
              impressions: c.stats.impressions,
              clicks: c.stats.clicks,
              leads: c.stats.leads,
              purchases: c.stats.purchases,
              revenue: c.stats.revenue,
              score: c.stats.score,
              ctr: c.stats.impressions > 0
                ? `${((c.stats.clicks / c.stats.impressions) * 100).toFixed(2)}%`
                : "0%",
              lead_rate: c.stats.clicks > 0
                ? `${((c.stats.leads / c.stats.clicks) * 100).toFixed(2)}%`
                : "0%",
              updated_at: c.stats.updatedAt,
            }
          : null,
        created_at: c.createdAt,
      })),
    });
  } catch (e: any) {
    console.error("[external:growth-os:campaigns] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
