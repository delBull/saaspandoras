// HIGH TICKET FLOW HANDLER
// Flujo premium para founders/inversores con capital

import { NextResponse } from 'next/server';
import type { WhatsAppSession } from '@/db/schema';
import { logMessage, updateSessionState } from '@/lib/whatsapp/multi-flow-db';

interface WhatsAppMessage {
  from: string;
  type: string;
  text?: { body: string };
  timestamp: string;
  id: string;
}

/**
 * Handle High Ticket Flow Messages - Premium flow for founders
 * 4-step optimized micro-flow: Premium + Selective Capital Filtering
 */
export async function handleHighTicketFlow(message: WhatsAppMessage, session: WhatsAppSession) {
  console.log(`💎 Processing high_ticket flow for session ${session.id} - Step ${session.currentStep}`);

  try {
    // Log incoming message
    const messageBody = message.text?.body || '';
    await logMessage(session.id, 'incoming', messageBody, message.type || 'text');

    const currentStep = session.currentStep || 0;

    // Step 1: Premium Welcome + Emotional/Global Objective
    if (currentStep === 0) {
      const firstName = messageBody?.split(' ')[0] || 'Founder';
      const responseMessage = `Hola ${firstName}, gracias por escribir.
Vi que vienes de la invitación Founders Select.
Antes de conectar contigo personalmente, quiero entender algo rápido:

¿Cuál es el objetivo principal que quieres lograr con tu comunidad o plataforma este trimestre?`;

      await logMessage(session.id, 'outgoing', responseMessage, 'text');
      await updateSessionState(session.id, { currentStep: 1 });

      return NextResponse.json({
        handled: true,
        response: responseMessage,
        flowType: 'high_ticket',
        currentStep: 1,
        action: 'wait_for_objective',
        premium: true
      });
    }

    // Step 2: Community Assessment (stylized, premium)
    if (currentStep === 1) {
      const responseMessage = `Perfecto, gracias.
Para ubicarte mejor dentro de nuestro programa, ¿cómo describirías hoy tu comunidad?

1️⃣ Activa (usuarios participando)
2️⃣ Comunidad real pero pequeña
3️⃣ Estoy en construcción
4️⃣ Aún no tengo comunidad`;

      await logMessage(session.id, 'outgoing', responseMessage, 'text');
      await updateSessionState(session.id, { currentStep: 2 });

      return NextResponse.json({
        handled: true,
        response: responseMessage,
        flowType: 'high_ticket',
        currentStep: 2,
        action: 'wait_for_community_status'
      });
    }

    // Step 3: CRITICAL CAPITAL VALIDATION - The Real Filter
    if (currentStep === 2) {
      const responseMessage = `Gracias por compartirlo.
Una última cosa antes de pasarte con un estratega:

¿Cuentas con capital disponible para activar tu protocolo y auditoría mínima?
(No pedimos montos.)`;

      await logMessage(session.id, 'outgoing', responseMessage, 'text');
      await updateSessionState(session.id, { currentStep: 3 });

      return NextResponse.json({
        handled: true,
        response: responseMessage,
        flowType: 'high_ticket',
        currentStep: 3,
        action: 'validate_capital',
        critical_filter: true
      });
    }

    // Step 4: Urgency Validation + Final Redirect to /apply
    if (currentStep === 3) {
      // Check if they have capital - if not, politely reject
      const hasCapital = messageBody.toLowerCase().includes('sí') ||
                        messageBody.toLowerCase().includes('tengo') ||
                        messageBody.toLowerCase().includes('disponible') ||
                        messageBody.toLowerCase().includes('capital') ||
                        messageBody.toLowerCase() === 'si';

      // Check if they want to understand requirements
      const wantUnderstanding = messageBody.toLowerCase().includes('entender') ||
                               messageBody.toLowerCase().includes('requerimientos');

      if (!hasCapital && !wantUnderstanding) {
        // No capital - polite rejection
        const rejectionMessage = `Gracias por tu transparencia.
En este momento el programa Founders Select solo trabaja con founders que ya cuentan con capital para desplegar el protocolo.
Puedes aplicar más adelante cuando estés listo.`;

        await logMessage(session.id, 'outgoing', rejectionMessage, 'text');
        await updateSessionState(session.id, { currentStep: 4, isActive: false });
        // Note: Additional status tracking can be added to session state if needed

        return NextResponse.json({
          handled: true,
          response: rejectionMessage,
          flowType: 'high_ticket',
          currentStep: 4,
          action: 'capital_rejection',
          rejected: true,
          reason: 'no_capital'
        });
      }

      // Has capital OR wants to understand requirements - proceed to /apply
      const finalMessage = `Perfecto.
Para darte una revisión completa de tu caso, necesito que completes tu aplicación:

👉 https://pandoras.finance/apply

El formulario tiene contexto, ejemplos y todo lo necesario.
Toma 5–10 minutos y es el filtro que usamos para founders que quieren construir algo serio.`;

      await logMessage(session.id, 'outgoing', finalMessage, 'text');
      await updateSessionState(session.id, { currentStep: 4, isActive: false });

      return NextResponse.json({
        handled: true,
        response: finalMessage,
        flowType: 'high_ticket',
        currentStep: 4,
        action: 'redirect_to_apply',
        completed: true,
        has_capital: hasCapital,
        wants_understanding: wantUnderstanding
      });
    }

    // Fallback for completed flows or errors
    const fallbackMessage = `¡Hola! Vi que vienes de nuestros Founders. ¿Ya completaste el formulario inicial o necesitas ayuda?`;

    await logMessage(session.id, 'outgoing', fallbackMessage, 'text');
    await updateSessionState(session.id, { currentStep: 0 }); // Restart possibility

    return NextResponse.json({
      handled: true,
      response: fallbackMessage,
      flowType: 'high_ticket',
      action: 'restart_flow',
      completed: false
    });

  } catch (error) {
    console.error('❌ High Ticket Flow Error:', error);

    const errorMessage = "Disculpa, hubo un error en el proceso premium. ¿Puedes intentarlo nuevamente o prefieres agendar una llamada?";
    await logMessage(session.id, 'outgoing', errorMessage, 'text');

    return NextResponse.json({
      error: 'Processing error',
      flowType: 'high_ticket'
    }, { status: 500 });
  }
}
