import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoMembers, projects } from '@/db/schema';
import { eq, sql, count, sum, desc } from 'drizzle-orm';
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
        const totalStats = await db.select({
            totalPower: sum(daoMembers.votingPower),
            totalMembers: count(daoMembers.wallet),
            totalArtifacts: sum(daoMembers.artifactsCount)
        })
        .from(daoMembers)
        .where(eq(daoMembers.projectId, projectId));

        if (!totalStats || totalStats.length === 0) {
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

        const totalPowerNum = totalStats?.[0]?.totalPower ? Number(totalStats[0].totalPower) : 0;
        const totalMembersNum = totalStats?.[0]?.totalMembers ? Number(totalStats[0].totalMembers) : 0;
        const totalArtifactsNum = totalStats?.[0]?.totalArtifacts ? Number(totalStats[0].totalArtifacts) : 0;

        // b) Power Concentration (Top 10)
        let topWallets: { votingPower: string | number }[] = [];
        try {
            topWallets = await db.select({
                votingPower: daoMembers.votingPower
            })
            .from(daoMembers)
            .where(eq(daoMembers.projectId, projectId))
            .orderBy(desc(daoMembers.votingPower))
            .limit(10);
        } catch (subError) {
            console.error('❌ DAO Metrics: Error fetching top wallets:', subError);
            // Non-critical fallback, keep going with empty list
        }

        const top10Power = topWallets.reduce((acc, w) => acc + Number(w.votingPower || 0), 0);
        const pci = totalPowerNum > 0 ? top10Power / totalPowerNum : 0;

        const response = {
            members: totalMembersNum,
            votingPower: totalPowerNum,
            artifacts: totalArtifactsNum,
            treasury: treasuryUSD,
            pci: isNaN(pci) ? 0 : pci,
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
