import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoMembers, projects } from '@/db/schema';
import { eq, sql, count, sum, desc, and } from 'drizzle-orm';
import { defineChain, getContract, readContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { getWalletBalance } from "thirdweb/wallets";
import { harmonizeProject } from "@/lib/projects/harmonizer";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectIdStr = searchParams.get('projectId');

    if (!projectIdStr) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const projectId = Number(projectIdStr);

    try {
        // 1. Get Treasury Data (On-chain fallback)
        const rawProject = await db.query.projects.findFirst({
            where: eq(projects.id, projectId)
        });

        if (!rawProject) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // SELF-HEALING: If artifacts are missing but project is marked as deployed/live,
        // try to recover artifacts from the latest successful deployment job.
        const hasArtifacts = Array.isArray(rawProject.artifacts) && rawProject.artifacts.length > 0;
        const isDeployed = rawProject.status === 'live' || (rawProject as any).deploymentStatus === 'deployed';

        if (!hasArtifacts && isDeployed) {
            console.log(`🩹 [Metrics API] Self-healing artifacts for ${projectId}...`);
            try {
                const { deploymentJobs } = await import('@/db/schema');
                const lastJob = await db.query.deploymentJobs.findFirst({
                    where: and(
                        eq(deploymentJobs.projectSlug, rawProject.slug),
                        eq(deploymentJobs.status, 'completed')
                    ),
                    orderBy: [desc(deploymentJobs.createdAt)]
                });

                if (lastJob?.result && (lastJob.result as any).artifacts) {
                    console.log(`✅ [Metrics API] Recovered artifacts from job ${lastJob.id}`);
                    const result = lastJob.result as any;
                    rawProject.artifacts = result.artifacts;
                    
                    // Also update main contract addresses if missing
                    if (!rawProject.licenseContractAddress) rawProject.licenseContractAddress = result.licenseContractAddress;
                    if (!rawProject.governorContractAddress) rawProject.governorContractAddress = result.governorContractAddress;
                    if (!rawProject.treasuryAddress) rawProject.treasuryAddress = result.treasuryAddress;
                }
            } catch (healError) {
                console.warn('⚠️ [Metrics API] Self-healing failed:', healError);
            }
        }

        const project = harmonizeProject(rawProject);
        let treasuryUSD = 0;

        if (project?.treasuryAddress?.startsWith('0x') && project.chainId) {
            try {
                const chain = defineChain(Number(project.chainId));
                const balance = await getWalletBalance({
                    client,
                    chain,
                    address: project.treasuryAddress
                });
                treasuryUSD = Number(balance.displayValue);
            } catch (balanceError: any) {
                console.warn(`⚠️ [Metrics API] Treasury balance fetch failed for project ${projectId}:`, balanceError.message);
            }
        }

        // 2. Governance Intelligence (GGE Core)
        // a) Total Stats
        let totalStats;
        try {
            totalStats = await db.select({
                totalPower: sum(daoMembers.votingPower),
                totalMembers: count(daoMembers.wallet),
                totalArtifacts: sum(daoMembers.artifactsCount)
            })
            .from(daoMembers)
            .where(eq(daoMembers.projectId, projectId));
        } catch (dbError: any) {
            console.error(`❌ [Metrics API] DB select failed for project ${projectId}:`, dbError.message);
            throw dbError; // re-throw to be caught by main catch
        }

        // If no members, or if Postgres returns a single row with all nulls (common for empty sum/count)
        const firstStat = totalStats?.[0];
        
        const totalPowerNum = Number(firstStat?.totalPower || 0);
        let totalMembersNum = Number(firstStat?.totalMembers || 0);
        let totalArtifactsNum = Number(firstStat?.totalArtifacts || 0);

        // 🟢 SELF-HEALING FALLBACK: If dao_members is empty, perform ON-CHAIN lookup
        // This ensures the Source of Truth is always visible if the project is live.
        if (totalMembersNum === 0 && project.licenseContractAddress) {
            try {
                console.log(`📡 [Metrics API] performing on-chain sync for ${projectId}...`);
                const chain = defineChain(Number(project.chainId));
                const contract = getContract({
                    client, chain, address: project.licenseContractAddress
                });

                // Fetch total supply (Holders/Artifacts)
                const [onChainSupply, onChainParticipants] = await Promise.all([
                    readContract({
                        contract,
                        method: "function totalSupply() view returns (uint256)",
                        params: []
                    }).catch(() => 0n),
                    readContract({
                        contract,
                        method: "function totalParticipants() view returns (uint256)",
                        params: []
                    }).catch(() => 0n)
                ]);

                if (onChainSupply > 0n) {
                    totalArtifactsNum = Number(onChainSupply);
                    totalMembersNum = onChainParticipants > 0n ? Number(onChainParticipants) : totalArtifactsNum;
                    console.log(`✅ [Metrics API] On-chain recovery successful: ${totalMembersNum} members`);
                }
            } catch (onChainError) {
                console.warn('⚠️ [Metrics API] On-chain recovery failed:', onChainError);
            }
        }

        // Secondary fallback to legacy 'purchases' table if still 0
        if (totalMembersNum === 0) {
            try {
                const { purchases } = await import('@/db/schema');
                const purchaseStats = await db.select({
                    count: count(purchases.id),
                    uniqueWallets: sql<number>`count(distinct ${purchases.userId})`
                })
                .from(purchases)
                .where(and(eq(purchases.projectId, projectId), eq(purchases.status, 'completed')));
                
                if (purchaseStats[0] && Number(purchaseStats[0].uniqueWallets) > 0) {
                    totalMembersNum = Number(purchaseStats[0].uniqueWallets);
                    totalArtifactsNum = Number(purchaseStats[0].count);
                }
            } catch (fallbackError) {
                // console.warn('⚠️ [Metrics API] Fallback to purchases failed:', fallbackError);
            }
        }

        // b) Power Concentration (Top 10)
        let topWallets: { votingPower: string | number | null }[] = [];
        try {
            topWallets = await db.select({
                votingPower: daoMembers.votingPower
            })
            .from(daoMembers)
            .where(eq(daoMembers.projectId, projectId))
            .orderBy(desc(daoMembers.votingPower))
            .limit(10);
        } catch (subError) {
            console.warn('⚠️ [Metrics API] Error fetching top wallets:', subError);
        }

        const top10Power = topWallets.reduce((acc, w) => acc + Number(w?.votingPower || 0), 0);
        
        // PCI: Power Concentration Index (Gini-like for DAO)
        let pci = 0;
        if (totalPowerNum > 0) {
            pci = top10Power / totalPowerNum;
        } else if (totalMembersNum > 0) {
            // Pseudo-PCI if no refined voting power yet
            pci = 0.1; 
        }

        // unique Member Wallets and Artifact Holders
        // Defaults to total counts if refined uniqueness is not available (common for real-time fallback)
        const uniqueMemberWallets = totalMembersNum;
        const uniqueArtifactHolders = totalArtifactsNum;

        const response = {
            members: totalMembersNum,
            memberWallets: uniqueMemberWallets,
            votingPower: totalPowerNum || totalMembersNum,
            artifacts: totalArtifactsNum,
            artifactHolders: uniqueArtifactHolders,
            uniqueArtifactHolders: uniqueArtifactHolders,
            treasury: treasuryUSD,
            pci: (isNaN(pci) || !isFinite(pci)) ? 0 : pci,
            attribution: [] 
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error(`❌ [Metrics API] Error fetching DAO metrics for project ${projectId}:`, {
            message: error.message,
            stack: error.stack,
            projectId
        });
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            details: error.message,
            projectId 
        }, { status: 500 });
    }
}
