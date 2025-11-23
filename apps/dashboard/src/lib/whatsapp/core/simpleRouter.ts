// =====================================================
// WHATSAPP SIMPLE ROUTER - FLOWS INDEPENDIENTES (FASE 4)
// Sistema simplificado sin switching entre flujos
// Un número = Un flujo = Una sola conversación
// =====================================================

import { sql } from "@/lib/database";
import type { WhatsAppUser, WhatsAppSession } from "@/db/schema";

/**
 * INTERFACES SIMPLIFICADAS
 */
export interface WhatsAppMessage {
  from: string;
  type: 'text' | 'image' | 'document' | 'sticker' | 'audio' | 'video' | 'location' | 'contacts' | 'unknown';
  text?: { body: string };
  id: string;
  timestamp: string;
}

export interface FlowResult {
  handled: boolean;
  flowType: string;
  response?: string;
  action?: string;
  progress?: string;
  status?: string;
  isCompleted?: boolean;
  projectCreated?: boolean;
  error?: string;
}

// Los 5 flujos independientes
export type FlowType = 'utility' | 'high_ticket' | 'eight_q' | 'support' | 'human';

/**
 * HANDLERS SIMPLES PARA CADA FLUJO
 */

// Utility Protocol Flow (Landing: utility-protocol)
function handleUtilityFlow(message: string): FlowResult {
  const text = message.toLowerCase().trim();
  
  // Respuestas informativas
  if (text.includes('ayuda') || text.includes('help')) {
    return {
      handled: true,
      flowType: 'utility',
      response: `🚀 **Protocolos de Utilidad en Pandora's**\n\nPara crear uno, responde con detalles de lo que quieres lograr:\n\n• ¿Qué tipo de utilidad quieres crear?\n• ¿Cuál es tu audiencia objetivo?\n• ¿Tienes alguna idea específica?`
    };
  }
  
  // Respuesta genérica de inicio
  return {
    handled: true,
    flowType: 'utility',
    response: `🏗️ **Consultoría Arquitectura W2E**\n\nEstoy aquí para ayudarte a diseñar tu Protocolo de Utilidad.\n\nComparte detalles sobre tu proyecto y te daré orientación específica sobre arquitectura, tokenomics y viabilidad.\n\n💡 **Tip:** Mientras más específico seas, mejor puedo ayudarte.`
  };
}

// High Ticket Founders Flow (Landing: founders)
function handleHighTicketFlow(message: string, step = 0): FlowResult {
  const text = message.toLowerCase().trim();
  
  if (text.includes('cancelar') || text.includes('stop')) {
    return {
      handled: true,
      flowType: 'high_ticket',
      response: `Operación cancelada. Si cambias de opinión, envía "founders" para reiniciar.`
    };
  }
  
  // Detectar si es una respuesta adecuada
  const hasRelevantKeywords = text.includes('capital') || text.includes('inversión') || text.includes('founder') || text.includes('proyecto');
  
  if (!hasRelevantKeywords && step === 0) {
    return {
      handled: true,
      flowType: 'high_ticket',
      response: `👑 **Programa Founders Inner Circle**\n\nEste canal es para founders con capital disponible.\n\nSi tienes un proyecto y capacidad de inversión, cuéntame:\n\n• ¿Cuál es tu proyecto?\n• ¿Qué capital disponible tienes?\n• ¿Cuál es tu experiencia?`
    };
  }
  
  return {
    handled: true,
    flowType: 'high_ticket',
    response: `✅ **Solicitud Recibida - Founders Program**\n\nPerfecto, tu solicitud está registrada. Un estratega especializado te contactará en las próximas 24-48 horas.\n\n📧 Mientras tanto, puedes completar tu aplicación en: https://dash.pandoras.finance/apply\n\n💰 **Nota:** Los founders con capital disponible y roadmap claro tienen prioridad.`
  };
}

