import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingRewardLogs, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/marketing/rewards/summary
 * 
 * Returns a summary of rewards earned by the current user via Growth OS.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate (Session or X-Wallet-Address for TMA)
    const { session, isVerified } = await getAuth(req.headers);
    const walletAddressFromHeader = req.headers.get('x-wallet-address')?.toLowerCase();
    
    let userId: string | undefined;

    if (isVerified && session?.address) {
      userId = session.address;
    } else if (walletAddressFromHeader) {
      const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, walletAddressFromHeader)
      });
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Reward Logs Summary
    const summary = await db.select({
      totalXp: sql<number>`sum(${marketingRewardLogs.amount})`,
      count: sql<number>`count(${marketingRewardLogs.id})`
    })
    .from(marketingRewardLogs)
    .where(eq(marketingRewardLogs.userId, userId));

    const totalXp = Number(summary[0]?.totalXp || 0);

    return NextResponse.json({
      success: true,
      data: {
        totalXp,
        eventCount: Number(summary[0]?.count || 0),
        message: totalXp > 0 
          ? `🔥 Has ganado ${totalXp} XP antes de unirte!` 
          : 'No se encontraron recompensas previas.'
      }
    });

  } catch (error) {
    console.error('❌ Reward Summary Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
