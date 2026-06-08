import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { trackGamificationEvent } from '@/lib/gamification/service';

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    if (!auth.isVerified || !auth.session?.address || !await isAdmin(auth.session.address)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { eventType, walletAddress, projectId, metadata } = await request.json();

    console.log(`🎮 Admin API: Triggering event ${eventType} for wallet ${walletAddress}`);

    const result = await trackGamificationEvent(walletAddress, eventType, {
      ...(metadata || {}),
      projectId,
    });

    return NextResponse.json({
      success: true,
      message: `Event ${eventType} triggered successfully`,
      result
    });

  } catch (error) {
    console.error('❌ Admin API Error triggering event:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger event',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
