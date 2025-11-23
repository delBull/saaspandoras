import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routeSimpleMessage } from '@/lib/whatsapp/core/simpleRouter';
import { sendWhatsAppMessage } from '@/lib/whatsapp/utils/client';

export async function POST(request: NextRequest) {
  try {
    console.log('📱 [SIMPLE-WHATSAPP] Webhook recibido');
    
    const payload = await request.json();
    console.log('📦 [SIMPLE-WHATSAPP] Payload completo:', JSON.stringify(payload, null, 2));

    // Verificar que es un mensaje de WhatsApp válido
    if (!payload.entry?.[0]?.changes) {
      console.log('ℹ️ [SIMPLE-WHATSAPP] Payload no es un mensaje de WhatsApp, ignorando');
      return NextResponse.json({ status: 'ignored' });
    }

    const changes = payload.entry[0].changes;
    const messages = changes[0]?.value?.messages;

    if (!messages || messages.length === 0) {
      console.log('ℹ️ [SIMPLE-WHATSAPP] No hay mensajes en el payload');
      return NextResponse.json({ status: 'no_messages' });
    }

    const message = messages[0];
    const phone = message.from;
    const messageId = message.id;

    console.log(`📞 [SIMPLE-WHATSAPP] Procesando mensaje de ${phone} (ID: ${messageId})`);

    // Preparar payload para el router simplificado
    const routerPayload = {
      from: phone,
      id: messageId,
      type: message.type || 'text',
      text: message.text ? { body: message.text.body } : undefined,
      contactName: message.contact?.name?.formatted_name || null,
      // Agregar información de landing si existe en el contexto
      flowFromLanding: request.headers.get('x-landing-flow') || null
    };

    // Procesar mensaje con el router simplificado
    const result = await routeSimpleMessage(routerPayload);

    console.log(`✅ [SIMPLE-WHATSAPP] Resultado del routing:`, result);

    // Enviar respuesta si existe
    if (result.response && result.handled) {
      console.log(`📤 [SIMPLE-WHATSAPP] Enviando respuesta a ${phone}`);
      
      const sendResult = await sendWhatsAppMessage(phone, result.response, messageId);
      
      if (!sendResult.success) {
        console.error('❌ [SIMPLE-WHATSAPP] Error enviando mensaje:', sendResult.error);
        return NextResponse.json({ 
          status: 'error', 
          error: sendResult.error,
          original_result: result 
        }, { status: 500 });
      }
      
      console.log('✅ [SIMPLE-WHATSAPP] Mensaje enviado exitosamente');
    }

    return NextResponse.json({
      status: 'success',
      result,
      message_id: messageId,
      phone_number: phone
    });

  } catch (error) {
    console.error('❌ [SIMPLE-WHATSAPP] Error crítico en webhook:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Endpoint para verificar estado del webhook
export function GET() {
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