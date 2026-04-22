import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { harmonizeProject } from "@/lib/projects/harmonizer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/protocols/[slug]
 *
 * Returns full detail of a single protocol.
 * Requires API key with: read:protocols
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { client, error } = await validateExternalKey(req, "read:protocols");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({
      success: true,
      protocol: {
        ...harmonized,
        fundingProgress: harmonized.targetAmount && harmonized.raisedAmount
          ? Math.round((Number(harmonized.raisedAmount) / Number(harmonized.targetAmount)) * 100)
          : 0,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[external:protocols:slug] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
