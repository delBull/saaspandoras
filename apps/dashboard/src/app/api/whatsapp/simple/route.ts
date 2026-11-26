import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WhatsAppDispatcher } from '@/lib/whatsapp/dispatcher';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { verifyMetaSignature } from '@/lib/whatsapp/security';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // 1. Parse primero: necesitamos el phone_number_id para saber de qué APP es
    //    el mensaje (Hermes plataforma y cada tenant usan apps de Meta distintas).
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ status: 'bad_request', error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { resolveInboundIdentity, MissingTenantSecretError } = await import('@/lib/whatsapp/inbound-identity');

    let identity;
    try {
      identity = await resolveInboundIdentity(payload);
    } catch (err: any) {
      if (err instanceof MissingTenantSecretError) {
        console.error(`❌ [SIMPLE-WHATSAPP] ${err.message}. Fail-closed.`);
        return NextResponse.json({ status: 'error', error: 'Server configuration error: missing tenant secret' }, { status: 500 });
      }
      throw err;
    }

    // 2. Firma HMAC con el secreto de la app dueña del número.
    if (!identity.appSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ [SIMPLE-WHATSAPP] Sin app secret configurado (fail-closed).');
        return NextResponse.json({ status: 'error', error: 'Server configuration error: missing secret' }, { status: 500 });
      }
      console.warn('⚠️ [SIMPLE-WHATSAPP] Non-production environment missing app secret. Proceeding constrained.');
    } else {
      const signature = request.headers.get('x-hub-signature-256');
      if (!signature) {
        console.warn(`🔒 [SIMPLE-WHATSAPP] Cabecera X-Hub-Signature-256 ausente (tenant=${identity.tenantSlug ?? 'n/a'}, phoneId=${identity.phoneNumberId || 'n/a'}).`);
        return NextResponse.json({ status: 'unauthorized', error: 'Missing x-hub-signature-256 header' }, { status: 401 });
      }

      const isValid = verifyMetaSignature(rawBody, signature, identity.appSecret);
      if (!isValid) {
        console.warn(`🔒 [SIMPLE-WHATSAPP] Firma inválida (secreto ${identity.secretSource}, tenant=${identity.tenantSlug ?? 'n/a'}).`);
        return NextResponse.json({ status: 'unauthorized', error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const changeValue = payload.entry?.[0]?.changes?.[0]?.value;
    if (!changeValue) {
      return NextResponse.json({ status: 'ignored' });
    }

    // ⚡ FAST PATH: Si es solo un webhook de estado de entrega de Meta (sent/delivered/read), responder inmediatamente sin invocar el runtime
    if (!changeValue.messages || changeValue.messages.length === 0) {
      if (changeValue.statuses && changeValue.statuses.length > 0) {
        return NextResponse.json({ status: 'status_ack', handled: true });
      }
      return NextResponse.json({ status: 'no_messages', handled: false });
    }

    const result = await WhatsAppDispatcher.dispatch(payload, {
      rawBody,
      hubSignature: request.headers.get('x-hub-signature-256') || undefined,
      appSecret: identity.appSecret || undefined,
    });
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [SIMPLE-WHATSAPP] Error crítico en webhook:', error);

    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Endpoint para verificar estado del webhook y manejar verificación de Meta
export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  // Verificación de Meta/Facebook para WhatsApp Cloud API
  if (mode === 'subscribe' && token) {
    const verifyToken = (process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN || '').trim();

    if (!verifyToken) {
      console.error('❌ [SIMPLE-WHATSAPP] WHATSAPP_VERIFY_TOKEN no está configurado en las variables de entorno.');
      return NextResponse.json({ status: 'error', message: 'Server verify token unconfigured' }, { status: 500 });
    }

    if (token === verifyToken) {
      console.log('✅ [SIMPLE-WHATSAPP] Webhook verificado exitosamente por Meta');

      if (challenge) {
        return new Response(challenge, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }

      return NextResponse.json({
        status: 'verified',
        message: 'Webhook verified successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('❌ [SIMPLE-WHATSAPP] Intento de suscripción con token de verificación inválido');
      return NextResponse.json({
        status: 'error',
        message: 'Invalid verify token'
      }, { status: 403 });
    }
  }

  // Endpoint de estado para telemetría
  return NextResponse.json({
    status: 'active',
    system: 'hermes-whatsapp-dispatcher',
    version: '5.0',
    timestamp: new Date().toISOString()
  });
}
