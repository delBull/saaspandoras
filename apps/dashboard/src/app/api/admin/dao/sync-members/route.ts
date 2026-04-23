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

        console.log(`🚀 Found ${events.length} events to process.`);

        // 2. Group by wallet to identify true members (those with an Access Card)
        const walletGroups = events.reduce((acc, event) => {
            if (!event.projectId || !event.userId) return acc;
            const wallet = event.userId.toLowerCase();
            const key = `${event.projectId}-${wallet}`;
            
            if (!acc[key]) {
                acc[key] = {
                    projectId: event.projectId,
                    wallet: wallet,
                    hasAccessCard: false,
                    artifactsCount: 0,
                    firstDate: event.createdAt,
                    lastDate: event.createdAt
                };
            }
            
            if (event.type === 'access_card_acquired') {
                acc[key].hasAccessCard = true;
            }
            
            acc[key].artifactsCount += 1;
            
            if (event.createdAt && event.createdAt < (acc[key].firstDate || new Date())) acc[key].firstDate = event.createdAt;
            if (event.createdAt && event.createdAt > (acc[key].lastDate || new Date())) acc[key].lastDate = event.createdAt;
            
            return acc;
        }, {} as Record<string, any>);

        let syncedCount = 0;

        for (const key in walletGroups) {
            const data = walletGroups[key];
            
            // Only sync to dao_members if they have an actual Access Card
            if (!data.hasAccessCard) continue;

            const totalVotes = data.artifactsCount.toString(); // 1 vote per artifact as requested

            await db.insert(daoMembers)
                .values({
                    projectId: data.projectId,
                    wallet: data.wallet,
                    artifactsCount: data.artifactsCount,
                    votingPower: totalVotes,
                    joinedAt: data.firstDate || new Date(),
                    lastActiveAt: data.lastDate || new Date()
                })
                .onConflictDoUpdate({
                    target: [daoMembers.projectId, daoMembers.wallet],
                    set: {
                        artifactsCount: data.artifactsCount,
                        votingPower: totalVotes,
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
