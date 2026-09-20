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
    // Priority: Query param ?tenant= (whitelabel bot) -> /start <slug> -> interlocutor.tenantSlug -> bindings -> 'pandoras'
    const urlParamTenant = req.nextUrl?.searchParams?.get('tenant');
    let tenantSlug = (urlParamTenant || '').toLowerCase();

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
    } else if (!tenantSlug && interlocutor.tenantSlug) {
      tenantSlug = interlocutor.tenantSlug;
    } else if (!tenantSlug && telegramId) {
      // Check if user has an explicit active organization bound in telegramBindings
      try {
        const { telegramBindings } = await import('@/db/schema');
        const binding = await db.query.telegramBindings.findFirst({
          where: eq(telegramBindings.telegramUserId, telegramId),
          columns: { activeOrganizationId: true }
        });
        if (binding?.activeOrganizationId) {
          tenantSlug = binding.activeOrganizationId;
        }
      } catch (bindErr) {
        console.warn('[Hermes Telegram Webhook] Non-blocking warning reading activeOrganizationId from telegramBindings:', bindErr);
      }
    }

    if (!tenantSlug) {
      tenantSlug = 'pandoras';
    } else if (tenantSlug !== 'pandoras') {
      try {
        const { TenantAuthorityService } = await import('@/lib/pandoras/core/domains/hermes/tenants/tenant-authority');
        const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantSlug);
        if (!canonical) {
          console.warn(`[Hermes Telegram Webhook] 🔒 Rejected unverified/spoofed tenant slug: '${tenantSlug}'. Falling back to 'pandoras'.`);
          tenantSlug = 'pandoras';
        } else {
          tenantSlug = canonical.projectSlug;
        }
      } catch (authErr) {
        console.warn('[Hermes Telegram Webhook] Non-blocking tenant verification warning:', authErr);
        tenantSlug = 'pandoras';
      }
    }

    // 2.5 Enrich Interlocutor with Authoritative Tenant Context (F6 Capa 4)
    if (!interlocutor.tenantContext && tenantSlug) {
      try {
        const { TenantContextResolver } = await import('@/lib/identity/tenant-context-resolver');
        const resolvedTc = await TenantContextResolver.resolveTenantContext(
          interlocutor.canonicalIdentity || interlocutor.actorId,
          tenantSlug
        );
        if (resolvedTc) {
          interlocutor.tenantContext = resolvedTc;
          interlocutor.tenantSlug = tenantSlug;
        }
      } catch (tcErr) {
        console.warn('[Hermes Telegram Webhook] Non-blocking warning resolving tenantContext:', tcErr);
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

    if (!botToken) {
      console.warn(`[Hermes Telegram Webhook] ⚠️ No Telegram bot token found in environment or tenant config for '${tenantSlug}'. Cannot deliver message to chat ${chatId}.`);
    }

    // 3.5 Handle Human Escalation Callback or Intent (Gate 24: REQUESTED, not falsely ASSIGNED)
    const isEscalateCallback = callbackQuery?.data?.startsWith('escalate_human_');
    const isHumanRequest = /(?:asesor|humano|persona|agente humano|atenci[oó]n humana|hablar con alguien|ejecutivo|soporte humano)/i.test(rawText);

    if (isEscalateCallback || isHumanRequest) {
      // Human Escalation Gate: Registrar alerta y confirmar
      try {
        const { SecurityAuditLogger } = await import('@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger');
        await SecurityAuditLogger.logEvent({
          eventType: 'HUMAN_ESCALATION_REQUESTED',
          actorId: interlocutor.actorId,
          organizationId: tenantSlug,
          severity: 'INFO',
          policyDecision: 'ESCALATE',
          correlationId: `esc_tg_${telegramId}_${Date.now()}`,
          metadata: {
            channel: 'telegram',
            telegramId,
            userName: interlocutor.name,
            reason: isEscalateCallback ? 'Botón inline presionado' : 'Intención conversacional detectada',
            stage: 'REQUESTED',
          },
        });
      } catch (auditErr) {
        console.warn('[Hermes Telegram Webhook] Non-blocking escalation audit error:', auditErr);
      }

      if (botToken) {
        if (callbackQuery?.id) {
          await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
              text: 'Tu solicitud ha sido remitida a un asesor humano oficial.',
              show_alert: true,
            }),
          }).catch(() => undefined);
        }

        const escalationMessage = `🤝 *Solicitud de Atención Humana Registrada*\n\nHemos canalizado tu consulta con el equipo de dirección patrimonial de *${tenantSlug.toUpperCase()}*. Un asesor se pondrá en contacto contigo a la brevedad.\n\nMientras tanto, puedes consultar los documentos oficiales y títulos en tu portal.`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: escalationMessage,
            parse_mode: 'Markdown',
          }),
        }).catch(() => undefined);

        return NextResponse.json({ ok: true, escalated: true, actor: interlocutor.name });
      }
    }

    // 4. Resolve Canonical Organization Context (Security Authority = canonicalOrgId UUID)
    let canonicalOrgId = tenantSlug;
    let canonicalOrgName = tenantSlug === 'pandoras' ? "Pandora's Growth OS" : tenantSlug;
    try {
      const { OrganizationSDK } = await import('@/lib/platform/organization-sdk');
      const org = await OrganizationSDK.resolve(tenantSlug, 'HERMES');
      canonicalOrgId = org.organizationId;
      canonicalOrgName = org.name;
    } catch {
      // Non-blocking fallback preserves routing key
    }

    // 5. Dispatch to HermesRuntime with Cognitive Context
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
        canonicalIdentity: interlocutor.canonicalIdentity,
        tenantContext: interlocutor.tenantContext,
      },
    });

    const replyContent = runtimeResponse.content || 'Entendido. Estoy procesando tu solicitud en Pandora\'s Growth OS.';

    // 6. Build Rich Inline Keyboard (IPFS Evidence, Portal & Escalation Buttons)
    const inlineKeyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>> = [];

    // Detection of IPFS CIDs in response content or provenance metadata
    const ipfsMatch = replyContent.match(/(?:ipfs:\/\/)?(bafkrei[a-z0-9]{40,}|Qm[a-zA-Z0-9]{44})/i);
    const receiptCid =
      (runtimeResponse as any)?.claimProvenanceReceipt?.claims?.find((c: any) => c.contractCid)?.contractCid ||
      (runtimeResponse as any)?.trace?.claimProvenanceReceipt?.claims?.find((c: any) => c.contractCid)?.contractCid;
    const rawCid = ipfsMatch?.[1] || receiptCid;

    if (rawCid) {
      inlineKeyboard.push([
        { text: '📜 Ver Evidencia Notarizada (IPFS)', url: `https://gateway.pinata.cloud/ipfs/${rawCid}` }
      ]);
    }

    // Portal / TMA Deep Link button
    const portalBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
    if (tenantSlug === 'snarai') {
      inlineKeyboard.push([
        { text: "🏛️ Abrir Portal S'Narai", url: 'https://snarai.com/portal' },
      ]);
    } else if (tenantSlug !== 'pandoras') {
      inlineKeyboard.push([
        { text: `🏛️ Abrir Portal (${tenantSlug})`, url: `${portalBaseUrl}/portal/${tenantSlug}` }
      ]);
    }

    // Advisor button for commercial engagement
    if (!interlocutor.isBoss) {
      inlineKeyboard.push([
        { text: '👤 Hablar con un Asesor Humano', callback_data: `escalate_human_${tenantSlug}` }
      ]);
    }

    // 7. Deliver Response to Telegram Chat
    if (botToken && replyContent) {
      const payload: Record<string, any> = {
        chat_id: chatId,
        text: replyContent,
        parse_mode: 'Markdown',
      };

      if (inlineKeyboard.length > 0) {
        payload.reply_markup = { inline_keyboard: inlineKeyboard };
      }

      const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!sendRes.ok) {
        // Fallback to plain text if Markdown parsing failed due to unescaped special characters
        delete payload.parse_mode;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