// Eight Questions Flow (Landing: start)
function handleEightQFlow(message: string, step = 0): FlowResult {
  const QUESTIONS = [
    "¿Cuál es la acción verificable que realiza el usuario dentro de tu Creación?",
    "Explica cómo interactúa un usuario final con tu Protocolo paso a paso.",
    "¿Quién administrará tu Protocolo dentro de Pandora?",
    "¿En qué etapa está actualmente tu Protocolo?",
    "¿Cuál es tu objetivo al lanzar tu Protocolo dentro de Pandora?",
    "¿Con cuántas personas cuenta tu proyecto actualmente?",
    "¿Tu proyecto ya cuenta con comunidad o audiencia?",
    "¿Cuál es tu fecha estimada para lanzar la primera versión de tu Protocolo?"
  ];
  
  const text = message.toLowerCase().trim();
  
  if (text.includes('info_mecanismo')) {
    return {
      handled: true,
      flowType: 'eight_q',
      response: `🔍 **Mecanismos:** ✅ Moderación verificable, tareas cuantificables. Guía: pndrs.link/mechanic-guide`
    };
  }
  
  if (text.includes('info_flujo')) {
    return {
      handled: true,
      flowType: 'eight_q',
      response: `🌊 **Flujos:** Usuario llega → completar misiones → ganar recompensas. Guía: pndrs.link/flow-guide`
    };
  }
  
  // Si es una respuesta de pregunta
  if (text && step < QUESTIONS.length && !text.includes('info_')) {
    const nextStep = step + 1;
    
    if (nextStep < QUESTIONS.length) {
      return {
        handled: true,
        flowType: 'eight_q',
        response: `✅ Respuesta registrada.\n\n**Pregunta ${nextStep + 1}:**\n${QUESTIONS[nextStep]}`,
        progress: `${nextStep + 1}/${QUESTIONS.length}`,
        action: 'next_question'
      };
    } else {
      return {
        handled: true,
        flowType: 'eight_q',
        response: `🎉 **¡Perfecto! Filtro Completado**\n\nTus respuestas han sido registradas. Completa tu aplicación formal:\n\n🔗 **https://dash.pandoras.finance/apply**\n\n📧 Un estratega revisará tu caso en 24-48h.`,
        isCompleted: true,
        action: 'redirect_to_apply'
      };
    }
  }
  
  // Primera pregunta
  return {
    handled: true,
    flowType: 'eight_q',
    response: `📋 **Filtro de Viabilidad - 8 Preguntas**\n\n**Pregunta 1:**\n${QUESTIONS[0]}`,
    progress: `1/${QUESTIONS.length}`,
    action: 'first_question'
  };
}

// Support Flow
function handleSupportFlow(message: string): FlowResult {
  const text = message.toLowerCase().trim();
  
  if (text.includes('problema técnico') || text.includes('error') || text.includes('bug')) {
    return {
      handled: true,
      flowType: 'support',
      response: `🔧 **Soporte Técnico**\n\nDescripción detallada del problema:\n\n1. ¿Qué estabas tratando de hacer?\n2. ¿Qué mensaje de error ves?\n3. ¿En qué navegador/dispositivo?\n\nUn técnico revisará tu caso.`,
      action: 'technical_issue'
    };
  }
  
  if (text.includes('protocolo') || text.includes('duda')) {
    return {
      handled: true,
      flowType: 'support',
      response: `📚 **Soporte de Protocolo**\n\nTu pregunta ha sido escalada a nuestro equipo técnico.\n\nRespuesta estimada: 2-4 horas.\n\n📞 **Urgente:** Llama a +52 1 332 213 7498`
    };
  }
  
  return {
    handled: true,
    flowType: 'support',
    response: `🆘 **Centro de Soporte**\n\nEscribe el número de tu consulta:\n\n1️⃣ Problemas técnicos\n2️⃣ Dudas sobre protocolo\n3️⃣ Información financiera\n4️⃣ Hablar con humano\n\n💡 **Respuesta típica:** 2-4 horas`
  };
}

// Human Flow
function handleHumanFlow(): FlowResult {
  return {
    handled: true,
    flowType: 'human',
    response: `👨‍💼 **Escalado a Agente Humano**\n\nGracias por escribirnos. Un agente especializado te contactará en las próximas 2-4 horas.\n\n📧 **Confirmación:** Recibirás un email de confirmación.\n📞 **Urgente:** Si es urgente, llama a +52 1 332 213 7498`,
    action: 'human_escalated'
  };
}

/**
 * FUNCIONES DE BASE DE DATOS SIMPLIFICADAS
 */

// Verificar si un usuario ya tiene un flujo asignado
async function getExistingFlow(phone: string): Promise<FlowType | null> {
  const [row] = await sql`
    SELECT s.flow_type 
    FROM whatsapp_sessions s
    JOIN whatsapp_users u ON s.user_id = u.id
    WHERE u.phone = ${phone} 
      AND s.is_active = true
    LIMIT 1
  ` as any[];
  
  return row?.flow_type || null;
}

