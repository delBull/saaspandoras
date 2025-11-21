import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WHATSAPP, validateWhatsAppConfig } from '@/lib/whatsapp/config';
import { processPreapplyMessage } from '@/lib/whatsapp/preapply-flow';

// GET - Dedicated Pre-Apply Webhook Verification
export function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`🔐 [${timestamp}] WhatsApp PRE-APPLY webhook verification attempt`);

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verificar configuración
  if (!validateWhatsAppConfig()) {
    console.error('❌ WhatsApp config validation failed');
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  // Verificar que sea una solicitud legítima de WhatsApp
  if (mode !== 'subscribe' || token !== WHATSAPP.VERIFY_TOKEN) {
    console.warn('🚫 Invalid pre-apply webhook verification attempt', {
      mode,
      token,
      expectedToken: WHATSAPP.VERIFY_TOKEN
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  console.log('✅ WhatsApp pre-apply webhook verified successfully');
  return new Response(challenge, { status: 200 });
}

// POST - Pre-Apply Flow Message Handling
export async function POST(request: NextRequest) {
  console.log('📱 WhatsApp PRE-APPLY flow incoming message webhook');

  try {
    const body = await request.json();

    // Log de estructura básica para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('📨 Pre-Apply Raw webhook payload:', JSON.stringify(body, null, 2));
    }

    // Validar estructura básica
    if (!body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      console.log('ℹ️ No message found in pre-apply payload (likely status update)');
      return NextResponse.json({ received: true });
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const contact = body.entry[0].changes[0].value.contacts?.[0];

    console.log('📨 Pre-Apply Message received:', {
      from: message.from,
      type: message.type,
      hasContact: !!contact,
      body: message.text?.body?.substring(0, 50) + '...'
    });

    // 🚨 TEMPORAL FIX: Redirigir el mensaje al sistema MULTI-FLOW principal
    // Para evitar conflictos entre PRE-APPLY y MULTI-FLOW
    console.log('🔄 Redirigiendo mensaje PRE-APPLY al sistema MULTI-FLOW principal');

    try {
      // Importar la función del sistema multi-flow
      const { processMultiFlowMessage } = await import('@/lib/whatsapp/preapply-flow');

      // Procesar usando el sistema MULTI-FLOW
      const result = await processMultiFlowMessage({
        from: message.from,
        type: message.type,
        text: message.text,
        timestamp: message.timestamp,
        id: message.id,
      });

      console.log('🤖 Multi-flow result (desde preapply):', result);

      // Los handlers del multi-flow ya envían las respuestas automáticamente
      // Solo necesitamos confirmar recepción
      return NextResponse.json({
        received: true,
        processed: true,
        redirected_to_multi_flow: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error redirigiendo a multi-flow:', error);

      return NextResponse.json({
        error: 'Error interno procesando mensaje (high_ticket)',
        nextMessage: 'Hubo un error procesando tu mensaje. Inténtalo nuevamente por favor.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ WhatsApp pre-apply webhook error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        flowType: 'preapply',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
