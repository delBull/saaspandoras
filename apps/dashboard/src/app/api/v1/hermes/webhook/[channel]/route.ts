import { NextRequest, NextResponse } from 'next/server';
import { OrganizationSDK } from '@saasfly/shared';
import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";
import { DefaultOmnichannelGateway } from '@saasfly/hermes-core';
import { DefaultCognitiveChannelDispatcher } from '@saasfly/hermes-core';
import { DuplicateMessageError, InvalidChannelPayloadError } from '@saasfly/hermes-core';

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

    const tgText = body?.message?.text || body?.channel_post?.text || '';
    if (channel === 'telegram' && tgText && (tgText.includes('t.me/') || tgText.includes('A_ToolsX') || tgText.includes('A-TOOLS X') || tgText.includes('join our channel'))) {
      console.warn(`[Telegram Webhook] Blocked suspected spam payload: ${tgText.substring(0, 50)}...`);
      return NextResponse.json({ ok: true, status: 'SPAM_IGNORED' });
    }

    const projectRecord = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!projectRecord) {
      return NextResponse.json({ error: 'Unknown project' }, { status: 400 });
    }

    const metadata = (projectRecord.w2eConfig as any) || {};
    const storedSecret = metadata?.botConfig?.webhookSecret;

    if (channel === 'telegram' && storedSecret) {
      const requestSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (!requestSecret || requestSecret !== storedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Inject target tenant so the BindingResolver can correctly map the user
    body.targetTenant = projectRecord.slug;

    try {
      let externalId = String(body.update_id || body.id || Date.now());
      if (channel === 'whatsapp') {
        externalId = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id || String(Date.now());
      }

      // C5.18: Thin webhook boundary. Delegate directly to OmnichannelGateway.
      const normalized = await omnichannelGateway.receive({
        channelType: channel as any,
        externalId,
        rawPayload: body
      });

      // Asynchronous dispatch for native webhooks and bot daemon
      channelDispatcher.dispatchAsync(normalized).catch((err) => {
        console.error(`[${channel} Dispatch Error]:`, err);
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
      console.error(`[${channel} Webhook Error]:`, error);
      return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Hermes OS v5 Webhook Error]:', error);
    return NextResponse.json({ error: error?.message || 'Processing failed' }, { status: 500 });
  }
}
