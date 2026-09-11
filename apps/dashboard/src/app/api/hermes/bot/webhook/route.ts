import { NextRequest, NextResponse } from 'next/server';
import { InterlocutorResolver } from '@/lib/hermes/identity/interlocutor-resolver';
import { getDefaultRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 📡 Unified Telegram Bot Webhook for Hermes OS & Pandora's Platform
 * Endpoint: /api/hermes/bot/webhook
 *
 * Handles live updates from Telegram Bot API directly in Next.js.
 * Supports Boss recognition, multi-tenant resolution (/start <slug>), and executive directives.
 */
export async function POST(req: NextRequest) {
  try {
    // 0. Authenticate Webhook Caller (Fail-closed anti-forgery)
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_BOT_WEBHOOK_SECRET;
    const allowUnsigned = process.env.TELEGRAM_ALLOW_UNSIGNED_WEBHOOK === 'true';
    if (expectedSecret) {
      const incomingSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (!incomingSecret || incomingSecret !== expectedSecret) {
        if (allowUnsigned && !incomingSecret) {
          console.warn('[Hermes Telegram Webhook] ⚠️ Accepting unsigned Telegram request due to TELEGRAM_ALLOW_UNSIGNED_WEBHOOK=true. Register webhook with secret_token at /api/hermes/bot/webhook/register');
        } else {
          console.warn(`[Hermes Telegram Webhook] 🚫 Unauthorized: ${incomingSecret ? 'Invalid' : 'Missing'} X-Telegram-Bot-Api-Secret-Token. Set secret in Telegram via /api/hermes/bot/webhook/register or scripts/register-telegram-webhook.ts`);
          return NextResponse.json({ ok: false, error: 'Unauthorized: Missing or invalid secret token' }, { status: 401 });
        }
      }
    } else if (process.env.NODE_ENV === 'production' && !allowUnsigned) {
      console.warn('[Hermes Telegram Webhook] 🚨 TELEGRAM_WEBHOOK_SECRET not configured in production; rejecting unsigned requests.');
      return NextResponse.json({ ok: false, error: 'Unauthorized: Webhook secret not configured' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Support message and callback_query
    const message = body.message || body.channel_post || body.edited_message;
    const callbackQuery = body.callback_query;

    const fromUser = message?.from || callbackQuery?.from;
    const chat = message?.chat || callbackQuery?.message?.chat;
    const rawText = (message?.text || callbackQuery?.data || '').trim();

    if (!chat?.id || (!rawText && !callbackQuery)) {
      // Return 200 to Telegram so it doesn't keep retrying non-interactive events
      return NextResponse.json({ ok: true, note: 'Non-actionable update acknowledged' });
    }

    const chatId = String(chat.id);
    const telegramId = String(fromUser?.id || chatId);
    const telegramUsername = fromUser?.username || undefined;
    const firstName = fromUser?.first_name || undefined;
    const lastName = fromUser?.last_name || undefined;
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || undefined;

    // 1. Resolve Interlocutor (Boss, Collaborator, Lead, or Registered User)
    const interlocutor = await InterlocutorResolver.resolve({
      channel: 'telegram',
      telegramId,
      telegramUsername,
      nameHint: fullName,
    });

    console.log(`[Hermes Telegram Webhook] 🤖 Update received from ${interlocutor.name} (ID: ${telegramId}) | Boss: ${interlocutor.isBoss}`);

    // 2. Resolve Tenant / Organization Scope (Default is Hermes OS / Pandora's Growth OS)
    let tenantSlug = 'pandoras';

    // Parse /start command parameter: /start <tenantSlug> (e.g. /start snarai)
    const startMatch = rawText.match(/^\/start\s+([a-zA-Z0-9_-]+)/i);
    if (startMatch && startMatch[1]) {
      tenantSlug = startMatch[1].toLowerCase();
      // If user has a telegram binding, persist active organization switch
      if (telegramId) {
        const { telegramBindings } = await import('@/db/schema');
        await db.update(telegramBindings)
          .set({ activeOrganizationId: tenantSlug, lastSeenAt: new Date() })
          .where(eq(telegramBindings.telegramUserId, telegramId))
          .catch(() => undefined);
      }
    } else if (interlocutor.tenantSlug) {
      tenantSlug = interlocutor.tenantSlug;
    } else if (telegramId) {
      // Check if user has an explicit active organization bound in telegramBindings
      const { telegramBindings } = await import('@/db/schema');
      const binding = await db.query.telegramBindings.findFirst({
        where: eq(telegramBindings.telegramUserId, telegramId),
        columns: { activeOrganizationId: true }
      });
      if (binding?.activeOrganizationId) {
        tenantSlug = binding.activeOrganizationId;
      }
    }

    // 3. Resolve Telegram Bot Token for sending response
    let botToken = process.env.HERMES_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken && tenantSlug !== 'pandoras') {
      const proj = await db.query.projects.findFirst({
        where: eq(projects.slug, tenantSlug),
        columns: { tenantRuntimeConfig: true, w2eConfig: true }
      });
      if (proj) {
        const trc = proj.tenantRuntimeConfig as any;
        const w2e = proj.w2eConfig as any;
        botToken = trc?.secrets?.telegramBotToken || trc?.telegramBotToken || w2e?.botConfig?.telegramToken;
      }
    }

    // 4. Dispatch to HermesRuntime with Cognitive Context
    const runtime = getDefaultRuntime();
    const runtimeResponse = await runtime.respond({
      organizationId: tenantSlug,
      conversationId: `conv_tg_${telegramId}_${tenantSlug}`,
      message: {
        id: `tg_msg_${message?.message_id || Date.now()}`,
        role: 'USER',
        content: rawText || 'Hola',
        createdAt: new Date(),
      },
      controlPlaneContext: {
        actorId: interlocutor.actorId,
        organizationId: tenantSlug,
        role: interlocutor.isBoss ? 'OWNER' : (interlocutor.isCollaborator ? 'OPERATOR' : 'VIEWER'),
        permissions: interlocutor.isBoss
          ? ['governance.admin', 'knowledge.read', 'runtime.respond', 'platform.decrees']
          : ['runtime.respond'],
        sessionId: `tg_sess_${telegramId}`,
        interlocutor,
      },
    });

    const replyContent = runtimeResponse.content || 'Entendido. Estoy procesando tu solicitud en Pandora\'s Growth OS.';

    // 5. Deliver Response to Telegram Chat
    if (botToken && replyContent) {
      const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyContent,
          parse_mode: 'Markdown',
        }),
      });

      if (!sendRes.ok) {
        // Fallback to plain text if Markdown parsing failed due to unescaped special characters
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyContent,
          }),
        }).catch(err => console.error('[Hermes Telegram Webhook] Error sending fallback message:', err));
      }
    }

    return NextResponse.json({ ok: true, actor: interlocutor.name, role: interlocutor.role });

  } catch (error: any) {
    console.error('[Hermes Telegram Webhook] Unhandled error:', error);
    // Return 200 to Telegram so it doesn't DDoS with retry loops on internal errors
    return NextResponse.json({ ok: false, error: error?.message || 'Internal processing error' });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'Hermes Telegram Bot Webhook',
    timestamp: new Date().toISOString(),
  });
}
