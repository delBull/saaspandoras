import { NextResponse } from 'next/server';
import { db } from '@/db';
import { gamificationEvents, daoMembers } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        // 1. Fetch all membership-related events
        const events = await db.select()
            .from(gamificationEvents)
            .where(sql`type IN ('access_card_acquired', 'artifact_acquired', 'artifact_purchased')`);

        console.log(`🚀 Found ${events.length} DAO membership events to sync.`);

        // Clear table first to avoid duplication during full sync if needed? 
        // No, upsert handles it. But we should be careful about "re-running" and incrementing.
        // If we re-run, artifactsCount will double. 
        // For a safe backfill, we should group by (projectId, userId) first.

        const groupedEvents = events.reduce((acc, event) => {
            if (!event.projectId || !event.userId) return acc;
            const key = `${event.projectId}-${event.userId.toLowerCase()}`;
            if (!acc[key]) {
                acc[key] = {
                    projectId: event.projectId,
                    wallet: event.userId.toLowerCase(),
                    count: 0,
                    firstDate: event.createdAt,
                    lastDate: event.createdAt
                };
            }
            acc[key].count += 1;
            if (event.createdAt && event.createdAt < (acc[key].firstDate || new Date())) acc[key].firstDate = event.createdAt;
            if (event.createdAt && event.createdAt > (acc[key].lastDate || new Date())) acc[key].lastDate = event.createdAt;
            return acc;
        }, {} as Record<string, any>);

        let syncedCount = 0;

        for (const key in groupedEvents) {
            const data = groupedEvents[key];
            
            await db.insert(daoMembers)
                .values({
                    projectId: data.projectId,
                    wallet: data.wallet,
                    artifactsCount: data.count,
                    votingPower: data.count.toString(),
                    joinedAt: data.firstDate || new Date(),
                    lastActiveAt: data.lastDate || new Date()
                })
                .onConflictDoUpdate({
                    target: [daoMembers.projectId, daoMembers.wallet],
                    set: {
                        artifactsCount: data.count, // Set to the accurate count from history
                        votingPower: data.count.toString(),
                        lastActiveAt: data.lastDate || new Date()
                    }
                });
            
            syncedCount++;
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully synced ${syncedCount} unique member records from ${events.length} total events.` 
        });

    } catch (error) {
        console.error('Error syncing DAO members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
