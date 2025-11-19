// SUPPORT FLOW HANDLER
// Gestiona escalación a soporte humano

import { NextResponse } from 'next/server';
import type { WhatsAppSession } from '@/db/schema';
import { logMessage, switchSessionFlow } from '@/lib/whatsapp/multi-flow-db';

interface WhatsAppMessage {
  from: string;
  type: string;
  text?: { body: string };
  timestamp: string;
  id: string;
}

/**
 * Handle Support Flow Messages - Escalation to human support
 */
export async function handleSupportFlow(message: WhatsAppMessage, session: WhatsAppSession) {
  console.log(`🆘 Processing support flow for session ${session.id}`);

  try {
    // Log incoming message
    const messageBody = message.text?.body || '';
    await logMessage(session.id, 'incoming', messageBody, message.type || 'text');

    const userResponse = messageBody.toLowerCase();

    if (userResponse.includes('hablar con humano') || userResponse.includes('humano')) {
      // Escalate to human agent
      await switchSessionFlow(session.id, 'human');

      const responseMessage = `Te estoy conectando con un agente humano.
El tiempo de espera aproximado es de 2-5 minutos.

Por favor, mantente en línea.`;

      await logMessage(session.id, 'outgoing', responseMessage, 'text');

      return NextResponse.json({
        handled: true,
        response: responseMessage,
        flowType: 'human', // Will be switched to human immediately after
        action: 'escalated_to_human'
      });
    }

    // Triage - determine if needs human help
    const responseMessage = `Voy a ayudarte con eso.

¿Puedes describir brevemente el problema específico?
O si prefieres hablar directamente con un agente humano,
responde "HABLAR CON HUMANO".`;

    await logMessage(session.id, 'outgoing', responseMessage, 'text');

    return NextResponse.json({
      handled: true,
      response: responseMessage,
      flowType: 'support',
      action: 'awaiting_details'
    });

  } catch (error) {
    console.error('❌ Support Flow Error:', error);

    const errorMessage = "Disculpa, hubo un error conectándote con soporte. ¿Puedes intentarlo nuevamente?";
    await logMessage(session.id, 'outgoing', errorMessage, 'text');

    return NextResponse.json({
      error: 'Processing error',
      flowType: 'support'
    }, { status: 500 });
  }
}
