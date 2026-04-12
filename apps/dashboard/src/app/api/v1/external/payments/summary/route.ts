import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { projects, marketingLeads } from "@/db/schema";
import { eq, sql, gte, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/payments/summary
 *
 * Returns aggregated revenue and transaction summary for Bull's Lab.
 * Requires API key with: read:payments
 */
export async function GET(req: NextRequest) {
  const { client, error } = await validateExternalKey(req, "read:payments");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Protocol-level raised amounts (public, non-sensitive)
    const protocolRevenue = await db
      .select({
        slug: projects.slug,
        title: projects.title,
        status: projects.status,
        targetAmount: sql<number>`COALESCE(${projects.targetAmount}::numeric, 0)`,
        raisedAmount: sql<number>`COALESCE(${projects.raisedAmount}::numeric, 0)`,
      })
      .from(projects)
      .where(eq(projects.isDeleted, false));

    const totalRaised = protocolRevenue.reduce((s, p) => s + Number(p.raisedAmount), 0);
    const totalTarget = protocolRevenue.reduce((s, p) => s + Number(p.targetAmount), 0);

    // Converted leads (proxy for "closed won" / paid)
    const convertedLeads     = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.status, "converted"), eq(marketingLeads.isDeleted, false))))[0] ?? { count: 0 };
    const convertedLast7d    = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.status, "converted"), eq(marketingLeads.isDeleted, false), gte(marketingLeads.updatedAt, last7d))))[0] ?? { count: 0 };
    const convertedLast30d   = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.status, "converted"), eq(marketingLeads.isDeleted, false), gte(marketingLeads.updatedAt, last30d))))[0] ?? { count: 0 };

    return NextResponse.json({
      success: true,
      summary: {
        total_raised_usd: totalRaised,
        total_target_usd: totalTarget,
        overall_funding_pct: totalTarget > 0 ? Math.round((totalRaised / totalTarget) * 100) : 0,
        active_protocols: protocolRevenue.filter(p => p.status === "live").length,
        total_protocols: protocolRevenue.length,
      },
      conversions: {
        total: convertedLeads.count,
        last_7d: convertedLast7d.count,
        last_30d: convertedLast30d.count,
      },
      by_protocol: protocolRevenue
        .filter(p => p.status === "live" || p.status === "completed")
        .map(p => ({
          slug: p.slug,
          title: p.title,
          status: p.status,
          raised: Number(p.raisedAmount),
          target: Number(p.targetAmount),
          progress_pct: Number(p.targetAmount) > 0
            ? Math.round((Number(p.raisedAmount) / Number(p.targetAmount)) * 100)
            : 0,
        }))
        .sort((a, b) => b.raised - a.raised),
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[external:payments:summary] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
