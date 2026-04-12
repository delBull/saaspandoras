import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { eq, gte, sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/growth-os/newsletter
 *
 * Returns newsletter subscriber stats for Bull's Lab.
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
    const last7d  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const total        = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers))[0] ?? { count: 0 };
    const confirmed    = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.isConfirmed, true)))[0] ?? { count: 0 };
    const new24h       = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers).where(gte(newsletterSubscribers.createdAt, last24h)))[0] ?? { count: 0 };
    const new7d        = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers).where(gte(newsletterSubscribers.createdAt, last7d)))[0] ?? { count: 0 };
    const new30d       = (await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers).where(gte(newsletterSubscribers.createdAt, last30d)))[0] ?? { count: 0 };

    // By source
    const bySource = await db
      .select({
        source: newsletterSubscribers.source,
        count: sql<number>`count(*)::int`,
      })
      .from(newsletterSubscribers)
      .groupBy(newsletterSubscribers.source)
      .orderBy(desc(sql<number>`count(*)`));

    // By language
    const byLanguage = await db
      .select({
        language: newsletterSubscribers.language,
        count: sql<number>`count(*)::int`,
      })
      .from(newsletterSubscribers)
      .groupBy(newsletterSubscribers.language);

    const totalCount = total.count || 0;
    const confirmedCount = confirmed.count || 0;

    return NextResponse.json({
      success: true,
      generated_at: now.toISOString(),
      newsletter: {
        total_subscribers: totalCount,
        confirmed: confirmedCount,
        unconfirmed: totalCount - confirmedCount,
        confirmation_rate: totalCount > 0
          ? `${((confirmedCount / totalCount) * 100).toFixed(1)}%`
          : "0%",
        growth: {
          new_24h: new24h.count,
          new_7d:  new7d.count,
          new_30d: new30d.count,
        },
        by_source: Object.fromEntries(bySource.map(s => [s.source ?? "unknown", s.count])),
        by_language: Object.fromEntries(byLanguage.map(l => [l.language ?? "unknown", l.count])),
      },
    });
  } catch (e: any) {
    console.error("[external:growth-os:newsletter] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
