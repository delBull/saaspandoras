/**
 * Webhook de Instagram (Meta) — ADR-020 §2.4-bis
 *
 *   GET  → verificación de la suscripción (`hub.challenge`)
 *   POST → comentarios y DMs; si traen la palabra clave, respuesta privada con
 *          el enlace de WhatsApp del tenant.
 *
 * Seguridad (modelo adversarial):
 *  - El tenant se resuelve por la **cuenta receptora** (`entry[0].id`), nunca por
 *    un campo del payload.
 *  - La firma se valida con el app secret **del tenant dueño de esa cuenta**.
 *    Si el tenant tiene app propia y falta su secreto → 500 fail-closed: jamás
 *    se acepta el secreto global de la plataforma como respaldo.
 *  - Siempre se responde 200 cuando el payload es de un tenant desconocido o no
 *    hay credenciales: Meta reintenta indefinidamente si ve un error, y un
 *    reintento no puede provocar un segundo DM (índice único en `social_dm_log`).
 */
import { NextResponse } from 'next/server';
import { verifyMetaSignature } from '@/lib/whatsapp/security';
import {
  handleInstagramEvent,
  parseInstagramWebhook,
  resolveInstagramIdentity,
  verifyInstagramChallenge,
} from '@/lib/social/instagram';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && verifyInstagramChallenge(token)) {
    return new NextResponse(challenge || '', { status: 200 });
  }

  console.warn('[Instagram Webhook] Verificación rechazada (mode=%s)', mode);
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const bodyText = await request.text();

  let body: any;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Instagram entrega `object: "instagram"`. Cualquier otra cosa se ignora con
  // 200 para no arrastrar reintentos de una suscripción mal configurada.
  if (body?.object && body.object !== 'instagram') {
    return NextResponse.json({ received: true, ignored: body.object });
  }

  const { igUserId, events } = parseInstagramWebhook(body);
  if (!igUserId || events.length === 0) {
    return NextResponse.json({ received: true, events: 0 });
  }

  const identity = await resolveInstagramIdentity(igUserId);
  if (!identity) {
    console.warn(`[Instagram Webhook] Cuenta ${igUserId} sin tenant asignado. Ignorado.`);
    return NextResponse.json({ received: true, tenant: null });
  }

  // ── Firma HMAC con el secreto de la app dueña de la cuenta ────────────────
  const signatureHeader = request.headers.get('x-hub-signature-256');
  if (!identity.appSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        `❌ [Instagram Webhook] Falta ${identity.secretSource} para ${identity.tenantSlug}. Fail-closed.`,
      );
      return NextResponse.json(
        { error: 'Server configuration error: missing tenant secret' },
        { status: 500 },
      );
    }
    console.warn(`⚠️ [Instagram Webhook] Sin ${identity.secretSource} fuera de producción.`);
  } else {
    if (!signatureHeader) {
      console.warn('[Instagram Webhook] Falta x-hub-signature-256.');
      return NextResponse.json({ error: 'Missing x-hub-signature-256 header' }, { status: 401 });
    }
    if (!verifyMetaSignature(bodyText, signatureHeader, identity.appSecret)) {
      console.warn(
        `🔒 [Instagram Webhook] Firma inválida (tenant=${identity.tenantSlug}, ig=${identity.igUserId}).`,
      );
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
    }
  }

  // ── Procesamiento ────────────────────────────────────────────────────────
  const results: Record<string, number> = {};
  for (const event of events) {
    const outcome = await handleInstagramEvent({ identity, event }).catch((err: any) => {
      console.warn(`[Instagram Webhook] Evento ${event.externalId} falló: ${err?.message || err}`);
      return 'FAILED' as const;
    });
    results[outcome] = (results[outcome] || 0) + 1;
  }

  return NextResponse.json({
    received: true,
    tenant: identity.tenantSlug,
    events: events.length,
    results,
  });
}
