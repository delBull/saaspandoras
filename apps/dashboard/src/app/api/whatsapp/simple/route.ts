import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WhatsAppDispatcher } from '@/lib/whatsapp/dispatcher';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Validates Meta X-Hub-Signature-256 if META_APP_SECRET or WHATSAPP_APP_SECRET is configured.
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }
  const signature = signatureHeader.substring(7);
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const appSecret = (process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET || '').trim();

    // 1. Cyber Security: Verify HMAC signature (Strict Fail-Closed)
    if (!appSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ [SIMPLE-WHATSAPP] WHATSAPP_APP_SECRET missing in production.');
        return NextResponse.json(
          { status: 'error', error: 'Server configuration error: WHATSAPP_APP_SECRET missing' },
          { status: 500 }
        );
      }
      console.warn('⚠️ [SIMPLE-WHATSAPP] Non-production environment missing WHATSAPP_APP_SECRET. Proceeding constrained.');
    } else {
      const signature = request.headers.get('x-hub-signature-256');
      if (!signature) {
        console.warn('🔒 [SIMPLE-WHATSAPP] Cabecera X-Hub-Signature-256 ausente.');
        return NextResponse.json({ status: 'unauthorized', error: 'Missing x-hub-signature-256 header' }, { status: 401 });
      }

      const isValid = verifyMetaSignature(rawBody, signature, appSecret);
      if (!isValid) {
        console.warn('🔒 [SIMPLE-WHATSAPP] Firma X-Hub-Signature-256 inválida o payload alterado.');
        return NextResponse.json({ status: 'unauthorized', error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ status: 'bad_request', error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Verificar que es un mensaje de WhatsApp válido
    if (!payload.entry?.[0]?.changes) {
      return NextResponse.json({ status: 'ignored' });
    }

    const result = await WhatsAppDispatcher.dispatch(payload);
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
