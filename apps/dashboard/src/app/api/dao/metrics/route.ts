import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoMembers, projects } from '@/db/schema';
import { eq, sql, count, sum } from 'drizzle-orm';
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

        if (project?.treasuryAddress && project.chainId) {
            try {
                const balance = await getWalletBalance({
                    client,
                    chain: defineChain(project.chainId),
                    address: project.treasuryAddress
                });
                treasuryUSD = Number(balance.displayValue);
            } catch (balanceError) {
                console.warn('⚠️ Failed to fetch on-chain treasury balance:', balanceError);
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

        const totalPowerNum = Number(totalStats?.[0]?.totalPower || 0);

        // b) Power Concentration (Top 10)
        const topWallets = await db.select({
            votingPower: daoMembers.votingPower
        })
        .from(daoMembers)
        .where(eq(daoMembers.projectId, projectId))
        .orderBy(sql`voting_power DESC`)
        .limit(10);

        const top10Power = topWallets.reduce((acc, w) => acc + Number(w.votingPower || 0), 0);
        const pci = totalPowerNum > 0 ? top10Power / totalPowerNum : 0;

        // c) Campaign Influence (CIS)
        const attribution = await db.select({
            campaignId: daoMembers.sourceCampaignId,
            memberCount: count(),
            totalVotingPower: sum(daoMembers.votingPower)
        })
        .from(daoMembers)
        .where(eq(daoMembers.projectId, projectId))
        .groupBy(daoMembers.sourceCampaignId)
        .orderBy(sql`sum(voting_power) DESC`)
        .limit(5);

        return NextResponse.json({
            members: Number(totalStats?.[0]?.totalMembers || 0),
            votingPower: totalPowerNum,
            artifacts: Number(totalStats?.[0]?.totalArtifacts || 0),
            treasury: treasuryUSD,
            pci,
            attribution: attribution.map(a => ({
                campaignId: a.campaignId,
                members: Number(a.memberCount),
                votingPower: Number(a.totalVotingPower),
                share: totalPowerNum > 0 ? Number(a.totalVotingPower) / totalPowerNum : 0
            }))
        });

    } catch (error) {
        console.error('Error fetching DAO metrics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
