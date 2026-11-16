import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@saasfly/db-core";
import { projects } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { harmonizeProject } from "@/lib/projects/harmonizer";
import {
  extractX402Payment,
  buildX402Challenge,
  verifyX402Payment,
  attachX402Receipt,
  type X402PaymentConfig,
} from "@/lib/payments/x402";
import type { Hash } from "@/lib/payments/onchain-verify";

export const dynamic = "force-dynamic";

const PROTOCOL_DETAIL_X402_CONFIG: X402PaymentConfig = {
  priceUsd: 0.005,
  description: "Pandoras RWA Protocol Details and Funding Analytics",
};

/**
 * GET /api/v1/external/protocols/[slug]
 *
 * Returns full detail of a single protocol.
 * Auth:
 *   - Human / Partner integrators: API key with 'read:protocols'
 *   - Autonomous AI Agents: x402 Micropayment Protocol (0.005 USDC on Base / Base Sepolia)
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  let isX402Settled = false;
  let x402Receipt: { txHash: Hash; amountUsd: number } | null = null;

  // 1. Traditional API key check (backwards-compatible)
  const { client } = await validateExternalKey(req, "read:protocols");

  if (!client) {
    // 2. x402 protocol machine payments for AI agents
    const paymentProof = extractX402Payment(req);
    if (!paymentProof) {
      return buildX402Challenge(PROTOCOL_DETAIL_X402_CONFIG);
    }

    const verification = await verifyX402Payment(req, PROTOCOL_DETAIL_X402_CONFIG);
    if (!verification.ok) {
      return verification.challenge;
    }

    isX402Settled = true;
    x402Receipt = {
      txHash: verification.txHash,
      amountUsd: verification.amountUsd,
    };
  }

  const { slug } = await context.params;

  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      columns: {
        id: true,
        slug: true,
        title: true,
        status: true,
        businessCategory: true,
        tagline: true,
        description: true,
        targetAmount: true,
        raisedAmount: true,
        returnsPaid: true,
        totalValuationUsd: true,
        tokenType: true,
        totalTokens: true,
        tokensOffered: true,
        tokenPriceUsd: true,
        estimatedApy: true,
        lockupPeriod: true,
        fundUsage: true,
        featured: true,
        accessType: true,
        price: true,
        website: true,
        twitterUrl: true,
        discordUrl: true,
        telegramUrl: true,
        imageUrl: true,
        contractAddress: true,
        protocolVersion: true,
        chainId: true,
        yieldSource: true,
        stakingRewardsEnabled: true,
        revenueSharingEnabled: true,
        w2eConfig: true,
        artifacts: true,
        createdAt: true,
        updatedAt: true,
        // Always exclude PII and internal fields
        discordWebhookUrl: false,
        applicantEmail: false,
        applicantName: false,
        applicantPhone: false,
        applicantWalletAddress: false,
        applicantPosition: false,
        dueDiligenceReportUrl: false,
        valuationDocumentUrl: false,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Protocol not found" }, { status: 404 });
    }

    // 🧬 Harmonize project data (Calculates targetAmount and Normalizes Prices)
    const harmonized = harmonizeProject(project);

    const response = NextResponse.json({
      success: true,
      protocol: {
        ...harmonized,
        fundingProgress: harmonized.targetAmount && harmonized.raisedAmount
          ? Math.round((Number(harmonized.raisedAmount) / Number(harmonized.targetAmount)) * 100)
          : 0,
      },
      generated_at: new Date().toISOString(),
    });

    if (isX402Settled && x402Receipt) {
      return attachX402Receipt(response, x402Receipt);
    }

    return response;
  } catch (e: any) {
    console.error("[external:protocols:slug] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
