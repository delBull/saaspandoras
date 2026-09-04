import { NextRequest, NextResponse } from 'next/server';
import { ChannelContext, ChannelOutboundPayload } from '@/lib/hermes/channel-gateway';
import { ChannelGatewayAdapter } from '@/lib/hermes/bot/channel-gateway-adapter';

const adapter = new ChannelGatewayAdapter();

/**
 * CHANNEL GATEWAY (F10.4)
 * This endpoint is the unified entrypoint for ANY edge transport (Telegram, WhatsApp, Web).
 * It expects a normalized `ChannelContext` payload.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ChannelContext;

    if (!payload || !payload.channel || !payload.message || !payload.externalUserId || !payload.externalConversationId) {
      return NextResponse.json({ ok: false, error: 'Invalid ChannelContext payload' }, { status: 400 });
    }

    // 1. Authenticate the Edge Transport (e.g., via HMAC, Shared Secret, or Internal Auth)
    // TODO: PR 2 will implement transport authentication
    const expectedSecret = process.env.HERMES_EDGE_SECRET || process.env.HERMES_WEBHOOK_SECRET;
    const authHeader = req.headers.get('Authorization') || req.headers.get('x-edge-secret');
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}` && authHeader !== expectedSecret) {
       console.warn(`[Channel Gateway] Unauthorized attempt from edge.`);
       // return NextResponse.json({ ok: false, error: 'Unauthorized Edge Transport' }, { status: 401 });
    }

    console.log(`📡 [Channel Gateway] Inbound from ${payload.channel} - User: ${payload.externalUserId} - Tenant Hint: ${payload.tenantHint}`);

    // 2. Tenant Resolution & Identity Resolution & Execution Engine
    // The ChannelGatewayAdapter now handles routing to the correct Hermes execution logic.
    const responsePayload = await adapter.handleInbound(payload);

    return NextResponse.json({ ok: true, data: responsePayload });

  } catch (err: any) {
    console.error('[Channel Gateway] Error processing inbound:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}
