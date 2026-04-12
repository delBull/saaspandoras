import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { protocolNavs, pandoraBuybackPools, projects } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/agora/nav/[protocolId]
 *
 * Returns NAV history and buyback pool for a protocol.
 * Requires API key with: read:agora
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ protocolId: string }> }
) {
  const { client, error } = await validateExternalKey(req, "read:agora");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  const { protocolId: protocolIdStr } = await context.params;
  const protocolId = parseInt(protocolIdStr);

  if (isNaN(protocolId)) {
    return NextResponse.json({ error: "Invalid protocolId — must be a number" }, { status: 400 });
  }

  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30"), 90); // max 90 days

    // NAV history
    const navHistory = await db.query.protocolNavs.findMany({
      where: eq(protocolNavs.protocolId, protocolId),
      orderBy: [desc(protocolNavs.createdAt)],
      limit,
      columns: {
        id: true,
        nav: true,
        treasury: true,
        supply: true,
        minPrice: true,
        maxPrice: true,
        createdAt: true,
        protocolId: false, // redundant in context
      },
    });

    if (navHistory.length === 0) {
      return NextResponse.json({ error: "No NAV data for this protocol" }, { status: 404 });
    }

    // Buyback pool
    const buybackPool = await db.query.pandoraBuybackPools.findFirst({
      where: eq(pandoraBuybackPools.protocolId, protocolId),
      columns: {
        allocatedCapital: true,
        availableCapital: true,
        targetReserveRatio: true,
        lastRebalanceAt: true,
      },
    });

    // Safe — length checked above
    const latest = navHistory[0]!;

    return NextResponse.json({
      success: true,
      protocol_id: protocolId,
      current: {
        nav: Number(latest.nav),
        treasury: Number(latest.treasury),
        supply: latest.supply,
        min_price: Number(latest.minPrice),
        max_price: Number(latest.maxPrice),
        as_of: latest.createdAt,
      },
      buyback_pool: buybackPool ? {
        allocated_capital: Number(buybackPool.allocatedCapital),
        available_capital: Number(buybackPool.availableCapital),
        target_reserve_ratio: Number(buybackPool.targetReserveRatio),
        last_rebalance: buybackPool.lastRebalanceAt,
      } : null,
      history: navHistory.map(n => ({
        nav: Number(n.nav),
        treasury: Number(n.treasury),
        supply: n.supply,
        timestamp: n.createdAt,
      })),
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[external:agora:nav] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
