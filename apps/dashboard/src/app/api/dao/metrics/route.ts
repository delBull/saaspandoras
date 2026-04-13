import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoMembers, projects } from '@/db/schema';
import { eq, sql, count, sum, desc, and } from 'drizzle-orm';
import { defineChain } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { getWalletBalance } from "thirdweb/wallets";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectIdStr = searchParams.get('projectId');

    if (!projectIdStr) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const projectId = Number(projectIdStr);

    try {
        // 1. Get Treasury Data (On-chain fallback)
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId)
        });

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
        const hasNoMembers = !firstStat || (!firstStat.totalMembers && !firstStat.totalPower);

        if (hasNoMembers) {
           console.log(`ℹ️ [Metrics API] No DAO members found for project ${projectId}`);
           return NextResponse.json({
               members: 0,
               votingPower: 0,
               artifacts: 0,
               treasury: treasuryUSD,
               pci: 0,
               attribution: []
           });
        }

        const totalPowerNum = Number(firstStat.totalPower || 0);
        let totalMembersNum = Number(firstStat.totalMembers || 0);
        let totalArtifactsNum = Number(firstStat.totalArtifacts || 0);

        // 🟢 SELF-HEALING FALLBACK: If dao_members is empty but projects have history, 
        // fallback to 'purchases' table to avoid showing 0 to the user.
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
                    console.log(`📡 [Metrics API] Self-healed Narai/V2 metrics from purchases table for project ${projectId}`);
                }
            } catch (fallbackError) {
                console.warn('⚠️ [Metrics API] Fallback to purchases failed:', fallbackError);
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

        const response = {
            members: totalMembersNum,
            votingPower: totalPowerNum || totalMembersNum, // Fallback power to member count if 1:1
            artifacts: totalArtifactsNum,
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
