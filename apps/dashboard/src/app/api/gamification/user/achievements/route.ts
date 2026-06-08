import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { getUserGamificationAchievements } from '@/lib/gamification/service';

export async function GET() {
  try {
    // Try JWT first, fallback to header
    const auth = await getAuth();
    let userWallet = auth.isVerified && auth.session?.address ? auth.session.address : null;

    if (!userWallet) {
      const headersList = await headers();
      const headerWallet = headersList.get('x-wallet-address') ??
                          headersList.get('x-user-address');
      if (headerWallet) userWallet = headerWallet;
    }

    if (!userWallet) {
      return NextResponse.json(
        { error: 'Wallet address required', success: false },
        { status: 401 }
      );
    }

    console.log(`🏆 API: Getting achievements for wallet ${userWallet}`);

    const achievements = await getUserGamificationAchievements(userWallet);

    console.log(`✅ API: Returned ${achievements.length} achievements for user ${userWallet}`);

    return NextResponse.json({
      achievements,
      success: true,
      message: `Achievements cargados: ${achievements.length} disponibles`
    });

  } catch (error) {
    console.error('❌ API Error fetching achievements:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch achievements',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
