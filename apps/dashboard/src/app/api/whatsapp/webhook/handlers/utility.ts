// UTILITY PROTOCOL FLOW HANDLER
// Flujo especializado para consultas sobre protocolos de utilidad W2E

import { NextResponse } from 'next/server';
import type { WhatsAppSession } from '@/db/schema';
import { logMessage, updateSessionState, switchSessionFlow } from '@/lib/whatsapp/multi-flow-db';

interface WhatsAppMessage {
  from: string;
  type: string;
  text?: { body: string };
  timestamp: string;
  id: string;
}

/**
 * Handle Utility Protocol Flow - Specialized flow for W2E utility protocol consultations
 */
export async function handleUtilityFlow(message: WhatsAppMessage, session: WhatsAppSession) {
  console.log(`🔧 Processing utility flow for session ${session.id} - Step ${session.currentStep}`);

  try {
    // Log incoming message
    const messageBody = message.text?.body || '';
    await logMessage(session.id, 'incoming', messageBody, message.type || 'text');

    const currentStep = session.currentStep || 0;

    // Step 0: Initial welcome and understanding check (if new session)
    if (currentStep === 0) {
      const responseMessage = `¡Hola! Veo que te interesa crear un Protocolo de Utilidad Funcional con arquitectura Work-to-Earn (W2E) verificable.

Antes de continuar, quiero asegurarme de que entiendo correctamente tu proyecto. ¿Podrías explicarme brevemente qué acción verificable realizarián los usuarios en tu protocolo?

(Ejemplo: "Un usuario completa misiones diarias verificables y gana recompensas proporcionales")`;

      await logMessage(session.id, 'outgoing', responseMessage, 'text');
      await updateSessionState(session.id, { currentStep: 1 });

      return NextResponse.json({
        handled: true,
        response: responseMessage,
        flowType: 'utility',
        currentStep: 1,
        action: 'initial_understanding',
        focus: 'W2E verification'
      });
    }

    // Step 1: Deep dive into Work-to-Earn mechanics
    if (currentStep === 1) {
      const responseMessage = `Excelente inicio. Los Protocolos de Utilidad exitosos tienen mecánicas Work-to-Earn claras.

Te voy a hacer unas preguntas específicas para mapear tu arquitectura:

¿Tienes definido cómo se conectará tu Labor (acción del usuario) con el Loom Protocol (motor W2E de Pandora's)?

Si no estás seguro, puedo enviarte documentación técnica del Loom Protocol. ¿Te intereresa?

Responde Sí/No o explica tu arquitectura actual.`;

      await logMessage(session.id, 'outgoing', responseMessage, 'text');
      await updateSessionState(session.id, { currentStep: 2 });

      return NextResponse.json({
        handled: true,
        response: responseMessage,
        flowType: 'utility',
        currentStep: 2,
        action: 'loom_protocol_mapping',
        technical_focus: 'W2E mechanics'
      });
    }

    // Step 2: Dual-Treasury consideration
    if (currentStep === 2) {
      const hasDocumentRequest = messageBody.toLowerCase().includes('sí') ||
                                messageBody.toLowerCase().includes('si') ||
                                messageBody.toLowerCase().includes('envia') ||
                                messageBody.toLowerCase().includes('documentación');

      if (hasDocumentRequest) {
        // Send documentation request
        const docMessage = `Te envío información técnica del Loom Protocol:

📄 Documentación Técnica: https://pandoras.finance/docs/loom-protocol
🎯 Guía de Arquitectura W2E: https://pandoras.finance/docs/w2e-guide
🏗️ Casos de Estudio: https://pandoras.finance/case-studies

¿Has revisado estos recursos?`;

        await logMessage(session.id, 'outgoing', docMessage, 'text');
        await updateSessionState(session.id, { currentStep: 3 });

        return NextResponse.json({
          handled: true,
          response: docMessage,
          flowType: 'utility',
          currentStep: 3,
          action: 'documentation_sent',
          resources_provided: true
        });
      }

      // Continue with architecture questions
      const responseMessage = `Perfecto, tienes una arquitectura clara. Los protocolos exitosos suelen implementar Dual-Treasury para separación de riesgos:

1️⃣ Treasury Operativa → Para pagos de recompensas W2E
2️⃣ Treasury Estratégica → Para desarrollo y crecimiento

¿Tu protocolo considera esta separación? ¿O prefieres arquitectura más simple?

También, ¿has considerado métricas de engagement verificables para tus usuarios?`;

      await logMessage(session.id, 'outgoing', responseMessage, 'text');
      await updateSessionState(session.id, { currentStep: 3 });

      return NextResponse.json({
        handled: true,
        response: responseMessage,
        flowType: 'utility',
        currentStep: 3,
        action: 'dual_treasury_analysis',
        architecture_assessment: true
      });
    }

    // Step 3: Final recommendation and next steps
    if (currentStep === 3) {
      const responseMessage = `Excelente progreso en tu Arquitectura de Utilidad.

Para llevar tu protocolo a Pandora's, necesitarás pasar nuestro Filtro de Viabilidad de 8 Preguntas que valida la estructura técnica y operativa.

¿Quieres que te guíe por esas 8 preguntas ahora, o prefieres una llamada consultiva gratuita para afinar tu arquitectura primero?

El siguiente paso sería:
🔍 Filtro 8Q → Viabilidad Validada
🏗️ Arquitectura SC → Protocolo Loom-Ready
🚀 Deployment → Modular Factory

¿Cuál prefieres?`;

      await logMessage(session.id, 'outgoing', responseMessage, 'text');
      await updateSessionState(session.id, { currentStep: 4 });

      return NextResponse.json({
        handled: true,
        response: responseMessage,
        flowType: 'utility',
        currentStep: 4,
        action: 'final_recommendation',
        next_steps_presented: true
      });
    }

    // Step 4+: Advanced consultation or transition to sales
    if (currentStep === 4) {
      const wantsEightQ = messageBody.toLowerCase().includes('8') ||
                         messageBody.toLowerCase().includes('preguntas') ||
                         messageBody.toLowerCase().includes('filtro');

      const wantsCall = messageBody.toLowerCase().includes('llamada') ||
                       messageBody.toLowerCase().includes('consultiva') ||
                       messageBody.toLowerCase().includes('llamar');

      if (wantsEightQ) {
        const responseMessage = `¡Excelente elección! El Filtro de 8 Preguntas es el camino estándar.

Empieceremos con la validación técnica. Primera pregunta:

¿Cuál es la acción verificable que realiza el usuario dentro de tu Creación? (Ejemplo: "Subir contenido verificado", "Completar tarea medible", "Votar en decisiones")

Tu respuesta: "${messageBody.substring(0, 100)}..."`;

        // Transition to eight_q flow (we'll add the answer to the state)
        await switchSessionFlow(session.id, 'eight_q');
        // Could copy conversation context here if needed

        await logMessage(session.id, 'outgoing', responseMessage, 'text');

        return NextResponse.json({
          handled: true,
          response: responseMessage,
          flowType: 'eight_q', // Changed!
          transition_from: 'utility',
          action: 'start_eight_q_filter',
          verification_started: true
        });
      }

      if (wantsCall) {
        const consultationMessage = `Agenda tu llamada consultiva gratuita aquí:

👉 [Calendly Link - Próximamente]

Duración: 45 minutos
¿Qué veremos?
• Análisis de tu arquitectura W2E
• Recomendaciones para Loom Protocol integration
• Roadmap para Pandora's deployment
• Preguntas sobre Dual-Treasury

¿Te gustaría que te envíe un recordatorio por email?`;

        await logMessage(session.id, 'outgoing', consultationMessage, 'text');
        await updateSessionState(session.id, { currentStep: 5 });

        return NextResponse.json({
          handled: true,
          response: consultationMessage,
          flowType: 'utility',
          currentStep: 5,
          action: 'consultation_scheduled',
          consultation_type: 'architectural_review'
        });
      }
    }

    // Fallback response for extended conversation
    const fallbackMessage = `¡Genial proyecto de Protocolo de Utilidad!

¿Te gustaría que profundicemos en algún aspecto específico?
• Arquitectura W2E avanzada
• Dual-Treasury models
• Integration con Loom Protocol
• Fuzz Testing strategies

O podemos volver al principio y mapear nuevamente tu protocolo.

¿Qué te interesa explorar?`;

    await logMessage(session.id, 'outgoing', fallbackMessage, 'text');
    await updateSessionState(session.id, { currentStep: 0 }); // Reset for restart

    return NextResponse.json({
      handled: true,
      response: fallbackMessage,
      flowType: 'utility',
      action: 'conversation_restart',
      flexible_exploration: true
    });

  } catch (error) {
    console.error('❌ Utility Flow Error:', error);

    const errorMessage = "Disculpa, hubo un error en la consulta técnica. ¿Podrías intentar nuevamente o prefieres información general sobre Protocolos de Utilidad?";
    await logMessage(session.id, 'outgoing', errorMessage, 'text');

    return NextResponse.json({
      error: 'Utility flow processing error',
      flowType: 'utility'
    }, { status: 500 });
  }
}
