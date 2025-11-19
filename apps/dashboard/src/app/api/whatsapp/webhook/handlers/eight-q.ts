// EIGHT QUESTIONS FLOW HANDLER
// Maneja el flujo de 8 preguntas (filtrado) integrandolo con multi-flow

import { NextResponse } from 'next/server';
import type { WhatsAppSession } from '@/db/schema';
import { logMessage, updateSessionState } from '@/lib/whatsapp/multi-flow-db';

// Import existing flow logic (adapt to work with multi-flow)
interface WhatsAppMessage {
  from: string;
  type: string;
  text?: { body: string };
  timestamp: string;
  id: string;
}

// Questions for the 8-filter flow
const EIGHT_QUESTIONS = [
  "¡Gracias por tu interés en lanzar tu Protocolo de Utilidad dentro de Pandora's! Antes de avanzar, necesitamos validar algunos puntos clave. ¿Cuál es la acción verificable que realiza el usuario dentro de tu Creación? (Lo que podemos medir, validar y recompensar). Explica brevemente cómo funciona.",
  "Explica cómo interactúa un usuario final con tu Protocolo paso a paso. Incluye: qué hace, qué recibe, y cómo se activa cada utilidad.",
  "¿Quién administrará tu Protocolo dentro de Pandora? Indica: Nombre, Correo oficial, Rol (fundador/operador/CM)",
  "¿En qué etapa está actualmente tu Protocolo? (Idea/MVP/Operación/Comunidad activa/Primeras ventas)",
  "¿Cuál es tu objetivo al lanzar tu Protocolo dentro de Pandora's? (Accesos, misiones, recompensas, comunidad, etc.)",
  "¿Con cuántas personas cuenta tu proyecto actualmente? (Solo yo/2-4 personas/5+)",
  "¿Tu proyecto ya cuenta con comunidad o audiencia? Elige todas las que apliquen: (Sin audiencia/<50/50-200/200-1000/1000+/Comunidad activa/Compradora/Privada)",
  "¿Cuál es tu fecha estimada para lanzar la primera versión de tu Protocolo?"
];

/**
 * Handle Eight Questions Flow Messages
 */
export async function handleEightQuestionsFlow(message: WhatsAppMessage, session: WhatsAppSession) {
  console.log(`🔢 Processing eight_q flow for session ${session.id} - Step ${session.currentStep}`);

  try {
    // Log incoming message
    const messageBody = message.text?.body || '';
    await logMessage(session.id, 'incoming', messageBody, message.type || 'text');

    const userResponse = message.text?.body?.trim() || '';
    const currentStep = session.currentStep || 0;

    // Check for INFO triggers first
    const infoResponse = handleInfoTriggers(userResponse);
    if (infoResponse) {
      await logMessage(session.id, 'outgoing', infoResponse, 'text');
      return NextResponse.json({
        handled: true,
        response: infoResponse,
        flowType: 'eight_q'
      });
    }

    // Handle user responses to questions
    if (userResponse && currentStep < EIGHT_QUESTIONS.length) {
      // This would integrate with existing whatsapp_preapply_leads logic
      // Save response to answers JSONB or specific fields

      const nextStep = currentStep + 1;

      // Update session state
      await updateSessionState(session.id, { currentStep: nextStep });

      if (nextStep < EIGHT_QUESTIONS.length) {
        // Send next question
        const nextQuestion = EIGHT_QUESTIONS[nextStep] || "Error: Question not found";
        await logMessage(session.id, 'outgoing', nextQuestion, 'text');

        return NextResponse.json({
          handled: true,
          nextQuestion,
          flowType: 'eight_q',
          progress: `${nextStep + 1}/${EIGHT_QUESTIONS.length}`
        });
      } else {
        // Flow completed - direct to Apply
        const completionMessage = getCompletionMessage();
        await logMessage(session.id, 'outgoing', completionMessage, 'text');

        return NextResponse.json({
          handled: true,
          completed: true,
          nextQuestion: completionMessage,
          flowType: 'eight_q',
          action: 'redirect_to_apply'
        });
      }
    }

    // First interaction or restart
    if (currentStep === 0) {
      const firstQuestion = EIGHT_QUESTIONS[0] || "Welcome! Let's get started.";
      await logMessage(session.id, 'outgoing', firstQuestion, 'text');

      return NextResponse.json({
        handled: true,
        nextQuestion: firstQuestion,
        flowType: 'eight_q',
        progress: `1/${EIGHT_QUESTIONS.length}`
      });
    }

    // Default fallback
    const fallbackMessage = "Hola! Estamos validando tu protocolo. Te haré algunas preguntas rápidas para confirmar viabilidad.";
    await logMessage(session.id, 'outgoing', fallbackMessage, 'text');

    return NextResponse.json({
      handled: true,
      response: fallbackMessage,
      flowType: 'eight_q'
    });

  } catch (error) {
    console.error('❌ Eight Questions Flow Error:', error);

    const errorMessage = "Disculpa, hubo un error procesando tu respuesta. ¿Puedes intentarlo nuevamente?";
    await logMessage(session.id, 'outgoing', errorMessage, 'text');

    return NextResponse.json({
      error: 'Processing error',
      flowType: 'eight_q'
    }, { status: 500 });
  }
}

