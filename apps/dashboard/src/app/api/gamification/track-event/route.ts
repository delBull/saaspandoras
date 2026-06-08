import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { EventType } from '@pandoras/gamification';
import { GamificationService } from '@/lib/gamification/service';

export async function POST(request: Request) {
  try {
    // Prefer JWT session (verified) for write operations
    const auth = await getAuth();
    let userId = auth.isVerified && auth.session?.address ? auth.session.address : null;
    let headerWallet: string | null = null;

    if (!userId) {
      const requestHeaders = await headers();
      headerWallet = requestHeaders.get('x-thirdweb-address') ??
        requestHeaders.get('x-wallet-address') ??
        requestHeaders.get('x-user-address');
      if (headerWallet) userId = headerWallet.toLowerCase();
    }

    if (!userId) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, metadata } = body;

    // Validar eventType
    if (!Object.values(EventType).includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Trackear evento
    // Trackear evento usando el servicio que conecta a la BD
    const result = await GamificationService.trackEvent(userId, eventType, {
      ...metadata,
      walletAddress: headerWallet ?? userId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('Gamification event tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
