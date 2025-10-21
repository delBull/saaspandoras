import { NextResponse } from 'next/server';
import { getUserGamificationProfile } from '@/lib/gamification/service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    console.log(`🔍 API: Getting gamification profile for user ${userId}`);

    const profile = await getUserGamificationProfile(userId);

    if (!profile) {
      console.log(`❌ API: Profile not found for user ${userId}`);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    console.log(`✅ API: Profile found for user ${userId}: Level ${profile.currentLevel}, ${profile.totalPoints} points`);
    return NextResponse.json({
      profile,
      success: true,
      message: `Perfil de gamificación cargado: Nivel ${profile.currentLevel} con ${profile.totalPoints} puntos`
    });
  } catch (error) {
    console.error('❌ API Error fetching gamification profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}