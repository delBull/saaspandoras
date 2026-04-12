import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { users, gamificationProfiles } from "@/db/schema";
import { eq, sql, not, isNull, gte, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/users/stats
 *
 * Returns aggregated, non-PII user statistics for Bull's Lab analytics.
 * Requires API key with: read:users
 */
export async function GET(req: NextRequest) {
  const { client, error } = await validateExternalKey(req, "read:users");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const last7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Core user counts
    const [totalUsers, activeUsers, initiatedUsers, kycUsers, walletUsers, newLast7d, newLast30d] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.status, "ACTIVE")),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(not(isNull(users.ritualCompletedAt))),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.kycCompleted, true)),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(not(isNull(users.walletAddress))),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(gte(users.createdAt, last7d)),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(gte(users.createdAt, last30d)),
    ]);

    // Acquisition source breakdown (non-PII)
    const bySource = await db
      .select({
        source: users.acquisitionSource,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.acquisitionSource)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    // Access cohort breakdown
    const byCohort = await db
      .select({
        cohort: users.accessCohort,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.accessCohort);

    // Benefit tier breakdown
    const byTier = await db
      .select({
        tier: users.benefitsTier,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.benefitsTier);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalUsers[0]?.count ?? 0,
        active: activeUsers[0]?.count ?? 0,
        initiated: initiatedUsers[0]?.count ?? 0,       // Completed ritual
        kyc_completed: kycUsers[0]?.count ?? 0,
        wallet_connected: walletUsers[0]?.count ?? 0,
        new_last_7d: newLast7d[0]?.count ?? 0,
        new_last_30d: newLast30d[0]?.count ?? 0,
        initiation_rate_pct: totalUsers[0]?.count
          ? Math.round(((initiatedUsers[0]?.count ?? 0) / totalUsers[0].count) * 100)
          : 0,
        wallet_connect_rate_pct: totalUsers[0]?.count
          ? Math.round(((walletUsers[0]?.count ?? 0) / totalUsers[0].count) * 100)
          : 0,
      },
      breakdown: {
        by_source: bySource.map(r => ({ source: r.source ?? "unknown", count: r.count })),
        by_cohort: byCohort.map(r => ({ cohort: r.cohort ?? "public", count: r.count })),
        by_tier: byTier.map(r => ({ tier: r.tier ?? "standard", count: r.count })),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[external:users:stats] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
