import { NextResponse } from 'next/server';
import { DefaultOmnichannelGateway } from '@/lib/pandoras/core/domains/channels/omnichannel-gateway';
import { DefaultCognitiveChannelDispatcher } from '@/lib/pandoras/core/domains/channels/channel-dispatcher';
import { DuplicateMessageError, InvalidChannelPayloadError } from '@/lib/pandoras/core/domains/channels/channel-errors';

const omnichannelGateway = new DefaultOmnichannelGateway();
const channelDispatcher = new DefaultCognitiveChannelDispatcher();

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetTenant = searchParams.get('tenant') || searchParams.get('organizationId');

    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const updateId = body.update_id || Date.now();

    // LOCK C5.18: Thin webhook boundary. Delegate directly to OmnichannelGateway.
    const normalized = await omnichannelGateway.receive({
      channelType: 'telegram',
      externalId: String(updateId),
      rawPayload: {
        ...body,
        targetTenant
      }
    });

    // 6.5.2.1: Asynchronously dispatch cognitive response back to Telegram in background
    channelDispatcher.dispatchAsync(normalized).catch((err) => {
      console.error('[Telegram Dispatch Error]:', err);
    });

    return NextResponse.json({
      status: 'ACCEPTED',
      normalizedMessageId: normalized.message.messageId,
      organizationId: normalized.organizationId,
      correlationId: normalized.correlationId
    });

  } catch (error: any) {
    if (error instanceof DuplicateMessageError) {
      // C5.17: Return HTTP 200 for duplicate webhook deliveries so Telegram does not retry
      return NextResponse.json({ status: 'IDEMPOTENT_SKIPPED', message: error.message }, { status: 200 });
    }
    if (error instanceof InvalidChannelPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[Telegram Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