// Asignar flujo por primera vez
async function assignFlow(phone: string, flowType: FlowType, name?: string): Promise<void> {
  // Crear usuario
  await sql`
    INSERT INTO whatsapp_users (phone, name, priority_level)
    VALUES (${phone}, ${name || null}, 'normal')
    ON CONFLICT (phone)
    DO NOTHING
  `;
  
  // Obtener user_id
  const [user] = await sql`
    SELECT id FROM whatsapp_users WHERE phone = ${phone}
  ` as any[];
  
  if (user) {
    // Crear sesión activa para este flujo
    await sql`
      INSERT INTO whatsapp_sessions (user_id, flow_type, state, current_step, is_active)
      VALUES (${user.id}, ${flowType}, '{}'::jsonb, 0, true)
      ON CONFLICT (user_id, flow_type)
      DO UPDATE SET is_active = true, updated_at = now()
    `;
  }
}

// Obtener estado actual del flujo
async function getCurrentFlowState(phone: string): Promise<{ flowType: FlowType; step: number } | null> {
  const [row] = await sql`
    SELECT s.flow_type, s.current_step
    FROM whatsapp_sessions s
    JOIN whatsapp_users u ON s.user_id = u.id
    WHERE u.phone = ${phone} 
      AND s.is_active = true
    LIMIT 1
  ` as any[];
  
  return row ? { flowType: row.flow_type as FlowType, step: row.current_step || 0 } : null;
}

// Actualizar paso del flujo
async function updateFlowStep(phone: string, step: number): Promise<void> {
  await sql`
    UPDATE whatsapp_sessions s
    SET current_step = ${step}, updated_at = now()
    FROM whatsapp_users u
    WHERE s.user_id = u.id 
      AND u.phone = ${phone}
      AND s.is_active = true
  `;
}

/**
 * DETECCIÓN DE FLUJO BASADA EN LANDING
 */
function detectFlowFromLanding(payload: any, messageText?: string): FlowType {
  // Prioridad 1: Parámetro de landing explícito
  if (payload.flowFromLanding) {
    const validFlows: FlowType[] = ['utility', 'high_ticket', 'eight_q', 'support', 'human'];
    if (validFlows.includes(payload.flowFromLanding as FlowType)) {
      return payload.flowFromLanding as FlowType;
    }
  }
  
  // Prioridad 2: Keywords del mensaje (solo si no tiene flujo asignado)
  const text = (messageText || '').toLowerCase();
  
  if (text.includes('soporte') || text.includes('ayuda') || text.includes('problema')) {
    return 'support';
  }
  
  if (text.includes('humano') || text.includes('agente') || text.includes('persona')) {
    return 'human';
  }
  
  if (text.includes('founder') || text.includes('capital') || text.includes('inversión')) {
    return 'high_ticket';
  }
  
  if (text.includes('protocolo') || text.includes('utilidad') || text.includes('crear')) {
    return 'utility';
  }
  
  // Default para nuevos usuarios: eight_q
  return 'eight_q';
}

/**
 * FUNCIÓN PRINCIPAL DE ROUTING SIMPLIFICADO
 */
