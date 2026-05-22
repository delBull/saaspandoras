import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import CheckoutClient from './CheckoutClient';
import { matchPhase, getRawPhases, type Phase } from '@/lib/phase-utils';
import { resolveProjectSlug } from '@/lib/project-utils';

export default async function CheckoutHubPage({
    params
}: {
    params: Promise<{ slug: string, tier: string }>
}) {
    const { slug: rawSlug, tier } = await params;
    const slug = resolveProjectSlug(rawSlug);

    // Fetch the project and its configurations
    const project = await db.query.projects.findFirst({
        where: eq(projects.slug, slug),
    });

    if (!project) return notFound();

    // 🧭 Strict Tier Resolution: Resolve the phase and its active status.
    // Using centralized getRawPhases to support both V1 and V2 (artifact-based) projects.
    const phases = getRawPhases(project);

    // Fetch current supply to accurately determine phase statuses
    let currentSupply = 0;
    const resolvedContract = project.licenseContractAddress || project.contractAddress;

    if (resolvedContract && resolvedContract !== "0x0000000000000000000000000000000000000000") {
        try {
            const { getContract, readContract } = await import("thirdweb");
            const { defineChain } = await import("thirdweb/chains");
            const { client: twClient } = await import("@/lib/thirdweb-client");

            const contract = getContract({
                client: twClient,
                chain: defineChain(Number(project.chainId || 137)),
                address: resolvedContract as any
            });

            const rawSupply = await readContract({
                contract,
                method: "function totalSupply() view returns (uint256)",
                params: []
            }).catch(() => 0n);

            currentSupply = rawSupply > BigInt(1e12) ? Number(rawSupply / BigInt(1e18)) : Number(rawSupply);
        } catch (e) {
            console.warn("[CheckoutHub] Failed to fetch on-chain supply for phase resolution", e);
        }
    }

    const { calculatePhaseStatus } = await import("@/lib/phase-utils");

    let accumulated = 0;
    let foundActive = null;
    let lastSoldOut = null;
    const phasesWithStatus = [];

    for (const p of phases) {
        const statusData = calculatePhaseStatus(p as any, currentSupply, accumulated);
        phasesWithStatus.push({
            phase: p,
            statusData
        });
        if (!foundActive && (statusData.status === 'active' || statusData.isClickable)) {
            foundActive = p;
        }
        if (statusData.status === 'sold_out') {
            lastSoldOut = p;
        }
        accumulated += Number(p.tokenAllocation || 0);
    }

    // Find the requested phase using the resilient matchPhase helper
    let resolvedMatch = matchPhase(phases, tier);
    let activePhase = null;

    if (resolvedMatch) {
        // Retrieve calculated status for the matched phase
        const matchedWithStatus = phasesWithStatus.find(pws => pws.phase === resolvedMatch);
        if (matchedWithStatus && (matchedWithStatus.statusData.status === 'active' || matchedWithStatus.statusData.isClickable)) {
            // Matched phase is active/clickable, use it!
            activePhase = resolvedMatch;
            console.log(`[CheckoutHub] Resolved active requested phase: "${activePhase.name}" (requested: "${tier}")`);
        } else {
            console.log(`[CheckoutHub] Matched phase "${resolvedMatch.name}" is not active/clickable. Finding active phase fallback...`);
        }
    }

    // 🛡️ Resilient Fallback: If requested phase not found, not active/clickable, OR generic 'standard'/'default' requested,
    // we strictly resolve the currently ACTIVE phase based on on-chain data.
    if (!activePhase || tier === 'standard' || tier === 'default') {
        console.log(`🧭 [CheckoutHub] Resilient dynamic resolution for "${tier}".`);

        // Strict resolution: Active > Last Sold Out > Last Phase (if upcoming)
        const resolvedFallback = foundActive || lastSoldOut || phases[phases.length - 1];
        
        if (resolvedFallback) {
            activePhase = resolvedFallback;
            console.log(`🧭 [CheckoutHub] Dynamic fallback resolved to: "${activePhase.name}" (Strictly Active: ${!!foundActive}, Requested: "${tier}", Supply: ${currentSupply})`);
        }
    }

    // NOTE: If the specific phase requested doesn't exist, we STILL proceed to the client.
    // This allows the CheckoutClient to show a branded 'Fase No Disponible' screen
    // rather than a generic 404, keeping the user in the funnel for the Fast Lane.

    // Pass data to the deep-styled client component
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
            <Suspense fallback={
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-zinc-400 text-sm">Cargando checkout...</p>
                    </div>
                </div>
            }>
                <CheckoutClient
                    project={project}
                    rawPhase={activePhase}
                    tierName={tier}
                />
            </Suspense>
        </div>
    );
}
