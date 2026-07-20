import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { UserMetricsRepository } from "@/lib/domain/user-metrics-repository";

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

    const stats = await UserMetricsRepository.getUserStats(last7d, last30d);

    return NextResponse.json({
      success: true,
      stats: {
        total: stats.core.total,
        active: stats.core.active,
        initiated: stats.core.initiated,       // Completed ritual
        kyc_completed: stats.core.kycCompleted,
        wallet_connected: stats.core.walletConnected,
        new_last_7d: stats.core.newLast7d,
        new_last_30d: stats.core.newLast30d,
        initiation_rate_pct: stats.core.total
          ? Math.round((stats.core.initiated / stats.core.total) * 100)
          : 0,
        wallet_connect_rate_pct: stats.core.total
          ? Math.round((stats.core.walletConnected / stats.core.total) * 100)
          : 0,
      },
      breakdown: {
        by_source: stats.breakdowns.bySource.map(r => ({ source: r.source ?? "unknown", count: r.count })),
        by_cohort: stats.breakdowns.byCohort.map(r => ({ cohort: r.cohort ?? "public", count: r.count })),
        by_tier: stats.breakdowns.byTier.map(r => ({ tier: r.tier ?? "standard", count: r.count })),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[external:users:stats] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