export async function routeSimpleMessage(payload: any): Promise<FlowResult> {
  const { from: phone, text, id: messageId } = payload;
  const messageText = text?.body?.trim() || '';
  
  try {
    console.log(`🔄 [SIMPLE-ROUTER] Mensaje de ${phone}: "${messageText.substring(0, 50)}..."`);
    
    // 1. IDEMPOTENCY: Verificar si ya procesamos este mensaje
    const [existingMessage] = await sql`
      SELECT 1 FROM whatsapp_messages 
      WHERE incoming_wamid = ${messageId}
      LIMIT 1
    ` as any[];
    
    if (existingMessage) {
      console.log(`⚡ [SIMPLE-ROUTER] Mensaje duplicado ${messageId} ignorado`);
      return { handled: true, flowType: 'duplicate', action: 'ignored' };
    }
    
    // 2. VERIFICAR FLUJO EXISTENTE
    const existingFlow = await getExistingFlow(phone);
    
    if (existingFlow) {
      console.log(`🔄 [SIMPLE-ROUTER] Usuario ${phone} ya tiene flujo: ${existingFlow}`);
      
      // Solo procesar si es un mensaje válido
      if (!messageText) {
        return { handled: true, flowType: existingFlow, action: 'no_text' };
      }
      
      // Obtener estado actual
      const currentState = await getCurrentFlowState(phone);
      
      if (!currentState) {
        // Error: usuario tiene flujo pero no estado
        console.error(`❌ [SIMPLE-ROUTER] Inconsistencia: usuario ${phone} tiene flujo pero no estado`);
        return {
          handled: true,
          flowType: existingFlow,
          response: 'Error interno. Reinicia enviando "start".',
          action: 'error_reset'
        };
      }
      
      // Procesar respuesta en el flujo existente
      let result: FlowResult;
      switch (existingFlow) {
        case 'utility':
          result = handleUtilityFlow(messageText);
          break;
        case 'high_ticket':
          result = handleHighTicketFlow(messageText, currentState.step);
          if (result.action === 'next_question') {
            await updateFlowStep(phone, currentState.step + 1);
          }
          break;
        case 'eight_q':
          result = handleEightQFlow(messageText, currentState.step);
          if (result.action === 'next_question') {
            await updateFlowStep(phone, currentState.step + 1);
          }
          break;
        case 'support':
          result = handleSupportFlow(messageText);
          break;
        case 'human':
          result = handleHumanFlow();
          break;
        default:
          result = {
            handled: true,
            flowType: existingFlow,
            response: 'Flujo no reconocido. Reinicia enviando "start".',
            action: 'unknown_flow'
          };
      }
      
      // Log mensaje de entrada
      await sql`
        INSERT INTO whatsapp_messages (session_id, direction, body, message_type, incoming_wamid, timestamp)
        SELECT s.id, 'incoming', ${messageText}, 'text', ${messageId}, now()
        FROM whatsapp_sessions s
        JOIN whatsapp_users u ON s.user_id = u.id
        WHERE u.phone = ${phone} AND s.is_active = true
        LIMIT 1
      `;
      
      // Log respuesta si existe
      if (result.response) {
        await sql`
          INSERT INTO whatsapp_messages (session_id, direction, body, message_type, timestamp)
          SELECT s.id, 'outgoing', ${result.response}, 'text', now()
          FROM whatsapp_sessions s
          JOIN whatsapp_users u ON s.user_id = u.id
          WHERE u.phone = ${phone} AND s.is_active = true
          LIMIT 1
        `;
      }
      
      return result;
    }
    
    // 3. NUEVO USUARIO: Asignar flujo basado en landing
    const detectedFlow = detectFlowFromLanding(payload, messageText);
    console.log(`🆕 [SIMPLE-ROUTER] Nuevo usuario ${phone} → flujo: ${detectedFlow}`);
    
    // Asignar flujo
    await assignFlow(phone, detectedFlow, payload.contactName || null);
    
    // Procesar mensaje inicial
    let result: FlowResult;
    switch (detectedFlow) {
      case 'utility':
        result = handleUtilityFlow(messageText);
        break;
      case 'high_ticket':
        result = handleHighTicketFlow(messageText, 0);
        break;
      case 'eight_q':
        result = handleEightQFlow(messageText, 0);
        break;
      case 'support':
        result = handleSupportFlow(messageText);
        break;
      case 'human':
        result = handleHumanFlow();
        break;
      default:
        result = handleEightQFlow(messageText, 0);
        result.flowType = 'eight_q';
    }
    
    // Log inicial
    await sql`
      INSERT INTO whatsapp_messages (session_id, direction, body, message_type, incoming_wamid, timestamp)
      SELECT s.id, 'incoming', ${messageText}, 'text', ${messageId}, now()
      FROM whatsapp_sessions s
      JOIN whatsapp_users u ON s.user_id = u.id
      WHERE u.phone = ${phone} AND s.is_active = true
      LIMIT 1
    `;
    
    if (result.response) {
      await sql`
        INSERT INTO whatsapp_messages (session_id, direction, body, message_type, timestamp)
        SELECT s.id, 'outgoing', ${result.response}, 'text', now()
        FROM whatsapp_sessions s
        JOIN whatsapp_users u ON s.user_id = u.id
        WHERE u.phone = ${phone} AND s.is_active = true
        LIMIT 1
      `;
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ [SIMPLE-ROUTER] Error crítico:', error);
    
    return {
      handled: true,
      flowType: 'error',
      response: 'Error interno temporal. Intenta nuevamente en unos minutos.',
      error: error instanceof Error ? error.message : String(error),
      status: 'critical_error'
    };
  }
}

/**
 * UTILIDADES PARA ADMIN
 */

// Obtener estadísticas simples por flujo
export async function getSimpleFlowStats() {
  try {
    const stats = await sql`
      SELECT 
        flow_type,
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_sessions
      FROM whatsapp_sessions
      GROUP BY flow_type
      ORDER BY total_sessions DESC
    ` as any[];
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas simples:', error);
    return [];
  }
}