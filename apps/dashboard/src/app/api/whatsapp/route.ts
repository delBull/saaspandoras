import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WHATSAPP, validateWhatsAppConfig } from '@/lib/whatsapp/config';
import { routeMessage } from '@/lib/whatsapp/router';

// GET - Webhook Verification Endpoint
export function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`🔐 [${timestamp}] WhatsApp webhook verification attempt`);

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
    console.warn('🚫 Invalid webhook verification attempt', {
      mode,
      token,
      expectedToken: WHATSAPP.VERIFY_TOKEN
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  console.log('✅ WhatsApp webhook verified successfully');
  return new Response(challenge, { status: 200 });
}

// POST - Message Handling Endpoint
export async function POST(request: NextRequest) {
  console.log('📱 WhatsApp incoming message webhook');

  try {
    const body = await request.json();

    // Log de estructura básica para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('📨 Raw webhook payload:', JSON.stringify(body, null, 2));
    }

    // Validar estructura básica
    if (!body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      console.log('ℹ️ No message found in payload (likely status update)');
      return NextResponse.json({ received: true });
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const contact = body.entry[0].changes[0].value.contacts?.[0];

    console.log('📨 Message received:', {
      from: message.from,
      type: message.type,
      hasContact: !!contact,
      body: message.text?.body?.substring(0, 50) + '...'
    });

    // PROCESAR CON EL NUEVO SISTEMA UNIFICADO
    const flowResult = await routeMessage({
      from: message.from,
      type: message.type,
      text: message.text,
      timestamp: message.timestamp,
      id: message.id,
    });

    console.log('🤖 Resultado del procesamiento multi-flow:', flowResult);

    // Si hay respuesta automática para enviar, hacerlo ahora
    if (flowResult.response && !flowResult.error) {
      const { sendWhatsAppMessage } = await import('@/lib/whatsapp/client');

      // Enviar la respuesta por WhatsApp
      const sendResult = await sendWhatsAppMessage(
        message.from,  // número destino
        flowResult.response,  // texto de respuesta
        message.id  // responder al mensaje original
      );

      if (!sendResult.success) {
        console.error('❌ Error enviando respuesta automática:', sendResult.error);
      } else {
        console.log('✅ Respuesta automática enviada:', sendResult.messageId);
      }
    }

    // Responder con el resultado del procesamiento
    return NextResponse.json({
      received: true,
      processed: true,
      handled: flowResult.handled,
      sentResponse: !!flowResult.response,
      flowResult: {
        flowType: flowResult.flowType,
        action: flowResult.action,
        progress: flowResult.progress,
        status: flowResult.status,
        isCompleted: flowResult.isCompleted,
        projectCreated: flowResult.projectCreated,
        error: flowResult.error,
        response: flowResult.response?.substring(0, 100) + '...' // Truncar para logs
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
