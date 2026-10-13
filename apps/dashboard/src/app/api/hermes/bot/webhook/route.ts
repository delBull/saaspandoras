import { NextRequest, NextResponse } from 'next/server';
import { InterlocutorResolver } from '@saasfly/hermes-core';
import { getDefaultRuntime } from '@saasfly/hermes-core';
import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { eq, or } from "@saasfly/db-core";

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
    // 0. Authenticate Webhook Caller (Fail-closed anti-forgery with timing-safe verification)
    const candidateSecrets: { secret: string; tenantHint?: string }[] = [
      { secret: process.env.TELEGRAM_WEBHOOK_SECRET || '' },
      { secret: process.env.TELEGRAM_BOT_WEBHOOK_SECRET || '' },
      { secret: process.env.TELEGRAM_SNARAI_WEBHOOK_SECRET || '', tenantHint: 'snarai' },
      { secret: process.env.TELEGRAM_TEAM_BOT_WEBHOOK_SECRET || '', tenantHint: 'pandoras' },
    ].filter(s => !!s.secret);

    const incomingSecret = req.headers.get('x-telegram-bot-api-secret-token');

    // Strict fail-closed: If secret is not configured, reject requests unconditionally
    if (candidateSecrets.length === 0) {
      console.warn('[Hermes Telegram Webhook] 🚨 TELEGRAM_WEBHOOK_SECRET not configured; rejecting request fail-closed.');
      return NextResponse.json({ ok: false, error: 'Unauthorized: Webhook secret not configured on server' }, { status: 401 });
    }

    const { CryptographicProofVerifier } = await import('@saasfly/hermes-core');
    let matchedCandidate: { secret: string; tenantHint?: string } | null = null;

    for (const cand of candidateSecrets) {
      const verification = CryptographicProofVerifier.verifyTelegramWebhookSecret(
        {
          actorId: 'telegram_bot_api',
          tenantId: 'system',
          authProvider: 'TELEGRAM_WEBHOOK_SECRET',
          secretToken: incomingSecret || '',
          proofSignature: incomingSecret || '',
          issuedAt: Date.now(),
          nonce: 'preauth',
        },
        cand.secret
      );
      if (verification.valid) {
        matchedCandidate = cand;
        break;
      }
    }

    if (!matchedCandidate) {
      console.warn(`[Hermes Telegram Webhook] 🚫 Unauthorized: ${incomingSecret ? 'Invalid' : 'Missing'} X-Telegram-Bot-Api-Secret-Token.`);
      return NextResponse.json({ ok: false, error: 'Unauthorized: Missing or invalid secret token' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    // P1.2: Enforce valid update_id for anti-replay idempotency
    if (typeof body.update_id !== 'number' && typeof body.update_id !== 'string') {
      console.warn('[Hermes Telegram Webhook] 🚫 Missing or invalid update_id in Telegram update payload.');
      return NextResponse.json({ ok: false, error: 'Bad Request: Missing or invalid update_id' }, { status: 400 });
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
    // Priority: Query param ?tenant= (whitelabel bot) -> matched secret tenantHint -> /start <slug> -> interlocutor.tenantSlug -> bindings -> 'pandoras'
    const urlParamTenant = req.nextUrl?.searchParams?.get('tenant');
    let tenantSlug = (urlParamTenant || matchedCandidate?.tenantHint || '').toLowerCase();
    const isSnaraiOrigin = urlParamTenant === 'snarai' || matchedCandidate?.tenantHint === 'snarai';

    // Parse /start command parameter: /start <tenantSlug> (e.g. /start snarai)
    const startMatch = rawText.match(/^\/start\s+([a-zA-Z0-9_-]+)/i);
    if (startMatch && startMatch[1]) {
      const requestedSlug = startMatch[1].toLowerCase();
      // Tenant Membership Gate: Validate actor has rights to switch into requestedSlug unless it's default 'pandoras' or public tenant
      if (requestedSlug !== 'pandoras' && !interlocutor.isBoss) {
        try {
          const { HermesTenantMembershipService } = await import('@saasfly/hermes-core');
          const membershipService = new HermesTenantMembershipService();
          const authorizedTenants = await membershipService.getAuthorizedTenants(telegramId);
          const hasAccess = authorizedTenants.some(
            t => t.tenantSlug?.toLowerCase() === requestedSlug || t.organizationId.toLowerCase() === requestedSlug
          );
          const isPublicTenant = requestedSlug === 'snarai';
          if (!hasAccess && !isPublicTenant) {
            console.warn(`[Hermes Telegram Webhook] 🔒 Access Denied: Actor ${interlocutor.name} (${telegramId}) is not authorized for tenant '${requestedSlug}'. Retaining current tenant.`);
            return NextResponse.json({
              ok: false,
              error: `Forbidden: You are not an authorized member of organization '${requestedSlug}'`,
            }, { status: 403 });
          }
        } catch (memErr: any) {
          console.error(`[Hermes Telegram Webhook] Membership check failed for tenant '${requestedSlug}':`, memErr?.message);
          return NextResponse.json({ ok: false, error: 'Authorization error: Failed to verify tenant membership' }, { status: 403 });
        }
      }

      tenantSlug = requestedSlug;
      // Persist active organization switch only after authorization passed
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
    }

    // Tenant Authorization Enforcement: If operating under a non-root tenant, verify membership
    if (tenantSlug !== 'pandoras' && !interlocutor.isBoss) {
      try {
        const { HermesTenantMembershipService } = await import('@saasfly/hermes-core');
        const membershipService = new HermesTenantMembershipService();
        const authorizedTenants = await membershipService.getAuthorizedTenants(telegramId);
        const hasAccess = authorizedTenants.some(
          t => t.tenantSlug?.toLowerCase() === tenantSlug || t.organizationId.toLowerCase() === tenantSlug
        );
        const isPublicTenant = tenantSlug === 'snarai';
        if (!hasAccess && !isPublicTenant) {
          console.warn(`[Hermes Telegram Webhook] 🔒 Access Denied: Actor ${interlocutor.name} (${telegramId}) is not authorized for tenant '${tenantSlug}'.`);
          return NextResponse.json({
            ok: false,
            error: `Forbidden: You are not authorized to operate under tenant '${tenantSlug}'`,
          }, { status: 403 });
        }
      } catch (memErr: any) {
        console.error(`[Hermes Telegram Webhook] Membership check failed for tenant '${tenantSlug}':`, memErr?.message);
        return NextResponse.json({ ok: false, error: 'Authorization error: Failed to verify tenant membership' }, { status: 403 });
      }
    }

    // 2.5 Enrich Interlocutor with Authoritative Tenant Context (F6 Capa 4)
    if (!interlocutor.tenantContext && tenantSlug) {
      try {
        const { TenantContextResolver } = await import('@saasfly/hermes-core');
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
    let botToken: string | undefined;

    // Prioritize dedicated bot token if update originated from S'Narai bot or targets S'Narai bot
    if (isSnaraiOrigin || (tenantSlug === 'snarai' && !process.env.HERMES_TELEGRAM_BOT_TOKEN)) {
      botToken = process.env.TELEGRAM_SNARAI_BOT_TOKEN;
    }

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

    if (!botToken && tenantSlug === 'snarai') {
      botToken = process.env.TELEGRAM_SNARAI_BOT_TOKEN;
    }

    if (!botToken) {
      botToken = process.env.HERMES_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
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
        const { SecurityAuditLogger } = await import('@saasfly/hermes-core');
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

      // 3.6 Queue the escalation into the closer queue (TMA HITL) via the canonical
      // EscalationService: pauses the conversation, inserts a PENDING hermesEscalations
      // row, and dispatches nexusActionRequests + team notifications to eligible closers.
      try {
        const { EscalationService } = await import('@saasfly/hermes-core');

        // Resolve canonical org for conversation correlation (best-effort; slug is the FK).
        let canonicalOrgForConv = tenantSlug;
        try {
          const { OrganizationSDK } = await import('@saasfly/shared');
          const org = await OrganizationSDK.resolve(tenantSlug, 'HERMES');
          if (org?.organizationId) canonicalOrgForConv = org.organizationId;
        } catch {
          // keep slug-based fallback conversation id
        }

        const escalationConversationId = `conv_tg_${telegramId}_${canonicalOrgForConv}`;

        // Deduplicate: never open a second PENDING escalation for an already-queued conversation.
        const pendingEscalations = await EscalationService.getEscalations(tenantSlug, 'PENDING');
        const alreadyQueued = pendingEscalations.some(
          (esc: any) => esc.conversationId === escalationConversationId,
        );

        if (!alreadyQueued) {
          await EscalationService.triggerEscalation({
            organizationId: tenantSlug,
            conversationId: escalationConversationId,
            actorId: interlocutor.actorId,
            channel: 'TELEGRAM',
            reason: 'USER_REQUEST',
            notes: JSON.stringify({
              source: isEscalateCallback ? 'inline_button' : 'intent_detected',
              telegramId,
              userName: interlocutor.name,
              excerpt: (rawText || '').slice(0, 300),
            }),
          });
        }
      } catch (queueErr) {
        console.warn('[Hermes Telegram Webhook] Non-blocking escalation queue error:', queueErr);
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
    const { OrganizationSDK } = await import('@saasfly/shared');
    let canonicalOrgId: string;
    let canonicalOrgName: string;
    try {
      const org = await OrganizationSDK.resolve(tenantSlug, 'HERMES');
      if (!org?.organizationId) {
        console.warn(`[Hermes Telegram Webhook] 🔒 OrganizationSDK.resolve returned empty organizationId for '${tenantSlug}'. Rejecting request.`);
        return NextResponse.json({ ok: false, error: 'Unauthorized: Target tenant organization not found' }, { status: 404 });
      }
      canonicalOrgId = org.organizationId;
      canonicalOrgName = org.name || tenantSlug;
    } catch (orgErr: any) {
      console.error(`[Hermes Telegram Webhook] 🚫 Failed to resolve authoritative canonical tenant for '${tenantSlug}':`, orgErr?.message);
      return NextResponse.json({ ok: false, error: 'Unauthorized: Invalid or unresolvable tenant' }, { status: 404 });
    }

    // 4.5 Authoritative Canonical Tenant Membership Gate (FC-001 & FC-003):
    // Security authority is SOLELY canonicalOrgId (UUID). Slugs are for routing only.
    // Platform Policy: 'pandoras' is the sovereign platform control plane; non-boss actors operate in public viewer mode
    // under pandoras, whereas tenant-specific organizations strictly require verified membership in that canonical UUID.
    let authorizedMembership: any = null;
    if (tenantSlug !== 'pandoras' && !interlocutor.isBoss) {
      try {
        const { HermesTenantMembershipService } = await import('@saasfly/hermes-core');
        const membershipService = new HermesTenantMembershipService();
        const authorizedTenants = await membershipService.getAuthorizedTenants(telegramId);
        // Strict Canonical UUID matching: A matching slug with a different organizationId is strictly REJECTED.
        authorizedMembership = authorizedTenants.find(
          t => t.organizationId.toLowerCase() === canonicalOrgId.toLowerCase()
        );
        const isPublicTenant = tenantSlug === 'snarai';
        if (!authorizedMembership && !isPublicTenant) {
          console.warn(`[Hermes Telegram Webhook] 🔒 Access Denied: Actor ${interlocutor.name} (${telegramId}) is not authorized for canonical organization '${canonicalOrgId}' (slug: '${tenantSlug}').`);
          return NextResponse.json({
            ok: false,
            error: `Forbidden: You are not authorized to operate under organization '${tenantSlug}'`,
          }, { status: 403 });
        }
      } catch (memErr: any) {
        console.error(`[Hermes Telegram Webhook] Membership check failed for canonical organization '${canonicalOrgId}':`, memErr?.message);
        return NextResponse.json({ ok: false, error: 'Authorization error: Failed to verify tenant membership' }, { status: 403 });
      }
    }

    // Authoritative Clearance Level & Role Derivation (Platform Policy & Least Privilege):
    // 1. Boss / Platform Admin: OWNER role, CONFIDENTIAL clearance.
    // 2. Tenant Members: Role derived from verified membership record (ADMIN -> CONFIDENTIAL, OPERATOR -> TENANT_RESTRICTED).
    // 3. Platform Root ('pandoras') and Public Tenant Visitors: strictly VIEWER role, PUBLIC clearance (no confidential data leakage).
    let effectiveRole: 'OWNER' | 'OPERATOR' | 'VIEWER' = 'VIEWER';
    let effectiveClearance: 'CONFIDENTIAL' | 'TENANT_RESTRICTED' | 'PUBLIC' = 'PUBLIC';

    if (interlocutor.isBoss) {
      effectiveRole = 'OWNER';
      effectiveClearance = 'CONFIDENTIAL';
    } else if (tenantSlug === 'pandoras') {
      effectiveRole = interlocutor.isCollaborator ? 'OPERATOR' : 'VIEWER';
      effectiveClearance = interlocutor.isCollaborator ? 'TENANT_RESTRICTED' : 'PUBLIC';
    } else if (authorizedMembership) {
      effectiveRole = authorizedMembership.role === 'ADMIN' || authorizedMembership.isOwner ? 'OWNER' : 'OPERATOR';
      effectiveClearance = authorizedMembership.role === 'ADMIN' || authorizedMembership.isOwner ? 'CONFIDENTIAL' : 'TENANT_RESTRICTED';
    } else {
      effectiveRole = 'VIEWER';
      effectiveClearance = 'PUBLIC';
    }

    // 5. Dispatch to HermesRuntime with Cognitive Context & Anti-Replay
    const { ActorIdentityBindingService, getActiveNonceStore, HermesAuthenticationError } = await import('@saasfly/hermes-core');
    const updateNonce = String(body.update_id);
    const verifiedSecret = incomingSecret || matchedCandidate?.secret || '';

    let boundActorSession;
    try {
      boundActorSession = await ActorIdentityBindingService.createBoundSessionAsync(
        {
          actorId: interlocutor.actorId,
          tenantId: canonicalOrgId,
          authProvider: 'TELEGRAM_WEBHOOK_SECRET',
          secretToken: verifiedSecret,
          proofSignature: verifiedSecret,
          issuedAt: Date.now(),
          nonce: updateNonce,
        },
        effectiveClearance,
        3600,
        {
          nonceStore: getActiveNonceStore(),
          channelVerification: matchedCandidate?.secret ? { telegramSecret: matchedCandidate.secret } : undefined,
        }
      );
    } catch (bindErr: unknown) {
      if (bindErr instanceof HermesAuthenticationError) {
        if (bindErr.authCode === 'REPLAY_DETECTED') {
          console.warn(`[Hermes Telegram Webhook] 🔁 Replay detected for update_id ${updateNonce}. Acknowledging to avoid Telegram retry loop.`);
          return NextResponse.json({ ok: true, note: 'Replay ignored' }, { status: 200 });
        }
        if (bindErr.authCode === 'PERSISTENCE_ERROR') {
          console.error(`[Hermes Telegram Webhook] 💥 Persistence failure during nonce consumption for update_id ${updateNonce}:`, bindErr.message);
          return NextResponse.json({ ok: false, error: 'Internal Server Error: Nonce persistence failed', code: bindErr.authCode }, { status: 500 });
        }
        if (bindErr.authCode === 'CONFIGURATION_ERROR') {
          console.error('[Hermes Telegram Webhook] ⚙️ Security configuration failure:', bindErr.message);
          return NextResponse.json({ ok: false, error: 'Configuration Error: Missing security credentials', code: bindErr.authCode }, { status: 500 });
        }
        console.error('[Hermes Telegram Webhook] Cryptographic binding error:', bindErr.message);
        return NextResponse.json({ ok: false, error: `Unauthorized: Session binding failed (${bindErr.authCode})`, code: bindErr.authCode }, { status: 401 });
      }

      const errMessage = (bindErr as any)?.message || 'Unknown error';
      console.error('[Hermes Telegram Webhook] Unexpected binding failure:', errMessage);
      return NextResponse.json({ ok: false, error: 'Internal Server Error: Unexpected authentication failure' }, { status: 500 });
    }

    const runtime = getDefaultRuntime();
    const runtimeResponse = await runtime.respond({
      organizationId: canonicalOrgId,
      conversationId: `conv_tg_${telegramId}_${canonicalOrgId}`,
      message: {
        id: `tg_msg_${message?.message_id || Date.now()}`,
        role: 'USER',
        content: rawText || 'Hola',
        createdAt: new Date(),
      },
      controlPlaneContext: {
        channel: 'TELEGRAM',
        actorId: interlocutor.actorId,
        organizationId: canonicalOrgId,
        role: effectiveRole,
        permissions: interlocutor.isBoss
          ? ['governance.admin', 'knowledge.read', 'runtime.respond', 'platform.decrees']
          : effectiveRole === 'OPERATOR' || effectiveRole === 'OWNER'
            ? ['knowledge.read', 'runtime.respond']
            : ['runtime.respond'],
        sessionId: boundActorSession.sessionToken,
        boundActorSession,
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
      const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
      inlineKeyboard.push([
        { text: '📜 Ver Evidencia Notarizada (IPFS)', url: `${ipfsGateway}${rawCid}` }
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
      // Balance check for legacy Markdown entities. Unbalanced entities (a stray `_`, `*`,
      // `[` or backtick from LLM output) make Telegram reject with HTTP 400
      // ("can't parse entities"; see incident 2026-10-13 20:05:42). Send plain instead.
      const canUseMarkdown = hasBalancedLegacyMarkdownEntities(replyContent);
      const payload: Record<string, any> = {
        chat_id: chatId,
        text: replyContent,
        ...(canUseMarkdown ? { parse_mode: 'Markdown' } : {}),
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
        const errorText = await sendRes.text().catch(() => '');
        console.error(`[Hermes Telegram Webhook] Failed to deliver Telegram message (HTTP ${sendRes.status}):`, errorText);
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

/**
 * Conservative sanity check for Telegram legacy Markdown entities.
 *
 * Returns false when the text contains an entity that cannot possibly balance
 * (odd number of `_`, `*`, `` ` ``, or `[` without a matching `](` link).
 * Such text is delivered as plain text instead of triggering Telegram HTTP 400.
 */
function hasBalancedLegacyMarkdownEntities(text: string): boolean {
  const countOf = (ch: string): number => (text.match(new RegExp(`\\${ch}`, 'g')) || []).length;
  if (countOf('_') % 2 !== 0) return false;
  if (countOf('*') % 2 !== 0) return false;
  if (countOf('`') % 2 !== 0) return false;
  const openBrackets = countOf('[');
  const closedLinks = (text.match(/\]\(/g) || []).length;
  if (openBrackets !== closedLinks) return false;
  return true;
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'Hermes Telegram Bot Webhook',
    timestamp: new Date().toISOString(),
  });
}
