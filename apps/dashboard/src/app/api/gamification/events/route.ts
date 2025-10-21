import { NextResponse } from 'next/server';
import { trackGamificationEvent } from '@/lib/gamification/service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, eventType, metadata } = body;

    if (!userId || !eventType) {
      return NextResponse.json(
        { error: 'userId and eventType are required' },
        { status: 400 }
      );
    }

    console.log(`🎯 API: Tracking event ${eventType} for user ${userId}`);
    const event = await trackGamificationEvent(userId, eventType, metadata);
    console.log(`✅ API: Event tracked successfully: +${event.points} points`);

    return NextResponse.json({
      success: true,
      event,
      message: `¡Evento registrado! +${event.points} puntos de gamificación`
    });
  } catch (error) {
    console.error('❌ API Error tracking gamification event:', error);
    return NextResponse.json(
      { error: 'Failed to track event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}