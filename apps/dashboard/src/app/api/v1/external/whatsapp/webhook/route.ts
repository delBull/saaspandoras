import { NextResponse } from 'next/server';
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

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'hermes_verify_token_2026';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
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
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Determine if it's Native Meta Cloud API or Bridge
    const isNativeMeta = body.object === 'whatsapp_business_account';
    
    let rawPayload = body;

    if (!isNativeMeta) {
      // C5.23: Edge Authentication (Bridge -> Hermes)
      const bridgeToken = request.headers.get('x-bridge-token');
      const expectedToken = process.env.WA_BRIDGE_SECRET || 'dev_bridge_secret';
      
      if (bridgeToken !== expectedToken) {
        console.warn('[WhatsApp Webhook] Unauthorized attempt (Invalid x-bridge-token)');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!body || body.source !== 'whatsapp' || !body.externalId) {
        return NextResponse.json({ error: 'Invalid Hermes WhatsApp Envelope' }, { status: 400 });
      }
    } else {
      // It's Native Meta Cloud API
      // Validation of X-Hub-Signature-256 could go here
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      if (!change || !change.messages || change.messages.length === 0) {
        // Just a status update or other event, skip silently
        return NextResponse.json({ status: 'IGNORED_EVENT' }, { status: 200 });
      }

      const msg = change.messages[0];
      const contact = change.contacts?.[0];
      
      // Transform into Hermes Envelope for backward compatibility with WhatsAppAdapter
      rawPayload = {
        source: 'whatsapp',
        externalId: msg.id,
        identity: {
          phone: msg.from,
          name: contact?.profile?.name || ''
        },
        payload: {
          text: msg.type === 'text' ? msg.text.body : '',
          timestamp: new Date(Number(msg.timestamp) * 1000).toISOString()
        },
        context: {
          tenantId: 'ignored' // Handled by BindingResolver
        },
        targetTenant
      };
    }
    
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
