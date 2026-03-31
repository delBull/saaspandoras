import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoMembers } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Public endpoint called after a confirmed on-chain artifact purchase
// to register/update the buyer as a unique holder in daoMembers
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { wallet, projectId, artifactsAcquired = 1 } = body;

        if (!wallet || !projectId) {
            return NextResponse.json({ error: 'Missing wallet or projectId' }, { status: 400 });
        }

        const walletLower = wallet.toLowerCase();
        const projectIdNum = Number(projectId);

        if (isNaN(projectIdNum)) {
            return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
        }

        // Upsert: insert new holder or increment their artifact count
        await db.insert(daoMembers)
            .values({
                projectId: projectIdNum,
                wallet: walletLower,
                artifactsCount: artifactsAcquired,
                votingPower: artifactsAcquired.toString(),
                joinedAt: new Date(),
                lastActiveAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [daoMembers.projectId, daoMembers.wallet],
                set: {
                    // Safely increment artifact count and voting power
                    artifactsCount: sql`${daoMembers.artifactsCount} + ${artifactsAcquired}`,
                    votingPower: sql`(${daoMembers.votingPower}::integer + ${artifactsAcquired})::text`,
                    lastActiveAt: new Date(),
                }
            });

        return NextResponse.json({ success: true, wallet: walletLower, projectId: projectIdNum });

    } catch (error) {
        console.error('[register-holder] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
