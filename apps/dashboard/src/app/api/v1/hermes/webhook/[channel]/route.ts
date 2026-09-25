import { NextRequest, NextResponse } from 'next/server';
import { ExecutionEngine } from '@/lib/hermes/execution-engine';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { HermesExecutionEngine } from '@/lib/hermes/kernel/execution/execution-api';
import { TelegramAdapter } from '@/lib/hermes/adapters/telegram-adapter';
import { ExecutionRequest } from '@/lib/hermes/contracts/universal';
import { DefaultOmnichannelGateway } from '@/lib/pandoras/core/domains/channels/omnichannel-gateway';
import { DefaultCognitiveChannelDispatcher } from '@/lib/pandoras/core/domains/channels/channel-dispatcher';
import { DuplicateMessageError, InvalidChannelPayloadError } from '@/lib/pandoras/core/domains/channels/channel-errors';

const omnichannelGateway = new DefaultOmnichannelGateway();
const channelDispatcher = new DefaultCognitiveChannelDispatcher();

/**
 * 📡 Pandora's Platform OS v5 — Autonomous Webhook Endpoint powered by ExecutionEngine Kernel
 * /api/v1/hermes/webhook/[channel]
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  try {
    const { channel } = await params;
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || searchParams.get('project');
    const projectIdStr = searchParams.get('projectId');

    let projectId: number | null = projectIdStr ? parseInt(projectIdStr, 10) : null;

    const targetSlug = slug;

    if (!projectId) {
      if (!targetSlug) {
        return NextResponse.json({ error: 'Project or slug parameter is required' }, { status: 400 });
      }
      const proj = await db.query.projects.findFirst({
        where: eq(projects.slug, targetSlug),
        columns: { id: true }
      });
      if (proj) projectId = proj.id;
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project or slug parameter is required' }, { status: 400 });
    }

    const body = await req.json();

    let userMessage = '';
    let chatId = '';

    if (channel === 'telegram') {
      const projectRecord = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!projectRecord) {
        return NextResponse.json({ error: 'Unknown project' }, { status: 400 });
      }

      const metadata = (projectRecord.w2eConfig as any) || {};
      const storedSecret = metadata?.botConfig?.webhookSecret;

      if (storedSecret) {
        const requestSecret = req.headers.get('x-telegram-bot-api-secret-token');
        if (!requestSecret || requestSecret !== storedSecret) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }

      // Inject the target tenant so the BindingResolver can correctly map the user
      body.targetTenant = projectRecord.slug;

      try {
        // C5.18: Thin webhook boundary. Delegate directly to OmnichannelGateway.
        const normalized = await omnichannelGateway.receive({
          channelType: 'telegram',
          externalId: String(body.update_id),
          rawPayload: body
        });

        // Asynchronous dispatch for native webhooks and bot daemon
        channelDispatcher.dispatchAsync(normalized).catch((err) => {
          console.error('[Telegram Dispatch Error]:', err);
        });

        return NextResponse.json({
          ok: true,
          status: 'ACCEPTED',
          normalizedMessageId: normalized.message.messageId,
          organizationId: normalized.organizationId,
          correlationId: normalized.correlationId
        });
      } catch (error: any) {
        if (error instanceof DuplicateMessageError) {
          return NextResponse.json({ status: 'IDEMPOTENT_SKIPPED', message: error.message }, { status: 200 });
        }
        if (error instanceof InvalidChannelPayloadError) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('[Telegram Webhook Error]:', error);
        return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
      }
    }

    // Default fallback for other channels temporarily
    if (channel === 'whatsapp') {
      userMessage = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || body?.message || '';
      chatId = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || body?.from || '';
    } else {
      userMessage = body?.message || body?.text || '';
      chatId = body?.chatId || body?.userId || 'webchat-session';
    }

    if (!userMessage) {
      return NextResponse.json({ ok: true, note: 'No text message to process' });
    }

    // Legacy execution for non-telegram
    const result = await ExecutionEngine.execute({
      projectId,
      chatId,
      userMessage,
      channel
    });

    return NextResponse.json({
      ok: true,
      channel,
      reply: result.reply
    });

  } catch (error: any) {
    console.error('[Hermes OS v5 Webhook Error]:', error);
    return NextResponse.json({ error: error?.message || 'Execution Engine processing failed' }, { status: 500 });
  }
}
