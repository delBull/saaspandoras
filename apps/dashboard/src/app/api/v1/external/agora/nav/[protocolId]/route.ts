import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@saasfly/db-core";
import { protocolNavs, pandoraBuybackPools, projects } from "@saasfly/db-core";
import { eq, desc, and } from "@saasfly/db-core";
import {
  extractX402Payment,
  buildX402Challenge,
  verifyX402Payment,
  attachX402Receipt,
  type X402PaymentConfig,
} from "@/lib/payments/x402";
import type { Hash } from "@/lib/payments/onchain-verify";

export const dynamic = "force-dynamic";

const AGORA_NAV_X402_CONFIG: X402PaymentConfig = {
  priceUsd: 0.01,
  description: "Agora RWA Real-time NAV and Buyback Pool Data",
};

/**
 * GET /api/v1/external/agora/nav/[protocolId]
 *
 * Returns NAV history and buyback pool for a protocol.
 * Auth:
 *   - Human / Partner integrators: API key with 'read:agora'
 *   - Autonomous AI Agents: x402 Micropayment Protocol (0.01 USDC on Base / Base Sepolia)
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ protocolId: string }> }
) {
  let isX402Settled = false;
  let x402Receipt: { txHash: Hash; amountUsd: number } | null = null;

  // 1. Check traditional API key (free tier / subscription for registered clients)
  const { client } = await validateExternalKey(req, "read:agora");

  if (!client) {
    // 2. x402 protocol machine payments for AI agents
    const paymentProof = extractX402Payment(req);
    if (!paymentProof) {
      // Return HTTP 402 with machine-readable terms
      return buildX402Challenge(AGORA_NAV_X402_CONFIG);
    }

    const verification = await verifyX402Payment(req, AGORA_NAV_X402_CONFIG);
    if (!verification.ok) {
      return verification.challenge;
    }

    isX402Settled = true;
    x402Receipt = {
      txHash: verification.txHash,
      amountUsd: verification.amountUsd,
    };
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

    const response = NextResponse.json({
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

    if (isX402Settled && x402Receipt) {
      return attachX402Receipt(response, x402Receipt);
    }

    return response;
  } catch (e: any) {
    console.error("[external:agora:nav] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
