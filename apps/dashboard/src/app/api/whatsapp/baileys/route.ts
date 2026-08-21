/**
 * POST /api/whatsapp/baileys — Initiate or terminate a WhatsApp Gateway session
 * GET  /api/whatsapp/baileys — Get full session health (status, phone, heartbeat)
 *
 * This route is the bridge between Connectivity Studio UI and the external
 * WhatsApp Gateway. Protected by Admin Session / Internal Auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BaileysWhatsAppProvider } from '@/lib/whatsapp/providers/baileys';
import { getAuth, isAdmin } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

async function isAuthorizedRequest(req: NextRequest): Promise<boolean> {
  // 1. Internal secret header check
  const internalSecret = process.env.PANDORAS_INTERNAL_SECRET || process.env.CRON_SECRET || '';
  const authHeader = req.headers.get('authorization');
  if (internalSecret && authHeader === `Bearer ${internalSecret}`) {
    return true;
  }

  // 2. Admin Web3 session check
  try {
    const { session, isVerified } = await getAuth(await headers());
    if (isVerified && session?.address && (await isAdmin(session.address))) {
      return true;
    }
  } catch {
    // Continue
  }

  // 3. In development allow local testing
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

/** POST { action: 'init' | 'terminate', tenantId: string } */
export async function POST(req: NextRequest) {
  try {
    const authorized = await isAuthorizedRequest(req);
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized access to Baileys gateway' }, { status: 401 });
    }

    const body = (await req.json()) as { action: 'init' | 'terminate'; tenantId: string };
    const { action, tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const sessionId = `tenant_${tenantId}`;

    if (action === 'init') {
      const gatewayOnline = await BaileysWhatsAppProvider.pingGateway();
      if (!gatewayOnline) {
        return NextResponse.json(
          {
            error: 'WhatsApp Gateway is unreachable.',
            hint: 'Verify WHATSAPP_GATEWAY_URL is set and the bridge process is running.',
          },
          { status: 503 }
        );
      }

      const health = await BaileysWhatsAppProvider.initSession(sessionId);
      return NextResponse.json({
        ...health,
        positioningNote: 'Baileys QR Bridge is for Pyme / Sandbox / Pilot use. For Enterprise production, use Meta Cloud API.',
      });
    }

    if (action === 'terminate') {
      const ok = await BaileysWhatsAppProvider.terminateSession(sessionId);
      return NextResponse.json({ success: ok, sessionId });
    }

    return NextResponse.json({ error: 'Invalid action. Use: init | terminate' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** GET ?tenantId=xxx — Poll session health for Connectivity Studio UI */
export async function GET(req: NextRequest) {
  const authorized = await isAuthorizedRequest(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized access to Baileys gateway' }, { status: 401 });
  }

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  const sessionId = `tenant_${tenantId}`;
  const health = await BaileysWhatsAppProvider.getSessionHealth(sessionId);

  return NextResponse.json({
    ...health,
    connected: health.status === 'connected',
  });
}
