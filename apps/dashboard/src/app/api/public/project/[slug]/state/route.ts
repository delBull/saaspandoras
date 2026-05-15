import { NextRequest, NextResponse } from "next/server";
import { harmonizeProject } from "@/lib/projects/harmonizer";
import { db } from "@/db";
import { 
  projects as projectsSchema, 
  daoMembers as daoMembersSchema, 
  userBalances as userBalancesSchema, 
  daoActivities as daoActivitiesSchema,
  purchases as purchasesSchema,
  users as usersSchema,
  governanceProposals as proposalsSchema,
  marketingLeads as leadsSchema,
  marketingIdentities
} from "@/db/schema";
import { resolveProjectSlug } from "@/lib/project-utils";
import { eq, sql, and, desc } from "drizzle-orm";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client as twClient } from "@/lib/thirdweb-client";
import { getContract } from "thirdweb";
import { ProgressionEngine, Tier } from "@/lib/protocol-engine/progression";
import { getProjectPhasesWithStats } from "@/lib/phase-utils";
import { InventoryService } from "@/lib/inventory/effective-supply";
import { headers } from "next/headers";
import { getWalletBalance } from "thirdweb/wallets";

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
  console.log(`[API] 📡 Incoming request for project state: ${req.url}`);
  try {
    const { slug: rawSlug } = await params;
    const slug = resolveProjectSlug(rawSlug);
    const { searchParams } = new URL(req.url);
    const apiKey = req.headers.get("x-api-key") || searchParams.get("apiKey");
    const wallet = searchParams.get("wallet");
    const isLive = searchParams.get("live") === "true";

    if (!apiKey) {
      return NextResponse.json({ error: "No se proporcionó API Key" }, { 
        status: 401,
        headers: getCorsHeaders(req.headers.get("origin"))
      });
    }

    // 1. Validate API Key
    const authClient = await IntegrationKeyService.validateKey(apiKey);
    if (!authClient) {
      return NextResponse.json({ error: "API Key inválida o expirada" }, { 
        status: 401,
        headers: getCorsHeaders(req.headers.get("origin"))
      });
    }

    // 2. Fetch Project
    const rawProject = await db.query.projects.findFirst({
      where: eq(projectsSchema.slug, slug),
    });

    if (!rawProject) {
      return NextResponse.json({ error: "Project not found" }, { 
        status: 404,
        headers: getCorsHeaders(req.headers.get("origin"))
      });
    }

    const project = harmonizeProject(rawProject);
    const w2e = project.w2eConfig;

    // 3. Fetch Real-time Contract Data (Parallelized)
    const chainId = project.chainId;
    const resolvedContract = project.licenseContractAddress || project.contractAddress;

    let userArtifactCount = 0;
    let currentSupply = 0;

    const contractActive = resolvedContract && resolvedContract !== "0x0000000000000000000000000000000000000000";
    
    if (contractActive) {
      const contract = getContract({
        client: twClient, chain: defineChain(Number(chainId)), address: resolvedContract
      });

      try {
        const rpcCalls = [
          readContract({
            contract, method: "function totalSupply() view returns (uint256)", params: []
          })
        ];

        if (wallet && wallet.startsWith("0x")) {
          rpcCalls.push(
            readContract({
              contract, method: "function balanceOf(address) view returns (uint256)", params: [wallet as `0x${string}`]
            })
          );
        }

        // Add 4s timeout to contract reads
        const results = await Promise.race([
          Promise.all(rpcCalls),
          new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error("RPC Timeout")), 4000))
        ]).catch(() => [0n, 0n]);

        const rawSupply = BigInt(results[0] || 0n);
        currentSupply = rawSupply > BigInt(1e12) ? Number(rawSupply / BigInt(1e18)) : Number(rawSupply);

        if (wallet && wallet.startsWith("0x")) {
          const rawBalance = BigInt(results[1] || 0n);
          userArtifactCount = rawBalance > BigInt(1e12) ? Number(rawBalance / BigInt(1e18)) : Number(rawBalance);
        }
      } catch (e) {
        console.warn(`[API] Contract read error for ${slug}:`, e);
      }
    }

    // 4. Fetch Treasury & DAO Metrics (Synchronized with Dashboard Truth)
    let treasuryDisplay = "0.00";
    let holdersCount = 0;

    try {
        // a) DB Check for holders
        const holders = await db.select({ count: sql<number>`count(*)` })
            .from(daoMembersSchema)
            .where(eq(daoMembersSchema.projectId, project.id));
        holdersCount = Number(holders[0]?.count || 0);

        // b) On-chain SYNC (Self-Healing)
        // If DB says 0 but we have a contract, fetch from chain to ensure Source of Truth
        if (holdersCount === 0 && resolvedContract && resolvedContract !== "0x0000000000000000000000000000000000000000") {
            try {
                const chain = defineChain(Number(chainId));
                const contract = getContract({
                    client: twClient, chain, address: resolvedContract
                });
                // Timeout for on-chain calls (3s) to prevent hanging
                const onChainParticipants = await Promise.race([
                    readContract({
                        contract,
                        method: "function totalParticipants() view returns (uint256)",
                        params: []
                    }),
                    new Promise<bigint>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
                ]).catch(() => 0n);
                
                if (onChainParticipants > 0n) {
                    holdersCount = Number(onChainParticipants);
                    console.log(`[API] 📡 Synchronized holdersCount from chain: ${holdersCount}`);
                }
            } catch (e) {
                console.warn("[API] Failed to sync holdersCount from chain", e);
            }
        }

        // c) Tertiary Fallback: Count completed purchases if still 0
        // This ensures we show real governance participants even before on-chain mint occurs
        if (holdersCount === 0) {
            try {
                const completedPurchases = await db.select({ count: sql<number>`count(distinct ${purchasesSchema.userId})` })
                    .from(purchasesSchema)
                    .where(and(
                        eq(purchasesSchema.projectId, project.id),
                        eq(purchasesSchema.status, 'completed')
                    ));
                const purchaseBasedHolders = Number(completedPurchases[0]?.count || 0);
                if (purchaseBasedHolders > 0) {
                    holdersCount = purchaseBasedHolders;
                    console.log(`[API] 📊 Fallback holdersCount from completed purchases: ${holdersCount}`);
                }
            } catch (e) {
                console.warn("[API] Failed to get holdersCount from purchases fallback", e);
            }
        }

        // d) Fetch Treasury Balance
        if (project.treasuryAddress?.startsWith('0x')) {
            const chain = defineChain(Number(chainId));
            
            if (Number(chainId) === 8453) {
                const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
                const usdcContract = getContract({
                    client: twClient, chain, address: USDC_BASE_ADDRESS
                });
                const usdcBalance = await Promise.race([
                    readContract({
                        contract: usdcContract,
                        method: "function balanceOf(address) view returns (uint256)",
                        params: [project.treasuryAddress]
                    }),
                    new Promise<bigint>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
                ]).catch(() => 0n);
                
                const treasuryUSD = Number(usdcBalance) / 1e6;
                treasuryDisplay = treasuryUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            } else {
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

    // 4.6 Fetch User Rewards & Voting Power (Parallelized)
    let userVotingPower = wallet && userArtifactCount > 0 ? userArtifactCount : 0; 
    let userRewards = "0.00 USDC";
    let userRewardsValue = 0;
    
    if (wallet && wallet.startsWith("0x") && project.id) {
        try {
            const normalizedWallet = wallet.toLowerCase();
            
            const [member, balance] = await Promise.all([
                db.query.daoMembers.findFirst({
                    where: and(
                        eq(daoMembersSchema.projectId, project.id),
                        eq(daoMembersSchema.wallet, normalizedWallet)
                    )
                }).catch(() => null),
                db.query.userBalances.findFirst({
                    where: eq(userBalancesSchema.walletAddress, normalizedWallet)
                }).catch(() => null)
            ]);

            if (member && Number(member.votingPower || 0) > userVotingPower) {
                userVotingPower = Number(member.votingPower);
            }

            if (balance) {
                const pbox = Number(balance.pboxBalance || 0);
                const usdc = Number(balance.usdcBalance || 0);
                
                if (Number(chainId) === 8453) {
                    userRewards = `${usdc.toFixed(2)} USDC`;
                    userRewardsValue = usdc;
                } else {
                    userRewards = `${pbox.toFixed(2)} PBOX`;
                    userRewardsValue = pbox;
                }
            }
        } catch (userDataError) {
            console.warn("[API] Failed to fetch extended user data (rewards/VP):", userDataError);
        }
    }

    // 4.7 Phase & Availability Analytics (Dynamic Metrics)
    const phases = getProjectPhasesWithStats(project, currentSupply);
    const activePhaseIndex = phases.findIndex((p: any) => p.status === 'active');
    const activePhase = activePhaseIndex !== -1 ? phases[activePhaseIndex] : phases[0];
    const nextPhase = phases[activePhaseIndex + 1] || null;

    // 4.9 Parallel DB Queries for secondary data
    const [activities, activeProposals, user] = await Promise.all([
        db.query.daoActivities.findMany({
            where: eq(daoActivitiesSchema.projectId, project.id),
            orderBy: desc(daoActivitiesSchema.createdAt),
            limit: 5
        }).catch(() => []),
        db.query.governanceProposals.findMany({
            where: and(
                eq(proposalsSchema.protocolId, project.id),
                eq(proposalsSchema.status, 1)
            ),
            limit: 5
        }).catch(() => []),
        (wallet && wallet.startsWith("0x")) 
            ? db.query.users.findFirst({ where: eq(usersSchema.walletAddress, wallet.toLowerCase()) }).catch(() => null)
            : Promise.resolve(null)
    ]);

    // 4.9 Fetch Legal Metadata (Integrity Proofs) - MULTI-CERTIFICATE SUPPORT
    let certificates: any[] = [];

    if (wallet && project.id) {
        try {
            const normalizedWallet = wallet.toLowerCase();
            
            // Resolve identity with fallback to marketing identities if user is not in 'users'
            let finalUserId = user?.id;
            if (!finalUserId) {
                const identity = await db.query.marketingIdentities.findFirst({
                    where: eq(marketingIdentities.walletAddress, normalizedWallet)
                }).catch(() => null);
                finalUserId = (identity as any)?.userId || (identity as any)?.linkedCoreUserId;
            }

            const allPurchases = await db.query.purchases.findMany({
                where: and(
                    eq(purchasesSchema.projectId, project.id),
                    finalUserId 
                        ? eq(purchasesSchema.userId, finalUserId) 
                        : eq(purchasesSchema.userId, normalizedWallet),
                    sql`${purchasesSchema.status} IN ('completed', 'processing', 'pending', 'on_hold')`
                ),
                orderBy: desc(purchasesSchema.createdAt)
            }).catch(() => []);

            if (allPurchases.length > 0) {
                const origin = req.headers.get("origin") || "";
                certificates = allPurchases.map(p => {
                    const isVerifiable = !!p.agreementHash || slug === 'snarai';
                    const tokenPrice = Number(project.tokenPriceUsd || 50);
                    const units = Math.floor(Number(p.amount) / (tokenPrice > 0 ? tokenPrice : 50));
                    const apiBase = apiKey.startsWith('pk_live_') ? 'https://dash.pandoras.finance' : 'https://staging.dash.pandoras.finance';

                    return {
                        isVerifiable,
                        agreementId: p.agreementId || p.id,
                        agreementHash: p.agreementHash || (slug === 'snarai' ? `PENDING-${p.id.slice(0, 8)}` : null),
                        legalPortalUrl: p.legalPortalUrl || `${apiBase}/legal/certificate/${p.agreementId || p.id}?project=${slug}&units=${units}&origin=${encodeURIComponent(origin)}`,
                        status: p.agreementHash ? "certified" : "pending",
                        units: units || 1, 
                        amount: Number(p.amount) || 0, 
                        date: p.createdAt
                    };
                });
            } else if (userArtifactCount > 0) {
                // 🔥 SELF-HEALING: If no DB purchases but has on-chain balance, synthesize a virtual certificate
                console.log(`[API] 🛡️ Synthesizing virtual certificate for ${wallet} (Balance: ${userArtifactCount})`);
                const apiBase = apiKey.startsWith('pk_live_') ? 'https://dash.pandoras.finance' : 'https://staging.dash.pandoras.finance';
                const origin = req.headers.get("origin") || "";
                certificates = [{
                    isVerifiable: true,
                    agreementId: `ONCHAIN-${wallet.slice(2, 10).toUpperCase()}`,
                    agreementHash: `VERIFIED-ONCHAIN-${wallet.slice(-8).toUpperCase()}`,
                    legalPortalUrl: `${apiBase}/legal/certificate/virtual-${wallet}?project=${slug}&units=${userArtifactCount}&origin=${encodeURIComponent(origin)}`,
                    status: "certified",
                    units: userArtifactCount,
                    amount: userArtifactCount * Number(project.tokenPriceUsd || 50),
                    date: new Date().toISOString(),
                    isVirtual: true
                }];
            }
        } catch (certError) {
            console.error("[API] Error fetching certificates for user:", certError);
        }
    }

    // 4.10 Build Global Consolidated Certificate (Global Title) - PROTECTED BLOCK
    let userTotalUnits = 0;
    let userTotalAmount = 0;
    let globalCertificate = null;

    try {
        userTotalUnits = (certificates || []).reduce((acc, cert) => acc + (Number(cert.units) || 0), 0);
        userTotalAmount = (certificates || []).reduce((acc, cert) => acc + (Number(cert.amount) || 0), 0); 
        
        if (certificates && certificates.length > 0) {
            const apiBase = apiKey.startsWith('pk_live_') ? 'https://dash.pandoras.finance' : 'https://staging.dash.pandoras.finance';
            const origin = req.headers.get("origin") || "";
            globalCertificate = {
                isVerifiable: certificates.some(c => c.isVerifiable),
                totalUnits: userTotalUnits,
                totalAmount: userTotalAmount,
                globalPortalUrl: `${apiBase}/legal/certificate/global-${wallet}?project=${slug}&units=${userTotalUnits}&origin=${encodeURIComponent(origin)}`, 
                status: certificates.every(c => c.status === "certified") ? "certified" : "pending"
            };
        }
    } catch (e) {
        console.error("⚠️ Error building global certificate:", e);
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
    
    // DYNAMIC METRICS CALCULATION (Refined for Audit Consistency)
    // Guard: activePhase.tokenPrice may be ETH-scale (< 1.0) on testnet — always prefer DB USD price
    const dbUsdPrice = Number(project.tokenPriceUsd);
    const phasePriceCandidate = Number(activePhase?.tokenPrice || 0);
    const metadataPrice = dbUsdPrice > 1 ? dbUsdPrice : (phasePriceCandidate > 1 ? phasePriceCandidate : 50);
    
    // targetAmount from DB is the truth — ignore phase cap if it's in ETH (too small)
    const dbTargetAmount = Number(project.targetAmount);
    const metadataTarget = dbTargetAmount > 1000 ? dbTargetAmount : (metadataPrice * 100); // Fallback: 100 units
    
    // Total Units Ground Truth: Active Phase allocation is the primary source.
    const projectTotalUnits = (activePhase?.stats?.tokensAllocated && activePhase.stats.tokensAllocated > 0) 
        ? activePhase.stats.tokensAllocated 
        : (metadataTarget > 0 ? Math.floor(metadataTarget / metadataPrice) : 8);

    // 🔥 HYBRID INVENTORY CALCULATION (Blockchain + DB Soft-Lock)
    const { 
        onHoldUnits, 
        totalSoldUnits: hybridSoldUnits, 
        availableUnits: hybridAvailableUnits, 
        progressPercentage: hybridProgress 
    } = await InventoryService.getEffectiveMetrics(project, currentSupply);

    const soldUnits = hybridSoldUnits;
    const availableUnits = hybridAvailableUnits;
    const progressPercentage = hybridProgress;

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
      governance: {
        activeProposalsCount: activeProposals.length,
        proposals: activeProposals.map(p => ({
          id: p.id,
          proposalId: p.proposalId,
          title: p.description?.split('\n')[0] || "Propuesta de Gobernanza",
          status: "Active"
        }))
      },
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
      certificates,
      globalCertificate,
      holdersCount,
      treasuryDisplay,
      dbUserStatus,
      isWhitelisted,
      phases: phases.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        allocation: p.stats?.tokensAllocated || 0,
        sold: p.stats?.tokensSold || 0,
        remaining: p.stats?.remainingTokens || 0,
        price: p.tokenPrice,
        progress: p.progressPercentage || 0,
        isSoldOut: p.status === 'sold_out'
      })),
      metadata: {
        estimatedApy: project.estimatedApy || "12.5%",
        targetAmount: (() => {
          // Priority: w2eConfig tokenomics > phase calculation > DB value (DB may be wrong)
          const w2eTarget = project.w2eConfig?.tokenomics?.targetUsd;
          if (w2eTarget && Number(w2eTarget) > 0 && Number(w2eTarget) < 50_000_000) return w2eTarget.toString();
          const phaseCalc = projectTotalUnits * metadataPrice;
          if (phaseCalc > 0 && phaseCalc < 50_000_000) return phaseCalc.toString();
          // DB fallback (only if sane: between $1k and $50M USD)
          const dbVal = Number(project.targetAmount);
          if (dbVal > 1000 && dbVal < 50_000_000) return project.targetAmount;
          return "5000000"; // S'Narai hard fallback
        })(),
        tokenPriceUsd: (Number(project.tokenPriceUsd) > 1) ? project.tokenPriceUsd : (activePhase?.tokenPrice?.toString() || "50"),
        nextPhasePriceUsd: (Number(nextPhase?.tokenPrice) > 1) ? nextPhase?.tokenPrice?.toString() : "75",
        deliveryDate: "Q4 2027",
        totalUnits: projectTotalUnits,
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
      error: "Temporary data unavailability", 
      message: (error as Error).message 
    }, { 
      status: 200, 
      headers: getCorsHeaders(req.headers.get("origin"))
    });
  }
}
