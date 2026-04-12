import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { marketingLeads, marketingLeadEvents, marketingIdentities, projects } from "@/db/schema";
import { eq, sql, and, gte, desc, count, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/growth-os/metrics
 *
 * Returns a full Growth OS executive dashboard for Bull's Lab.
 * Requires API key with: read:growth_os
 */
export async function GET(req: NextRequest) {
  const { client, error } = await validateExternalKey(req, "read:growth_os");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7d  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalLeads   = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(eq(marketingLeads.isDeleted, false)))[0] ?? { count: 0 };
    const newLeads24h  = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.isDeleted, false), gte(marketingLeads.createdAt, last24h))))[0] ?? { count: 0 };
    const newLeads7d   = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.isDeleted, false), gte(marketingLeads.createdAt, last7d))))[0] ?? { count: 0 };
    const hotLeads     = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.isDeleted, false), eq(marketingLeads.quality, "high"))))[0] ?? { count: 0 };
    const convertedLeads = (await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(and(eq(marketingLeads.isDeleted, false), eq(marketingLeads.status, "converted"))))[0] ?? { count: 0 };

    // -- QUALITY BREAKDOWN --
    const qualityBreakdown = await db
      .select({
        quality: marketingLeads.quality,
        count: sql<number>`count(*)::int`,
      })
      .from(marketingLeads)
      .where(eq(marketingLeads.isDeleted, false))
      .groupBy(marketingLeads.quality);

    // -- SOURCE BREAKDOWN (Top sources from leads this month) --
    const sourcesRaw = await db
      .select({
        source: marketingLeads.origin,
        count: sql<number>`count(*)::int`,
      })
      .from(marketingLeads)
      .where(and(
        eq(marketingLeads.isDeleted, false),
        gte(marketingLeads.createdAt, last30d)
      ))
      .groupBy(marketingLeads.origin)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10);

    // -- STATUS BREAKDOWN --
    const statusBreakdown = await db
      .select({
        status: marketingLeads.status,
        count: sql<number>`count(*)::int`,
      })
      .from(marketingLeads)
      .where(eq(marketingLeads.isDeleted, false))
      .groupBy(marketingLeads.status);

    // -- INTENT BREAKDOWN --
    const intentBreakdown = await db
      .select({
        intent: marketingLeads.intent,
        count: sql<number>`count(*)::int`,
      })
      .from(marketingLeads)
      .where(eq(marketingLeads.isDeleted, false))
      .groupBy(marketingLeads.intent);

    // -- NEWSLETTER SUBSCRIBERS --
    const { newsletterSubscribers } = await import("@/db/schema");
    const newsletterTotal     = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers))[0] ?? { count: 0 };
    const newsletterConfirmed = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.isConfirmed, true)))[0] ?? { count: 0 };
    const newsletterNew24h    = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers).where(gte(newsletterSubscribers.createdAt, last24h)))[0] ?? { count: 0 };

    // -- CONVERSION RATE --
    const total = totalLeads.count || 0;
    const converted = convertedLeads.count || 0;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(2) : "0.00";

    return NextResponse.json({
      success: true,
      generated_at: now.toISOString(),
      client_name: client.name,
      period: {
        last_24h: last24h.toISOString(),
        last_7d: last7d.toISOString(),
        last_30d: last30d.toISOString(),
      },
      growth_os: {
        leads: {
          total: total,
          new_24h: newLeads24h.count,
          new_7d: newLeads7d.count,
          hot: hotLeads.count,
          converted: converted,
          conversion_rate: `${conversionRate}%`,
        },
        quality_breakdown: Object.fromEntries(
          qualityBreakdown.map(q => [q.quality, q.count])
        ),
        status_breakdown: Object.fromEntries(
          statusBreakdown.map(s => [s.status, s.count])
        ),
        intent_breakdown: Object.fromEntries(
          intentBreakdown.map(i => [i.intent, i.count])
        ),
        top_sources_30d: sourcesRaw
          .filter(s => s.source)
          .map(s => ({ source: s.source, count: s.count })),
      },
      newsletter: {
        total_subscribers: newsletterTotal.count,
        confirmed: newsletterConfirmed.count,
        new_24h: newsletterNew24h.count,
        confirmation_rate: newsletterTotal.count > 0
          ? `${((newsletterConfirmed.count / newsletterTotal.count) * 100).toFixed(1)}%`
          : "0%",
      },
    });
  } catch (e: any) {
    console.error("[external:growth-os:metrics] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
