import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { EventType } from '@pandoras/gamification';
import { GamificationService } from '@/lib/gamification/service';

export async function POST(request: Request) {
  try {
    const requestHeaders = await headers();
    const headerWallet = requestHeaders.get('x-thirdweb-address') ??
      requestHeaders.get('x-wallet-address') ??
      requestHeaders.get('x-user-address');

    if (!headerWallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, metadata } = body;

    const userId = headerWallet.toLowerCase();

    // Validar eventType
    if (!Object.values(EventType).includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Trackear evento
    // Trackear evento usando el servicio que conecta a la BD
    const result = await GamificationService.trackEvent(userId, eventType, {
      ...metadata,
      walletAddress: headerWallet,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('Gamification event tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
