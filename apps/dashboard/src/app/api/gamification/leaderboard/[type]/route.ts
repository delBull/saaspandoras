import { NextResponse } from 'next/server';
import { getGamificationLeaderboard } from '@/lib/gamification/service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '10');

    console.log(`🏅 API: Getting leaderboard ${type}, limit ${limit}`);
    const leaderboard = await getGamificationLeaderboard(type, limit);

    console.log(`✅ API: Leaderboard loaded: ${leaderboard.length} entries`);
    return NextResponse.json({
      leaderboard,
      success: true,
      message: `Tabla de líderes cargada: ${leaderboard.length} participantes`
    });
  } catch (error) {
    console.error('❌ API Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}