import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects as projectsSchema, daoMembers as daoMembersSchema } from "@/db/schema";
import { resolveProjectSlug } from "@/lib/project-utils";
import { eq, sql } from "drizzle-orm";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client as twClient } from "@/lib/thirdweb-client";
import { getContract } from "thirdweb";
import { ProgressionEngine, Tier } from "@/lib/protocol-engine/progression";
import { headers } from "next/headers";

export const runtime = "nodejs";

// CORS Headers Helper
const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
  "Access-Control-Max-Age": "86400",
});

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/public/project/[slug]/state
 * Retrieves real-time contract state and user progression.
 * Caching: 15s default, bypass with ?live=true
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug: rawSlug } = await params;
    const slug = resolveProjectSlug(rawSlug);
    const { searchParams } = new URL(req.url);
    const apiKey = req.headers.get("x-api-key") || searchParams.get("apiKey");
    const wallet = searchParams.get("wallet");
    const isLive = searchParams.get("live") === "true";

    if (!apiKey) {
      return NextResponse.json({ error: "No se proporcionó API Key" }, { status: 401 });
    }

    // 1. Validate API Key
    const authClient = await IntegrationKeyService.validateKey(apiKey);
    if (!authClient) {
      return NextResponse.json({ error: "API Key inválida o expirada" }, { status: 401 });
    }

    // 2. Fetch Project
    const project = await db.query.projects.findFirst({
      where: eq(projectsSchema.slug, slug),
      columns: {
        id: true, slug: true, status: true, chainId: true, 
        licenseContractAddress: true, contractAddress: true, w2eConfig: true,
        title: true, tagline: true, targetAmount: true, tokenPriceUsd: true,
        estimatedApy: true, treasuryAddress: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { 
        status: 404,
        headers: getCorsHeaders(req.headers.get("origin"))
      });
    }

    const w2e = typeof project.w2eConfig === 'string' 
      ? JSON.parse(project.w2eConfig) 
      : (project.w2eConfig || {});

    // 3. Fetch Real-time Contract Data
    const chainId = project.chainId || 11155111;
    const resolvedContract = project.licenseContractAddress || w2e.licenseToken?.address || project.contractAddress;

    let userArtifactCount = 0;
    let currentSupply = 0;

    if (resolvedContract && resolvedContract !== "0x0000000000000000000000000000000000000000") {
      const contract = getContract({
        client: twClient, chain: defineChain(Number(chainId)), address: resolvedContract
      });

      try {
        const supplyData = await readContract({
          contract, method: "function totalSupply() view returns (uint256)", params: []
        });
        currentSupply = Number(supplyData);

        if (wallet && wallet.startsWith("0x")) {
          const balance = await readContract({
              contract, method: "function balanceOf(address) view returns (uint256)", params: [wallet as `0x${string}`]
          });
          userArtifactCount = Number(balance);
        }
      } catch (e) {
        console.warn(`[API] Contract read error for ${slug}:`, e);
      }
    }

    // 4. Fetch Treasury & DAO Metrics (New)
    let treasuryDisplay = "0.00";
    let holdersCount = 0;

    try {
        // Fetch holder count from DB
        const holders = await db.select({ count: sql<number>`count(*)` })
            .from(daoMembersSchema)
            .where(eq(daoMembersSchema.projectId, project.id));
        holdersCount = Number(holders[0]?.count || 0);

        // Fetch Treasury Balance
        if (project.treasuryAddress?.startsWith('0x')) {
            const chain = defineChain(Number(chainId));
            
            if (Number(chainId) === 8453) {
                const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
                const usdcContract = getContract({
                    client: twClient, chain, address: USDC_BASE_ADDRESS
                });
                const usdcBalance = await readContract({
                    contract: usdcContract,
                    method: "function balanceOf(address) view returns (uint256)",
                    params: [project.treasuryAddress]
                }).catch(() => 0n);
                
                const treasuryUSD = Number(usdcBalance) / 1e6;
                treasuryDisplay = treasuryUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            } else {
                const { getWalletBalance } = await import("thirdweb/wallets");
                const balance = await getWalletBalance({
                    client: twClient, chain, address: project.treasuryAddress
                });
                const treasuryVal = Number(balance.displayValue);
                const isSepolia = Number(chainId) === 11155111;
                const treasurySymbol = isSepolia ? "SepoliaETH" : (balance.symbol || "ETH");
                treasuryDisplay = `${treasuryVal.toFixed(4)} ${treasurySymbol}`;
            }
        }
    } catch (metricError) {
        console.warn(`[API] Error fetching metrics for ${slug}:`, metricError);
    }

    // 5. Calculate Progression via Engine
    const rawTiers = (w2e.tiers || w2e.packages || []) as any[];
    const normalizedTiers: Tier[] = rawTiers.map(t => ({
      id: t.id,
      name: t.name,
      artifactCountThreshold: t.artifactCountThreshold ?? t.minArtifacts ?? 0,
      perks: t.perks || [],
      description: t.description
    }));

    const progression = wallet ? ProgressionEngine.calculate(userArtifactCount, normalizedTiers) : null;

    // 6. Build Response with Caching
    const origin = req.headers.get("origin");
    const response = NextResponse.json({
      title: project.title,
      slug: project.slug,
      tagline: project.tagline,
      status: project.status,
      currentSupply,
      userBalance: userArtifactCount,
      holdersCount,
      treasuryDisplay,
      progression,
      metadata: {
        estimatedApy: (project as any).estimatedApy || "12.5%", // Fallback to standard
        targetAmount: project.targetAmount,
        tokenPriceUsd: (project as any).tokenPriceUsd,
      },
      metrics: {
        urgency: progression?.urgencyLevel || "low"
      },
      timestamp: new Date().toISOString()
    }, {
      headers: getCorsHeaders(origin)
    });

    // Caching Strategy: s-maxage=15, stale-while-revalidate=30
    // Bypass if isLive=true
    if (isLive) {
      response.headers.set("Cache-Control", "no-store, max-age=0");
    } else {
      response.headers.set("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");
    }

    return response;

  } catch (error) {
    console.error("❌ Public State API Error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch project state", 
      message: (error as Error).message 
    }, { 
      status: 500,
      headers: getCorsHeaders(req.headers.get("origin"))
    });
  }
}
