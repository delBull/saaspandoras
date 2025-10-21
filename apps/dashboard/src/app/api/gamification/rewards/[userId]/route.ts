import { NextResponse } from 'next/server';
import { getAvailableGamificationRewards } from '@/lib/gamification/service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    console.log(`🎁 API: Getting available rewards for user ${userId}`);

    const rewards = await getAvailableGamificationRewards(userId);

    console.log(`✅ API: Found ${rewards.length} available rewards for user ${userId}`);
    return NextResponse.json({
      rewards,
      success: true,
      message: `Recompensas disponibles: ${rewards.length} encontradas`
    });
  } catch (error) {
    console.error('❌ API Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}