/**
 * Handle INFO triggers for eight questions flow
 */
function handleInfoTriggers(message: string): string | null {
  const upperMessage = message.toUpperCase();

  if (upperMessage.includes('INFO_MECANISMO')) {
    return `🔍 Mecanismos Verificables en Pandora's:

Ejemplos válidos:
✅ Moderación verificable de contenido con timestamps
✅ Tareas con outputs cuantificables
✅ Participación en flujos o decisiones que pueden ser loggeadas
✅ Contenido curado con métricas medibles

📄 PDF completo: pndrs.link/mechanic-guide
🖼️ Infografía: pndrs.link/mechanic-infographic

¿Esto aclara tu idea?`;
  }

  if (upperMessage.includes('INFO_FLUJO')) {
    return `🌊 Flujos Utilitarios Ejemplos:

Flujo Básico:
👤 Usuario llega → 🔓 Activa acceso → 🎯 Completa misiones → 🎁 Gana recompensas → 🎮 Participa en dinámicas

Ejemplo Real:
1️⃣ Compra acceso VIP → 2️⃣ Completa evaluación semanal → 3️⃣ Recibe NFT exclusivo → 4️⃣ Desbloquea beneficios premium

📄 Guía completa: pndrs.link/flow-guide
🖼️ Plantilla visual: pndrs.link/flow-canvas

¿Te ayuda a definir tu flujo?`;
  }

  if (upperMessage.includes('INFO_ROLES')) {
    return `👥 Roles en Pandora's:

🧑‍💼 Administrador → Gestiona beneficios y aprobaciones
🛠️ Operador → Ejecuta tareas diarias del protocolo
📢 CM → Maneja comunidad y comunicaciones

📋 Checklist completo: pndrs.link/operator-checklist
📊 Tabla de roles: pndrs.link/roles-table`;
  }

  if (upperMessage.includes('INFO_ESTADO')) {
    return `📊 Etapas del Proyecto:
1️⃣ Idea → Solo concepto, necesita validación
2️⃣ MVP → Versión mínima funcional lista
3️⃣ En operación → Ya corriendo con usuarios reales
4️⃣ Comunidad activa → Base sólida de usuarios
5️⃣ Primeras ventas → Generando ingresos

📈 Roadmap visual: pndrs.link/project-stages
📄 Guía completa: pndrs.link/idea-to-mvp`;
  }

  if (upperMessage.includes('INFO_OBJETIVO')) {
    return `🎯 Objetivos Válidos en Pandora's:
✅ Crear evaluadores verificados de contenido
✅ Sistema de micro-tasks con recompensas
✅ Comunidad curada de creadores premium
✅ Marketplace de servicios verificables
✅ Red social con utility integrada

📊 Mapa de objetivos: pndrs.link/objectives-map
💡 Guía de definición: pndrs.link/define-goals`;
  }

  if (upperMessage.includes('INFO_EQUIPO')) {
    return `👨‍💻 Estructuras de Equipo:
🤠 Solo yo: Low throughput, proyectos pequeños
👥 2-4 personas: Viable, buen equilibrio
🏢 5+: Escalable, proyectos complejos

📊 Estructuras visuales: pndrs.link/team-structures
📋 Requisitos detalle: pndrs.link/minimum-resources`;
  }

  if (upperMessage.includes('INFO_COMUNIDAD')) {
    return `🌐 Niveles de Comunidad:
🔴 Riesgoso: Comunidad fantasma (<50 usuarios)
🟡 Medio: Comunidad básica (50-200)
🟢 Bueno: Comunidad activa (>200 reales)

📊 Impact Matrix: pndrs.link/community-impact
📖 Guía activación: pndrs.link/activate-community`;
  }

  if (upperMessage.includes('INFO_TIEMPO')) {
    return `⏰ Roadmap de Lanzamiento:
📅 30 días: Setup básico + validación inicial
📅 60 días: MVP funcional + primeros testers
📅 90 días: Lanzamiento completo + comunidad

📊 Roadmap template: pndrs.link/launch-roadmap`;
  }

  return null; // No INFO trigger found
}

/**
 * Get completion message when 8 questions are done
 */
function getCompletionMessage(): string {
  return `Gracias, creador. Hemos registrado tu información.
Ahora completa la última capa para formalizar tu Protocolo aquí 👇

🔗 pandor.as/apply

¡Felicidades por completar el filtro inicial!`;
}
