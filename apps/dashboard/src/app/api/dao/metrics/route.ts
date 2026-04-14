import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoMembers, projects } from '@/db/schema';
import { eq, sql, count, sum, desc, and } from 'drizzle-orm';
import { defineChain } from "thirdweb";
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

        // 🟢 SELF-HEALING FALLBACK: If dao_members is empty but projects have history, 
        // fallback to 'purchases' table to avoid showing 0 to the user.
        if (totalMembersNum === 0) {
            try {
                console.log(`ℹ️ [Metrics API] dao_members empty for project ${projectId}. Attempting self-healing via purchases...`);
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
                    console.log(`📡 [Metrics API] Self-healed metrics from purchases table for project ${projectId}: ${totalMembersNum} members`);
                }
            } catch (fallbackError) {
                console.warn('⚠️ [Metrics API] Fallback to purchases failed:', fallbackError);
            }
        }

        if (totalMembersNum === 0 && totalPowerNum === 0) {
           console.log(`ℹ️ [Metrics API] No DAO members or purchases found for project ${projectId}`);
           return NextResponse.json({
               members: 0,
               memberWallets: 0,
               votingPower: 0,
               artifacts: 0,
               artifactHolders: 0,
               uniqueArtifactHolders: 0,
               treasury: treasuryUSD,
               pci: 0,
               attribution: []
           });
        }

        // Get unique wallets that have purchased artifacts (excluding free access)
        let uniqueArtifactHolders = 0;
        let uniqueMemberWallets = 0;
        try {
            const { purchases } = await import('@/db/schema');
            
            // Get unique member wallets (those with Access Pass from dao_members or purchases)
            const memberStats = await db.select({
                uniqueWallets: sql<number>`count(distinct ${daoMembers.wallet})`
            })
            .from(daoMembers)
            .where(eq(daoMembers.projectId, projectId));
            uniqueMemberWallets = memberStats[0]?.uniqueWallets ? Number(memberStats[0].uniqueWallets) : totalMembersNum;
            
            // Get unique wallets that have purchased artefacts (status completed, amount > 0)
            const artifactPurchases = await db.select({
                uniqueWallets: sql<number>`count(distinct ${purchases.userId})`,
                totalArtifacts: sum(purchases.amount)
            })
            .from(purchases)
            .where(and(
                eq(purchases.projectId, projectId),
                eq(purchases.status, 'completed')
            ));
            
            uniqueArtifactHolders = artifactPurchases[0]?.uniqueWallets ? Number(artifactPurchases[0].uniqueWallets) : 0;
            console.log(`📊 [Metrics API] Artifact holders: ${uniqueArtifactHolders}, Member wallets: ${uniqueMemberWallets} for project ${projectId}`);
        } catch (artifactError) {
            console.warn('⚠️ [Metrics API] Error fetching artifact holders:', artifactError);
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
