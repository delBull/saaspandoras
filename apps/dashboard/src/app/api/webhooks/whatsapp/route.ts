import { NextRequest, NextResponse } from 'next/server';
import { InterlocutorResolver } from '@saasfly/hermes-core';
import { getDefaultRuntime } from '@saasfly/hermes-core';
import { TenantAuthorityService } from '@saasfly/hermes-core';
import { sendWhatsAppMessageWithCredentials } from '@saasfly/shared';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 📲 WhatsApp Channel Mesh Webhook (Meta Cloud API)
 * Endpoint: /api/webhooks/whatsapp/route.ts
 *
 * Receives messages from WhatsApp Business API.
 * Authenticates the sender via phone number, applies the WHATSAPP clearance ceiling,
 * and passes it through the governed HermesRuntime.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.entry || !body.entry[0].changes[0].value.messages) {
      return NextResponse.json({ ok: true, note: 'Non-actionable or status update acknowledged' });
    }

    const changeValue = body.entry[0].changes[0].value;
    const message = changeValue.messages[0];
    const contact = changeValue.contacts?.[0];

    // Meta WhatsApp Cloud API format
    const waPhoneId = changeValue.metadata.phone_number_id; // Your tenant's phone number ID
    const fromPhone = message.from; // Sender's phone number
    const contactName = contact?.profile?.name || 'Usuario WhatsApp';
    const rawText = message.text?.body?.trim();
    const messageId = message.id;

    if (!rawText) {
      return NextResponse.json({ ok: true, note: 'Unsupported message type ignored' });
    }

    console.log(`[Hermes WhatsApp Webhook] 🟢 Message received from ${contactName} (${fromPhone}) → número ${waPhoneId}`);

    // 1. Resolve Interlocutor using the phone number
    const interlocutor = await InterlocutorResolver.resolve({
      channel: 'whatsapp',
      telegramId: fromPhone, // Fallback binding mechanism (treat phone as external ID)
      phone: fromPhone,
      nameHint: contactName,
    });

    // 2. Resolve Tenant Scope.
    //    Autoridad: el NÚMERO que recibió el mensaje (phone_number_id), no el remitente.
    //    Antes se resolvía sólo por el interlocutor y caía a 'pandoras', así que un
    //    prospecto escribiendo al número de S'Narai podía acabar en el Hermes equivocado.
    const { resolveTenantByPhoneNumberId, DatabaseSecretResolver, parseDmKeyword } = await import('@saasfly/hermes-core');
    const tenantByPhone = await resolveTenantByPhoneNumberId(waPhoneId).catch(() => null);
    let tenantSlug = tenantByPhone || interlocutor.tenantSlug || 'pandoras';
    console.log(`[Hermes WhatsApp Webhook] tenant=${tenantSlug} (por número: ${tenantByPhone ?? 'sin coincidencia'})`);

    const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantSlug);
    if (canonical) {
      tenantSlug = canonical.projectSlug;
    } else {
      tenantSlug = 'pandoras';
    }

    // 2.5 Palabra clave de campaña (ADR-020): el post pide escribir `SNARAI`
    //     (opcionalmente con el código del post). El DM queda atribuido al post.
    const keywordMatch = parseDmKeyword(rawText);
    if (keywordMatch.matched) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
        const res = await fetch(`${baseUrl}/api/v1/marketing/leads/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: baseUrl,
            'User-Agent': 'hermes-whatsapp-dm',
          },
          body: JSON.stringify({
            projectId: tenantSlug,
            name: contactName,
            phoneNumber: fromPhone,
            consent: false, // escribió él; no es opt-in de marketing
            source: 'whatsapp_dm',
            utm_source: keywordMatch.code ?? undefined,
            utm_medium: 'direct_message',
            metadata: {
              dmKeyword: keywordMatch.keyword,
              consentSource: 'inbound_whatsapp',
              attributionCode: keywordMatch.code ?? null,
            },
          }),
        });
        if (!res.ok) {
          console.warn('[Hermes WhatsApp Webhook] No se pudo registrar el lead del DM:', res.status);
        }
      } catch (err: any) {
        console.warn('[Hermes WhatsApp Webhook] Error registrando lead del DM:', err?.message || err);
      }
    }

    // 3. Dispatch to HermesRuntime with WHATSAPP Channel Context
    const { ActorIdentityBindingService } = await import('@saasfly/hermes-core');
    const clearanceLevel = interlocutor.isBoss
      ? 'CONFIDENTIAL'
      : (interlocutor.isCollaborator ? 'TENANT_RESTRICTED' : 'PUBLIC');
    const boundActorSession = ActorIdentityBindingService.createBoundSession(
      {
        actorId: interlocutor.actorId,
        tenantId: tenantSlug,
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: `wa_sig_${Date.now()}_${fromPhone}`,
        issuedAt: Date.now(),
        nonce: `wa_nonce_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      },
      clearanceLevel,
      3600
    );

    const runtime = getDefaultRuntime();
    const runtimeResponse = await runtime.respond({
      organizationId: tenantSlug,
      conversationId: `conv_wa_${fromPhone}_${tenantSlug}`,
      message: {
        id: `wa_msg_${messageId || Date.now()}`,
        role: 'USER',
        content: rawText,
        createdAt: new Date(),
      },
      controlPlaneContext: {
        channel: 'WHATSAPP', // 🛑 ADVERSARIAL GATE: Enforces WHATSAPP Clearance Ceiling
        actorId: interlocutor.actorId,
        organizationId: tenantSlug,
        role: interlocutor.isBoss ? 'OWNER' : (interlocutor.isCollaborator ? 'OPERATOR' : 'VIEWER'),
        permissions: interlocutor.isBoss
          ? ['governance.admin', 'knowledge.read', 'runtime.respond', 'platform.decrees']
          : ['runtime.respond'],
        sessionId: `wa_sess_${fromPhone}`,
        interlocutor,
        canonicalIdentity: interlocutor.canonicalIdentity,
        tenantContext: interlocutor.tenantContext,
        boundActorSession,
      } as any,
    });

    const replyContent = runtimeResponse.content || 'Entendido, procesando tu solicitud...';

    // 4. Responder DESDE el número del tenant, con su token.
    //    Antes se llamaba `sendWhatsAppMessage(from, text, waPhoneId)`: el tercer
    //    argumento es `replyToMessageId`, así que se enviaba con el número maestro y
    //    un contexto inválido -> Meta devolvía 400 y el usuario no recibía nada.
    try {
      const resolved = await new DatabaseSecretResolver().resolve(`vault:channel:${tenantSlug}`);
      const [tenantToken, tenantPhoneId] = String(resolved || '').split('|');

      const sent = await sendWhatsAppMessageWithCredentials({
        to: fromPhone,
        text: replyContent,
        phoneNumberId: tenantPhoneId || waPhoneId,
        accessToken: tenantToken || '',
        replyToMessageId: messageId,
      });

      if (!sent.success) {
        console.error('[Hermes WhatsApp Webhook] Meta rechazó la respuesta:', sent.error);
      }
    } catch (sendErr: any) {
      console.error('[Hermes WhatsApp Webhook] Failed to send reply to WhatsApp:', sendErr?.message || sendErr);
    }

    return NextResponse.json({ ok: true, processed: true });

  } catch (error: any) {
    console.error('[Hermes WhatsApp Webhook] Unhandled error:', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Internal error' });
  }
}

/**
 * Handle WhatsApp Webhook Verification (Meta requires GET challenge)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  // Meta se configura con UN token; en el proyecto conviven dos nombres. Antes
  // sólo se comparaba con `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (no configurado), así
  // que la verificación devolvía 403 y el webhook nunca quedaba suscrito: los
  // mensajes entrantes no llegaban.
  const EXPECTED_TOKEN =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
    process.env.WHATSAPP_VERIFY_TOKEN ||
    '';

  if (mode === 'subscribe' && EXPECTED_TOKEN && token === EXPECTED_TOKEN) {
    console.log('[Hermes WhatsApp Webhook] Verification successful.');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 });
}
