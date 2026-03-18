import { NextResponse } from 'next/server';
import { getAuth, isSuperAdmin } from '@/lib/auth';
import { db } from '@/db';
import { telegramPoints } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// POST /api/admin/gamification/audit/unlock
// Manual unlock of credits for a specific user
export async function POST(req: Request) {
    try {
        const { session } = await getAuth();
        // Super Admin only for manual unlocks
        if (!session?.address || !isSuperAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
        }

        const { telegramUserId, amount } = await req.json();

        if (!telegramUserId || amount === undefined) {
            return NextResponse.json({ error: 'Missing telegramUserId or amount' }, { status: 400 });
        }

        // Logic: 
        // 1. Check current locked credits
        // 2. Move 'amount' from locked to claimable
        
        const result = await db.transaction(async (tx) => {
            const current = await tx.select()
                .from(telegramPoints)
                .where(eq(telegramPoints.telegramUserId, telegramUserId))
                .limit(1);

            if (current.length === 0) {
                throw new Error('User points not found');
            }

            const userPointsData = current[0];
            if (!userPointsData) {
                throw new Error('User points record is empty');
            }

            const unlockAmount = Math.min(amount, userPointsData.lockedCredits);

            if (unlockAmount <= 0) {
                return { success: false, message: 'No credits to unlock' };
            }

            await tx.update(telegramPoints)
                .set({
                    lockedCredits: userPointsData.lockedCredits - unlockAmount,
                    claimableCredits: userPointsData.claimableCredits + unlockAmount,
                    updatedAt: new Date(),
                })
                .where(eq(telegramPoints.telegramUserId, telegramUserId));

            return { success: true, unlocked: unlockAmount };
        });

        return NextResponse.json(result);
    } catch (err: any) {
        console.error('[Admin Gamification Unlock POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
