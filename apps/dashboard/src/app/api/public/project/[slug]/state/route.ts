import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects as projectsSchema, daoMembers as daoMembersSchema, userBalances as userBalancesSchema, daoActivities as daoActivitiesSchema } from "@/db/schema";
import { resolveProjectSlug } from "@/lib/project-utils";
import { eq, sql, and, desc } from "drizzle-orm";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client as twClient } from "@/lib/thirdweb-client";
import { getContract } from "thirdweb";
import { ProgressionEngine, Tier } from "@/lib/protocol-engine/progression";
import { getProjectPhasesWithStats } from "@/lib/phase-utils";
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
        estimatedApy: true, treasuryAddress: true, applicantWalletAddress: true
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

    // 4.5 Fetch User DB State (Leads, Whitelist, etc.)
    let isWhitelisted = false;
    let dbUserStatus = "visitor";
    if (wallet && wallet.startsWith("0x")) {
        const { marketingLeads: leadsSchema } = await import("@/db/schema");
        const lead = await db.query.marketingLeads.findFirst({
            where: and(
                eq(leadsSchema.projectId, project.id),
                eq(leadsSchema.walletAddress, wallet)
            )
        });
        if (lead) {
            isWhitelisted = lead.status === "whitelisted" || lead.status === "active";
            dbUserStatus = lead.status || "active";
        }
    }

    // 4.6 Fetch User Rewards & Voting Power (Dynamic for any project)
    // GROUND TRUTH: 1 Certificate = 1 Voting Power (as requested)
    let userVotingPower = wallet && userArtifactCount > 0 ? userArtifactCount : 0; 
    let userRewards = "0.00 USDC";
    let userRewardsValue = 0;
    
    if (wallet && wallet.startsWith("0x") && project.id) {
        const normalizedWallet = wallet.toLowerCase();
        
        // If DB has higher voting power (e.g. delegated), we prioritize it, 
        // but user balance is the minimum viable power.
        const member = await db.query.daoMembers.findFirst({
            where: and(
                eq(daoMembersSchema.projectId, project.id),
                eq(daoMembersSchema.wallet, normalizedWallet)
            )
        });
        if (member && Number(member.votingPower || 0) > userVotingPower) {
            userVotingPower = Number(member.votingPower);
        }

        // Rewards from User Balances (Platform-wide or specific if needed)
        const balance = await db.query.userBalances.findFirst({
            where: eq(userBalancesSchema.walletAddress, normalizedWallet)
        });
        if (balance) {
            const pbox = Number(balance.pboxBalance || 0);
            const usdc = Number(balance.usdcBalance || 0);
            
            // Heuristic: If project is on Base (8453), prioritize USDC display
            if (Number(chainId) === 8453) {
                userRewards = `${usdc.toFixed(2)} USDC`;
                userRewardsValue = usdc;
            } else {
                userRewards = `${pbox.toFixed(2)} PBOX`;
                userRewardsValue = pbox;
            }
        }
    }

    // 4.7 Phase & Availability Analytics (Dynamic Metrics)
    const phases = getProjectPhasesWithStats(project, currentSupply);
    const activePhaseIndex = phases.findIndex((p: any) => p.status === 'active');
    const activePhase = activePhaseIndex !== -1 ? phases[activePhaseIndex] : phases[0];
    const nextPhase = phases[activePhaseIndex + 1] || null;

    // 4.8 DAO Activities Integration
    const activities = await db.query.daoActivities.findMany({
        where: eq(daoActivitiesSchema.projectId, project.id),
        orderBy: desc(daoActivitiesSchema.createdAt),
        limit: 5
    });

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
    
    // DYNAMIC METRICS CALCULATION: 
    // We prioritize phase-specific stats, but fallback to project-level metadata if phases are incomplete.
    const metadataPrice = Number(project.tokenPriceUsd || activePhase?.tokenPrice || 50);
    const metadataTarget = Number(project.targetAmount || activePhase?.cap || (metadataPrice * 8));
    
    // Dynamic total units based on current target/price if phase allocation is missing
    const totalUnitsFallback = metadataTarget > 0 ? Math.floor(metadataTarget / metadataPrice) : 8;

    const totalUnits = (activePhase?.stats?.tokensAllocated && activePhase.stats.tokensAllocated > 0) 
        ? activePhase.stats.tokensAllocated 
        : (totalUnitsFallback > 0 ? totalUnitsFallback : 8);

    const soldUnits = activePhase?.stats?.tokensSold !== undefined && activePhase.stats.tokensSold !== null
        ? activePhase.stats.tokensSold 
        : (currentSupply > 0 ? (currentSupply % totalUnits) : 0);

    const availableUnits = Math.max(0, totalUnits - soldUnits);
    
    // 🔥 CRITICAL FIX: Ensure progress is never NaN or Infinity
    let progressPercentage = 0;
    if (totalUnits > 0) {
        progressPercentage = Math.min(100, Math.max(0, (soldUnits / totalUnits) * 100));
    }
    
    // Handle specific S'Narai case where supply might be reported as 0 but we want to show some movement
    const isSnarai = project.slug === 'snarai';
    if (isSnarai && soldUnits === 0 && currentSupply > 0) {
        // Fallback for visual progress if supply is > 0 but tokensSold is 0
        progressPercentage = Math.min(25, (currentSupply / totalUnits) * 100);
    }

    const response = NextResponse.json({
      title: project.title,
      slug: project.slug,
      tagline: project.tagline,
      status: project.status,
      currentSupply,
      userBalance: userArtifactCount,
      userVotingPower,
      userRewards,
      userRewardsValue,
      canClaim: userRewardsValue > 0,
      activities: activities.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        reward: `${a.rewardAmount} ${a.rewardTokenSymbol}`,
        type: a.type,
        category: a.category,
        link: a.externalLink
      })),
      onboarding: {
        title: "¿Qué Sigue?",
        steps: [
            { 
              title: "Verifica tu Posición", 
              description: "Tu certificado ya es inmutable en la red Blockchain. Puedes verlo en la sección de 'Mis Activos' dentro de este portal." 
            },
            { 
              title: "Participa en el DAO", 
              description: "Usa tu Poder de Voto para influir en las decisiones del proyecto y participa en las actividades exclusivas para holders." 
            },
            { 
              title: "Reclama tus Utilidades", 
              description: "Cuando el proyecto genere rendimientos, aparecerán en tu balance. Podrás retirarlos a tu wallet en cualquier momento." 
            }
        ]
      },
      holdersCount,
      treasuryDisplay,
      dbUserStatus,
      isWhitelisted,
      metadata: {
        estimatedApy: project.estimatedApy || "12.5%",
        targetAmount: (project.targetAmount && project.targetAmount !== "NaN" && Number(project.targetAmount) > 0) 
            ? project.targetAmount 
            : (activePhase?.cap?.toString() || (totalUnits * Number(project.tokenPriceUsd || 50)).toString()),
        tokenPriceUsd: project.tokenPriceUsd || activePhase?.tokenPrice?.toString() || "50",
        nextPhasePriceUsd: nextPhase?.tokenPrice?.toString() || "75",
        deliveryDate: "Q4 2027",
        totalUnits,
        soldUnits,
        availableUnits,
        progressPercentage,
        phaseName: activePhase?.name || "Fase Principal"
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
