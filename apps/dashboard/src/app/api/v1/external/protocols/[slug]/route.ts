import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    return NextResponse.json({
      success: true,
      protocol: {
        ...project,
        targetAmount: project.targetAmount ? Number(project.targetAmount) : null,
        raisedAmount: project.raisedAmount ? Number(project.raisedAmount) : null,
        returnsPaid: project.returnsPaid ? Number(project.returnsPaid) : null,
        totalValuationUsd: project.totalValuationUsd ? Number(project.totalValuationUsd) : null,
        tokenPriceUsd: project.tokenPriceUsd ? Number(project.tokenPriceUsd) : null,
        price: project.price ? Number(project.price) : null,
        fundingProgress: project.targetAmount && project.raisedAmount
          ? Math.round((Number(project.raisedAmount) / Number(project.targetAmount)) * 100)
          : 0,
        // 🧬 Filter out inactive phases from w2eConfig to hide them in external widgets
        w2eConfig: project.w2eConfig ? (function() {
          const config = typeof project.w2eConfig === 'string' 
            ? JSON.parse(project.w2eConfig) 
            : (project.w2eConfig as any);
          
          if (config.phases && Array.isArray(config.phases)) {
            config.phases = config.phases.filter((p: any) => p.isActive !== false);
          }
          return config;
        })() : null
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[external:protocols:slug] Error:", e);
    return NextResponse.json({ error: "Internal Server Error", detail: e.message }, { status: 500 });
  }
}
