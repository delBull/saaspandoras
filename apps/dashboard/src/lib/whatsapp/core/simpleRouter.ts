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

// Utility Protocol Flow (Landing: utility-protocol) - NOW WITH PROGRESSION
function handleUtilityFlow(message: string, step = 0): FlowResult {
  const text = message.toLowerCase().trim();

  // Step 0: Initial introduction and project details request
  if (step === 0) {
    return {
      handled: true,
      flowType: 'utility',
      response: `🏗️ **Consultoría Arquitectura W2E - Pandora's**\n\nHola! Soy tu asesor especializado en protocolos de utilidad.\n\nPara darte una consultoría personalizada, por favor responde:\n\n• ¿Qué tipo de utilidad quieres implementar?\n• ¿Para qué problema es tu solución?\n• ¿Cuál es tu público objetivo?\n\n💡 **Comandos disponibles:** 📝 'eight_q', 🎯 'founders', 🆘 'support'`
    };
  }

  // Step 1: Project details collection and validation
  if (step === 1) {
    const hasProjectDetails = (msg: string) => {
      const words = msg.split(' ').length;
      const hasKeywords = ['protocolo', 'token', 'blockchain', 'w2e', 'utility', 'nft', 'dao', 'defi', 'web3', 'crypto'].some(kw => msg.toLowerCase().includes(kw));
      return words > 10 && hasKeywords;
    };

    if (hasProjectDetails(text)) {
      return {
        handled: true,
        flowType: 'utility',
        response: `✅ **Perfecto! Recibí tu idea inicial**\n\nAhora necesito más detalles técnicos:\n\n• Plataforma de desarrollo (Ethereum, Solana, etc.)\n• Mecánicas principales de tu protocolo\n• Modelo de tokenomics básico\n• Recursos disponibles para desarrollo\n\n_Responde con estos detalles para continuar la consultoría_`,
        action: 'details_collected'
      };
    } else {
      return {
        handled: true,
        flowType: 'utility',
        response: `📝 **Necesito más detalles sobre tu proyecto**\n\nPor favor comparte:\n• ¿Qué problema resuelve tu protocolo?\n• ¿Para quién es tu solución?\n• ¿Qué hace exactamente?\n\nMientras más específico seas, mejor puedo asesorarte.`,
        action: 'more_details_needed'
      };
    }
  }

  // Step 2: Technical details and consultancy options
  if (step === 2) {
    return {
      handled: true,
      flowType: 'utility',
      response: `🔧 **¡Excelente progreso! Tu idea suena sólida**\n\n📋 **Próximo paso:** Arquitectura y viabilidad\n\nTe ofrezco las siguientes opciones:\n\n1️⃣ **Análisis completo** - Arquitectura detallada ($499)\n2️⃣ **Plan de implementación** - Roadmap técnico ($299)\n3️⃣ **Consultoría financiera** - Modelo tokenomics ($399)\n\n_Escribe "finalizar" para completar tu aplicación_`
    };
  }

  // Step 3: Lead generation and completion
  if (step === 3 || text.toLowerCase().includes('finalizar')) {
    return {
      handled: true,
      flowType: 'utility',
      response: `🎯 **¡Perfecto! Hemos completado tu evaluación**\n\nTu caso ha sido registrado y marcado como **ALTA PRIORIDAD**.\n\nUn arquitecto especializado te contactará en las próximas 24h para:\n\n• Revisar tu idea en detalle\n• Desarrollar la especificación técnica\n• Estimar costos y timeline\n\n📧 **Confirmación enviada a tu email**\n🔗 **Dashboard:** dash.pandoras.finance`,
      isCompleted: true,
      action: 'lead_generated'
    };
  }

  // Default response for ongoing conversations (show current step status)
  const stepMessages = {
    0: 'recopilando idea inicial',
    1: 'recopilando detalles técnicos',
    2: 'evaluando viabilidad',
    3: 'generando lead'
  };

  return {
    handled: true,
    flowType: 'utility',
    response: `🎯 **Tu consultoría Utility Protocol está en progreso** (${stepMessages[step as keyof typeof stepMessages] || 'procesando'})\n\nContinua respondiendo o escribe:\n• "continuar" - próximo paso\n• "start" - cambiar a flujo 8 preguntas\n• "founders" - programa founders\n• "support" - soporte técnico`,
    action: 'ongoing_consultation'
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
      response: `� **Programa Founders Inner Circle**\n\nEste canal es para founders con capital disponible.\n\nSi tienes un proyecto y capacidad de inversión, cuéntame:\n\n• ¿Cuál es tu proyecto?\n• ¿Qué capital disponible tienes?\n• ¿Cuál es tu experiencia?`
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
      response: `�🔍 **Mecanismos:** ✅ Moderación verificable, tareas cuantificables. Guía: pndrs.link/mechanic-guide`
    };
  }
  
  if (text.includes('info_flujo')) {
    return {
      handled: true,
      flowType: 'eight_q',
      response: `🌊 **Flujos:** Usuario llega → completar misiones → ganar recompensas. Guía: pndrs.link/flow-guide`
    };
  }
  
  // Si es una respuesta de pregunta (validar que tenga contenido significativo)
  if (text && step < QUESTIONS.length && !text.includes('info_')) {
    // Validar respuesta mínima (al menos 5 caracteres y no solo números/simbolos)
    const isValidResponse = text.length >= 5 && /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(text);

    if (!isValidResponse) {
      return {
        handled: true,
        flowType: 'eight_q',
        response: `📝 **Respuesta muy corta o inválida**\n\nPor favor proporciona una respuesta más detallada a:\n\n**Pregunta ${step + 1}:**\n${QUESTIONS[step]}`,
        action: 'invalid_response'
      };
    }

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
        response: `🎉 **¡Perfecto! Filtro Completado**\n\nTus respuestas han sido registradas. Completa tu aplicación formal:\n\n🔗 **https://dash.pandoras.finance/apply**\n\n📧 Un estratega revisará tu caso en 24-48h.\n\n💡 **Comandos adicionales:**\n• "utility" - Consultoría de protocolos\n• "founders" - Programa founders\n• "support" - Soporte técnico`,
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

      console.log(`📊 [FLOW-STATE] Usuario ${phone}: flow=${existingFlow}, currentStep=${currentState.step}`);
      
      // Procesar respuesta en el flujo existente
      let result: FlowResult;

      // CHECK FOR FLOW SWITCHING COMMANDS FIRST
      const flowSwitchCommands = {
        'eight_q': 'eight_q',
        'eightq': 'eight_q',
        'start': 'eight_q',
        'utility': 'utility',
        'founders': 'high_ticket',
        'high_ticket': 'high_ticket',
        'support': 'support',
        'human': 'human'
      };

      const requestedSwitch = Object.keys(flowSwitchCommands).find(cmd =>
        messageText.toLowerCase().trim().includes(cmd)
      );

      // If user wants to switch flows, do it immediately
      if (requestedSwitch && flowSwitchCommands[requestedSwitch as keyof typeof flowSwitchCommands] !== existingFlow) {
        const newFlow = flowSwitchCommands[requestedSwitch as keyof typeof flowSwitchCommands];
        console.log(`🔄 [FLOW-SWITCH] Usuario ${phone} cambiando de ${existingFlow} a ${newFlow}`);

        // Update session to new flow
        await sql`
          UPDATE whatsapp_sessions s
          SET flow_type = ${newFlow}, current_step = 0, state = '{}'::jsonb, updated_at = now()
          FROM whatsapp_users u
          WHERE s.user_id = u.id
            AND u.phone = ${phone}
            AND s.is_active = true
        `;

        // Handle the message with the new flow
        switch (newFlow) {
          case 'utility':
            result = handleUtilityFlow(messageText, 0);
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
        }

        result.response = `🔄 **Cambiando a ${newFlow.replace('_', ' ').toUpperCase()}**\n\n${result.response || ''}`;
      } else {
        // PROCESS EXISTING FLOW NORMALLY
        switch (existingFlow) {
          case 'utility':
            result = handleUtilityFlow(messageText, currentState.step);
            if (result.action === 'details_collected') {
              await updateFlowStep(phone, 2); // Skip to consultancy options
            } else if (result.action === 'lead_generated') {
              await updateFlowStep(phone, 4); // Mark as completed
              console.log(`🎯 [UTILITY] Lead generated for user ${phone}`);
            } else if (messageText.toLowerCase().includes('continuar')) {
              const nextStep = Math.min(currentState.step + 1, 3);
              await updateFlowStep(phone, nextStep);
              result = handleUtilityFlow(messageText, nextStep);
            }
            break;
          case 'high_ticket':
            result = handleHighTicketFlow(messageText, currentState.step);
            if (result.action === 'next_question') {
              await updateFlowStep(phone, currentState.step + 1);
            }
            break;
          case 'eight_q':
            console.log(`🔍 [EIGHT_Q] Processing message for step ${currentState.step}: "${messageText}"`);
            result = handleEightQFlow(messageText, currentState.step);
            console.log(`📈 [EIGHT_Q] Result: action=${result.action}, progress=${result.progress}`);

            if (result.action === 'next_question') {
              const nextStep = currentState.step + 1;
              console.log(`📊 [EIGHT_Q] Updating step from ${currentState.step} to ${nextStep}`);
              await updateFlowStep(phone, nextStep);
            } else if (result.isCompleted) {
              console.log(`🎯 [EIGHT_Q] Flow completed for user ${phone}, deactivating session`);
              // Optional: Mark session as completed but don't deactivate yet
              await updateFlowStep(phone, 8); // Mark as completed
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
