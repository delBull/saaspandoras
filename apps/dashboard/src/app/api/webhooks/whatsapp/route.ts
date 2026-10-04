import { NextRequest, NextResponse } from 'next/server';
import { InterlocutorResolver } from '@saasfly/hermes-core';
import { getDefaultRuntime } from '@saasfly/hermes-core';
import { TenantAuthorityService } from '@saasfly/hermes-core';
import { sendWhatsAppMessage } from '@saasfly/shared'; // Must be implemented in your WA utils

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

    console.log(`[Hermes WhatsApp Webhook] 🟢 Message received from ${contactName} (${fromPhone})`);

    // 1. Resolve Interlocutor using the phone number
    const interlocutor = await InterlocutorResolver.resolve({
      channel: 'whatsapp',
      telegramId: fromPhone, // Fallback binding mechanism (treat phone as external ID)
      phone: fromPhone,
      nameHint: contactName,
    });

    // 2. Resolve Tenant Scope (Defaults to pandoras if not bound explicitly)
    let tenantSlug = interlocutor.tenantSlug || 'pandoras';

    const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantSlug);
    if (canonical) {
      tenantSlug = canonical.projectSlug;
    } else {
      tenantSlug = 'pandoras';
    }

    // 3. Dispatch to HermesRuntime with WHATSAPP Channel Context
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
      } as any,
    });

    const replyContent = runtimeResponse.content || 'Entendido, procesando tu solicitud...';

    // 4. Send Response back via Meta WhatsApp API
    try {
      await sendWhatsAppMessage(fromPhone, replyContent, waPhoneId);
    } catch (sendErr) {
      console.error('[Hermes WhatsApp Webhook] Failed to send reply to WhatsApp:', sendErr);
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

  const EXPECTED_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === EXPECTED_TOKEN) {
    console.log('[Hermes WhatsApp Webhook] Verification successful.');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 });
}
