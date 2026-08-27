import { NextRequest, NextResponse } from 'next/server';
import { ExecutionEngine } from '@/lib/hermes/execution-engine';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { HermesExecutionEngine } from '@/lib/hermes/kernel/execution/execution-api';
import { TelegramAdapter } from '@/lib/hermes/adapters/telegram-adapter';
import { ExecutionRequest } from '@/lib/hermes/contracts/universal';

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

      const orgContext = await OrganizationSDK.resolve(projectId, 'HERMES');
      let botToken = metadata?.botConfig?.telegramToken || (orgContext.activeProduct?.connectors as any)?.telegram?.botToken;

      // Env override parity with the legacy route (bot/webhook/route.ts): any
      // project's Telegram bot token can be managed via a per-slug Railway env
      // var (TELEGRAM_<SLUG>_BOT_TOKEN) so it can be rotated without touching
      // the DB.
      const envTokenKey = `TELEGRAM_${projectRecord.slug.toUpperCase().replace(/-/g, '_')}_BOT_TOKEN`;
      botToken = process.env[envTokenKey] || botToken;

      body.botToken = botToken;
      body.projectRecord = projectRecord;
      body.metadata = metadata;

      const context = TelegramAdapter.parse(projectId, body);
      userMessage = context.payload.userMessage;
      chatId = context.payload.chatId;

      if (!userMessage && !context.payload.raw?.callback_query) {
        return NextResponse.json({ ok: true, note: 'Ignored non-message update' });
      }

      // Execute via Unified API
      const engine = new HermesExecutionEngine();
      const result = await engine.execute(context);

      const reply = TelegramAdapter.render(result);

      // Coherent reply contract for the Channel Mesh bot bridge (Fase 2/3):
      // - The bot daemon (pandoras-telegram-bot) POSTs the raw Telegram update with
      //   header `x-hermes-bot: 1`, signalling it will render the reply itself
      //   (including inline evidence + human-escalation buttons). In that mode we
      //   RETURN (reply, evidenceCid, escalate) and DO NOT send directly -> single
      //   response with reply_markup, no double-send.
      // - If the webhook is hit by Telegram's native webhook (no bot header), we send
      //   the reply directly over the bot token as a safe self-contained fallback.
      const botWillReply = req.headers.get('x-hermes-bot') === '1';

      const tel = (result.telemetry as any) || {};
      const escalate = tel.blocked === true
        || tel.fallbackTriggered === 'technical'
        || tel.fallbackTriggered === 'knowledge';
      const evidenceCid = tel.evidenceCid || null;

      const sendDirectly = botToken && !!reply && reply.trim() && !botWillReply;
      if (sendDirectly) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: reply })
        }).catch(e => console.error('[Webhook Telegram Send Error]:', e));
      }

      return NextResponse.json({
        ok: true,
        channel,
        result,
        reply: (botWillReply && reply) ? reply : undefined,
        evidenceCid,
        escalate,
        replyHandledByBot: !!(botWillReply && reply && reply.trim()),
      });
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
