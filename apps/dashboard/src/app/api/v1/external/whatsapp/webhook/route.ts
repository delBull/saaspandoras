import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { DefaultOmnichannelGateway } from '@/lib/pandoras/core/domains/channels/omnichannel-gateway';
import { DefaultCognitiveChannelDispatcher } from '@/lib/pandoras/core/domains/channels/channel-dispatcher';
import { DuplicateMessageError, InvalidChannelPayloadError } from '@/lib/pandoras/core/domains/channels/channel-errors';

const omnichannelGateway = new DefaultOmnichannelGateway();
const channelDispatcher = new DefaultCognitiveChannelDispatcher();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN;

  if (mode === 'subscribe' && VERIFY_TOKEN && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Meta Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetTenant = searchParams.get('tenant') || searchParams.get('organizationId');

    const bodyText = await request.text();

    // Verify Meta X-Hub-Signature-256 if secret is configured
    const metaAppSecret = process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET;
    const signatureHeader = request.headers.get('x-hub-signature-256');

    if (metaAppSecret && signatureHeader) {
      const signature = signatureHeader.replace(/^sha256=/, '');
      const expectedSignature = crypto
        .createHmac('sha256', metaAppSecret)
        .update(bodyText, 'utf8')
        .digest('hex');

      try {
        const sigBuf = Buffer.from(signature, 'hex');
        const expBuf = Buffer.from(expectedSignature, 'hex');
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
          console.warn('[WhatsApp Webhook] Invalid X-Hub-Signature-256');
          return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
        }
      } catch (sigErr) {
        console.warn('[WhatsApp Webhook] Signature verification failed:', sigErr);
        return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
      }
    }

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Determine if it's Native Meta Cloud API or Bridge
    const isNativeMeta = body.object === 'whatsapp_business_account';
    
    if (isNativeMeta) {
      const { WhatsAppDispatcher } = await import('@/lib/whatsapp/dispatcher');
      const dispatchResult = await WhatsAppDispatcher.dispatch(body);
      return NextResponse.json(dispatchResult);
    }

    let rawPayload = body;
    
    if (!isNativeMeta) {
      rawPayload.targetTenant = targetTenant;
    }

    // LOCK C5.18: Thin webhook boundary. Delegate directly to OmnichannelGateway.
    // The Gateway and Adapter will enforce C5.11 (Tenant Binding) and ignore any tenantId in the envelope.
    const normalized = await omnichannelGateway.receive({
      channelType: 'whatsapp',
      externalId: String(rawPayload.externalId),
      rawPayload: rawPayload
    });

    // 6.5.3: Asynchronously dispatch cognitive response back via OutboundRouter
    channelDispatcher.dispatchAsync(normalized).catch((err) => {
      console.error('[WhatsApp Dispatch Error]:', err);
    });

    return NextResponse.json({
      status: 'ACCEPTED',
      normalizedMessageId: normalized.message.messageId,
      organizationId: normalized.organizationId,
      correlationId: normalized.correlationId
    });

  } catch (error: any) {
    if (error instanceof DuplicateMessageError) {
      // C5.17: Return HTTP 200 for duplicate webhook deliveries so SignalWire does not retry
      return NextResponse.json({ status: 'IDEMPOTENT_SKIPPED', message: error.message }, { status: 200 });
    }
    if (error instanceof InvalidChannelPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[WhatsApp Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
