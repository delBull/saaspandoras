import { NextResponse } from "next/server";
import { db } from "@/db";
import { accessRequests } from "@/db/schema";
import { sql, gt } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 📊 Marketing Stats API (Psychological Social Proof)
 * ============================================================================
 * Returns qualitative "buckets" instead of exact numbers to maintain 
 * credibility and high perceived demand.
 * ============================================================================
 */
export async function GET() {
  try {
    // Count approvals in the last 24 hours (Current Signal)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count24hRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(accessRequests)
      .where(gt(accessRequests.reviewedAt, last24h));
    const currentSignal = Number(count24hRes[0]?.count || 0);

    // Count approvals in the last 7 days (Inertia Anchor)
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const count7dRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(accessRequests)
      .where(gt(accessRequests.reviewedAt, last7d));
    const averageSignal = Number(count7dRes[0]?.count || 0) / 7;

    // 🧠 RESILIENCE: Smoothed result or fallback
    const smoothedCount = (averageSignal * 0.7) + (currentSignal * 0.3);

    let label = "Accesos limitados hoy";
    let intensity: 'low' | 'mid' | 'high' | 'ultra' = 'mid';

    if (smoothedCount < 2) label = "Pocos accesos liberados hoy", intensity = 'low';
    else if (smoothedCount < 10) label = "Accesos limitados hoy", intensity = 'mid';
    else if (smoothedCount < 30) label = "Alta demanda en las últimas horas", intensity = 'high';
    else label = "Demanda excepcional ahora mismo", intensity = 'ultra';

    return NextResponse.json({ 
      label, 
      intensity,
      _debug_smoothed: process.env.NODE_ENV === 'development' ? smoothedCount : undefined 
    });

  } catch (err: any) {
    console.warn("⚠️ [/api/marketing/stats] Resilience Fallback Active:", err.message);
    
    // STRIPE-TIER RESILIENCE: Never 500 on non-critical social proof data.
    // Return a credible default label instead.
    return NextResponse.json({ 
      label: "Solicitudes en evaluación",
      intensity: 'mid',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
