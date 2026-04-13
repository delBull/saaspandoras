import { NextResponse } from 'next/server';
import { db } from '@/db';
import { gamificationEvents, daoMembers, projects } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { defineChain } from "thirdweb";
import { getWalletBalance } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";

export async function POST(req: Request) {
    try {
        const { projectId, verifyOnChain = false } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
        }

        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId)
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // 1. Fetch all membership-triggering events for this project
        const events = await db.select()
            .from(gamificationEvents)
            .where(and(
                eq(gamificationEvents.projectId, projectId),
                sql`type IN ('access_card_acquired', 'artifact_acquired', 'artifact_purchased')`
            ));

        // 2. Fetch successful purchases for this project (V2 backup truth)
        const { purchases } = await import('@/db/schema');
        const confirmedPurchases = await db.select()
            .from(purchases)
            .where(and(
                eq(purchases.projectId, projectId),
                eq(purchases.status, 'completed')
            ));

        console.log(`🧹 Reconciling DAO for Project ${projectId}. Found ${events.length} events and ${confirmedPurchases.length} confirmed purchases.`);

        // 2. Aggregate by wallet (Self-Healing from Events)
        const memberStats = events.reduce((acc, event) => {
            if (!event.userId) return acc;
            const wallet = event.userId.toLowerCase();
            if (!acc[wallet]) {
                acc[wallet] = {
                    artifactsCount: 0,
                    joinedAt: event.createdAt,
                    lastActiveAt: event.createdAt,
                    campaignId: event.metadata && typeof event.metadata === 'object' ? (event.metadata as any).campaignId : null
                };
            }
            acc[wallet].artifactsCount += 1;
            if (event.createdAt < acc[wallet].joinedAt) acc[wallet].joinedAt = event.createdAt;
            if (event.createdAt > acc[wallet].lastActiveAt) acc[wallet].lastActiveAt = event.createdAt;
            return acc;
        }, {} as Record<string, any>);

        // Add stats from confirmed purchases
        confirmedPurchases.forEach(p => {
            const wallet = p.userId.toLowerCase();
            if (!memberStats[wallet]) {
                memberStats[wallet] = {
                    artifactsCount: 0,
                    joinedAt: p.createdAt,
                    lastActiveAt: p.createdAt,
                    campaignId: (p.metadata as any)?.paymentConfig?.payOptions?.metadata?.campaignId || null
                };
            }
            memberStats[wallet].artifactsCount += 1;
            if (p.createdAt < memberStats[wallet].joinedAt) memberStats[wallet].joinedAt = p.createdAt;
            if (p.createdAt > memberStats[wallet].lastActiveAt) memberStats[wallet].lastActiveAt = p.createdAt;
        });

        // 3. Update dao_members
        let updatedCount = 0;
        for (const wallet in memberStats) {
            const stats = memberStats[wallet];

            // Optional: Cross-verify with Blockchain
            let finalVotingPower = stats.artifactsCount.toString();
            
            // Note: On-chain verification is expensive and usually done via indexers.
            // For this self-healing script, we prioritize the event log "Truth".

            await db.insert(daoMembers)
                .values({
                    projectId,
                    wallet,
                    artifactsCount: stats.artifactsCount,
                    votingPower: finalVotingPower,
                    joinedAt: stats.joinedAt,
                    lastActiveAt: stats.lastActiveAt
                })
                .onConflictDoUpdate({
                    target: [daoMembers.projectId, daoMembers.wallet],
                    set: {
                        artifactsCount: stats.artifactsCount,
                        votingPower: finalVotingPower,
                        lastActiveAt: stats.lastActiveAt
                    }
                });
            updatedCount++;
        }

        return NextResponse.json({ 
            success: true, 
            message: `Reconciliation complete. Processed ${updatedCount} unique members for project ${projectId}.`,
            eventsProcessed: events.length
        });

    } catch (error) {
        console.error('Error reconciling DAO members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
