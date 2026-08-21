import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WhatsAppDispatcher } from '@/lib/whatsapp/dispatcher';

export async function POST(request: NextRequest) {
  try {
    console.log('📱 [SIMPLE-WHATSAPP] Webhook recibido');

    const payload = await request.json();

    // Verificar que es un mensaje de WhatsApp válido
    if (!payload.entry?.[0]?.changes) {
      console.log('ℹ️ [SIMPLE-WHATSAPP] Payload no es un mensaje de WhatsApp, ignorando');
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

  console.log('🔍 [SIMPLE-WHATSAPP] GET Request:', {
    mode,
    token: token ? '***' + token.slice(-4) : null,
    challenge: challenge ? challenge.substring(0, 10) + '...' : null,
    expectedToken: 'pandoras_whatsapp_verify_2025'
  });

  // Verificación de Meta/Facebook para WhatsApp Cloud API
  if (mode === 'subscribe' && token) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'pandoras_whatsapp_verify_2025';

    console.log('🔑 [SIMPLE-WHATSAPP] Verificando token:', { received: token ? '***' + token.slice(-4) : null, expected: verifyToken });

    if (token === verifyToken) {
      console.log('✅ [SIMPLE-WHATSAPP] Webhook verificado exitosamente por Meta');

      if (challenge) {
        // Meta envía el challenge para verificar que somos un endpoint válido
        console.log('🎯 [SIMPLE-WHATSAPP] Retornando challenge:', challenge);
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
      console.log('❌ [SIMPLE-WHATSAPP] Token de verificación inválido');
      return NextResponse.json({
        status: 'error',
        message: 'Invalid verify token'
      }, { status: 403 });
    }
  }

  // Endpoint de estado para debugging (no verificación de Meta)
  return NextResponse.json({
    status: 'active',
    system: 'simple-whatsapp-router',
    version: '4.0',
    timestamp: new Date().toISOString(),
    flows: [
      'utility',
      'high_ticket',
      'eight_q',
      'support',
      'human'
    ]
  });
}
