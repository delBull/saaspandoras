import { defineChain, getContract, readContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";

export interface PhaseStats {
  cap: number;
  raised: number;
  percent: number;
  isSoldOut: boolean;
  tokensAllocated: number;
  tokensSold: number;
  remainingTokens: number;
}

export interface ProjectPhase {
  id: string | number;
  name: string;
  tokenPrice: number;
  tokenAllocation: number;
  type?: 'amount' | 'time';
  limit?: number;
  stats?: PhaseStats;
}

/**
 * Robustly parses phases from project configuration
 */
export function getProjectPhases(project: any): any[] {
  try {
    const config = typeof project.w2eConfig === 'string'
      ? JSON.parse(project.w2eConfig)
      : (project.w2eConfig || {});

    // 1. Direct phases in config (V1 style)
    let phases = config.phases || project.phases || [];

    // 2. If V2, check artifacts for phases
    if (phases.length === 0 && project.artifacts?.length) {
      const artifactPhases = project.artifacts
        .flatMap((a: any) => a.phases || [])
        .filter((p: any) => p?.name);

      if (artifactPhases.length > 0) {
        phases = artifactPhases;
      }
    }

    return phases;
  } catch (e) {
    console.error("[Stats Util] Error parsing project phases:", e);
    return project.phases || [];
  }
}

/**
 * Calculates real-time stats for all phases of a project.
 * Ported from ProjectSidebar.tsx for server-side use.
 */
export function calculatePhaseStats(
  project: any,
  totalSupply: bigint | number = 0,
  treasuryBalanceValue: number = 0
) {
  const allPhases = getProjectPhases(project);
  const currentSupply = Number(totalSupply);
  
  let accumulatedTokens = 0;

  return allPhases.map((phase: any) => {
    const price = Number(phase.tokenPrice || 0);
    const allocation = Number(phase.tokenAllocation || 0);

    const stats: PhaseStats = {
      cap: 0,
      raised: 0,
      percent: 0,
      isSoldOut: false,
      tokensAllocated: allocation,
      tokensSold: 0,
      remainingTokens: 0
    };

    // Calculate Raised Tokens for this phase
    const phaseStartTokens = accumulatedTokens;
    const currentPhaseRaisedTokens = Math.max(0, Math.min(allocation, currentSupply - phaseStartTokens));

    if (price === 0) {
      // Free Mint
      stats.cap = allocation;
      stats.raised = currentPhaseRaisedTokens;
      stats.percent = allocation > 0 ? (currentPhaseRaisedTokens / allocation) * 100 : 0;
      stats.isSoldOut = currentPhaseRaisedTokens >= allocation && allocation > 0;
    } else {
      // Paid Mint
      const phaseCapUSD = phase.type === 'amount' ? Number(phase.limit) : (allocation * price);
      stats.cap = phaseCapUSD;

      // Infer Raised USD from Raised Tokens
      const inferredRaisedUSD = currentPhaseRaisedTokens * price;
      stats.raised = inferredRaisedUSD;

      stats.percent = phaseCapUSD > 0 ? (inferredRaisedUSD / phaseCapUSD) * 100 : 0;
      stats.isSoldOut = currentPhaseRaisedTokens >= allocation && allocation > 0;
    }

    stats.tokensSold = currentPhaseRaisedTokens;
    stats.remainingTokens = Math.max(0, allocation - currentPhaseRaisedTokens);

    accumulatedTokens += allocation;

    return { ...phase, stats };
  });
}

/**
 * Helper to fetch on-chain data for a project on the server
 */
export async function fetchProjectOnChainData(project: any) {
  const chainId = Number(project.chainId || 11155111); // Default Sepolia
  const chain = defineChain(chainId);
  
  // Resolve contract address (Priority: licenseContractAddress > contractAddress)
  const contractAddress = project.licenseContractAddress || project.contractAddress;

  if (!contractAddress || !contractAddress.startsWith("0x")) {
    return { totalSupply: 0 };
  }

  try {
    const contract = getContract({
      client,
      chain,
      address: contractAddress as string
    });

    const totalSupply = await readContract({
      contract,
      method: "function totalSupply() view returns (uint256)",
      params: []
    });

    return {
        totalSupply: Number(totalSupply)
    };
  } catch (error) {
    console.error(`[Stats Util] Error fetching on-chain data for ${project.slug}:`, error);
    return { totalSupply: 0 };
  }
}
