import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { GrowthMetricsRepository } from "@/lib/domain/growth-metrics-repository";

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

    const leadsMetrics = await GrowthMetricsRepository.getLeadsMetrics(last24h, last7d, last30d);
    const newsletterMetrics = await GrowthMetricsRepository.getNewsletterMetrics(last24h);

    // -- CONVERSION RATE --
    const total = leadsMetrics.total;
    const converted = leadsMetrics.converted;
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
          new_24h: leadsMetrics.new_24h,
          new_7d: leadsMetrics.new_7d,
          hot: leadsMetrics.hot,
          converted: converted,
          conversion_rate: `${conversionRate}%`,
        },
        quality_breakdown: Object.fromEntries(
          leadsMetrics.qualityBreakdown.map(q => [q.quality, q.count])
        ),
        status_breakdown: Object.fromEntries(
          leadsMetrics.statusBreakdown.map(s => [s.status, s.count])
        ),
        intent_breakdown: Object.fromEntries(
          leadsMetrics.intentBreakdown.map(i => [i.intent, i.count])
        ),
        top_sources_30d: leadsMetrics.sourcesRaw
          .filter(s => s.source)
          .map(s => ({ source: s.source, count: s.count })),
      },
      newsletter: {
        total_subscribers: newsletterMetrics.total_subscribers,
        confirmed: newsletterMetrics.confirmed,
        new_24h: newsletterMetrics.new_24h,
        confirmation_rate: newsletterMetrics.total_subscribers > 0
          ? `${((newsletterMetrics.confirmed / newsletterMetrics.total_subscribers) * 100).toFixed(1)}%`
          : "0%",
      },
    });
  } catch (e: any) {
    console.error("[external:growth-os:metrics] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
