// =====================================================
// WHATSAPP UNIFICATION - ROUTER MAESTRO (FASE 3)
// Sistema completo con handlers implementados
// =====================================================

import { sql } from "@/lib/database";
import type { WhatsAppUser, WhatsAppSession } from "@/db/schema";

/**
 * Handlers implementados completos
 */

// Función auxiliar para info triggers
function checkEightQInfoTriggers(message: string): string | null {
  const upperMessage = message.toUpperCase();
  if (upperMessage.includes('INFO_MECANISMO')) {
    return `🔍 Mecanismos: ✅ Moderación verificable, tareas cuantificables. PDF: pndrs.link/mechanic-guide`;
  }
  if (upperMessage.includes('INFO_FLUJO')) {
    return `🌊 Flujos: Usuario llega → completar misiones → ganar recompensas. Guía: pndrs.link/flow-guide`;
  }
  return null;
}

async function handleEightQ(session: WhatsAppSession, payload: any): Promise<FlowResult> {
  const messageText = payload.text?.body?.trim() || '';
  const currentStep = session.currentStep || 0;
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

  // INFO triggers first
  const infoResponse = checkEightQInfoTriggers(messageText);
  if (infoResponse) {
    return { handled: true, flowType: 'eight_q', response: infoResponse, action: 'info_response' };
  }

  // Handle responses
  if (messageText && currentStep < QUESTIONS.length) {
    const nextStep = currentStep + 1;
    const currentState = session.state as any || { answers: {} };
    const newAnswers = { ...(currentState.answers || {}), [`question_${currentStep}`]: messageText };

    await updateSessionState(session.id, { state: { answers: newAnswers }, currentStep: nextStep });

    if (nextStep < QUESTIONS.length) {
      return {
        handled: true, flowType: 'eight_q',
        response: QUESTIONS[nextStep], progress: `${nextStep + 1}/${QUESTIONS.length}`,
        action: 'next_question'
      };
    } else {
      return {
        handled: true, flowType: 'eight_q',
        response: `¡Perfecto! Completa tu aplicación: pandor.as/apply`,
        isCompleted: true, action: 'redirect_to_apply'
      };
    }
  }

  // First question
  if (currentStep === 0) {
    return {
      handled: true, flowType: 'eight_q',
      response: QUESTIONS[0], progress: `1/${QUESTIONS.length}`,
      action: 'first_question'
    };
  }

  return { handled: true, flowType: 'eight_q', response: 'Vamos a validar tu protocolo con preguntas.', action: 'fallback' };
}

async function handleHighTicket(session: WhatsAppSession, payload: any): Promise<FlowResult> {
  const currentStep = session.currentStep || 0;

  if (currentStep === 0) {
    await updateSessionState(session.id, { currentStep: 1 });
    return {
      handled: true, flowType: 'high_ticket',
      response: `¡Hola! Vi que vienes de nuestros Founders.\n¿Cuál es el objetivo principal de tu comunidad este trimestre?`
    };
  }

  if (currentStep === 1) {
    await updateSessionState(session.id, { currentStep: 2 });
    return {
      handled: true, flowType: 'high_ticket',
      response: `Perfecto. ¿Cómo describirías hoy tu comunidad?\n1️⃣ Activa 2️⃣ Básica 3️⃣ En construcción`
    };
  }

  if (currentStep === 2) {
    await updateSessionState(session.id, { currentStep: 3, isActive: false });
    return {
      handled: true, flowType: 'high_ticket',
      response: `Gracias. Completa aplicación Founders: https://pandoras.finance/apply`,
      action: 'redirect_to_apply'
    };
  }

  return { handled: true, flowType: 'high_ticket', response: 'Accessor especial Founders activado.' };
}

function handleUtility(session: WhatsAppSession, payload: any): FlowResult {
  return {
    handled: true, flowType: 'utility',
    response: `🚀 Protocolos de Utilidad en Pandora's\n\nPara crear uno, responde con detalles o escribe 'eight_q'`
  };
}

function handleSupport(session: WhatsAppSession, payload: any): FlowResult {
  return {
    handled: true, flowType: 'support',
    response: `🆘 Centro de Soporte:\n1️⃣ Problemas técnicos\n2️⃣ Dudas sobre protocolo\n3️⃣ Información financiera\n4️⃣ Otros`
  };
}

function handleHuman(session: WhatsAppSession, payload: any): FlowResult {
  return {
    handled: true, flowType: 'human',
    response: `👨‍💼 Gracias por escribirnos. Un agente especializado te contactará en las próximas horas.`,
    action: 'human_escalated'
  };
}

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

export interface WhatsAppMessage {
  from: string;
  type: 'text' | 'image' | 'document' | 'sticker' | 'audio' | 'video' | 'location' | 'contacts' | 'unknown';
  text?: {
    body: string;
  };
  id: string; // message ID para idempotencia
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

// =====================================================
// DB HELPERS ATOMIC (CORE DE LA SOLUCIÓN)
// =====================================================

/**
 * UPSERT USER ATÓMICO - SOLUCIÓN A RACE CONDITIONS
 * INSERT ... ON CONFLICT (phone) para evitar usuarios duplicados
 */
export async function upsertWhatsAppUser(phone: string, name?: string): Promise<WhatsAppUser> {
  const [user] = await sql`
    INSERT INTO whatsapp_users (phone, name, priority_level)
    VALUES (${phone}, ${name || null}, 'normal')
    ON CONFLICT (phone)
    DO UPDATE SET
      name = COALESCE(EXCLUDED.name, whatsapp_users.name),
      updated_at = now()
    RETURNING *
  ` as any[];

  if (!user) throw new Error(`Failed to upsert user for phone: ${phone}`);
  return user;
}

/**
 * GET OR CREATE SESSION ATÓMICA - SOLUCIÓN A RACE CONDITIONS
 * INSERT ... ON CONFLICT (user_id, flow_type) para evitar sesiones duplicadas
 */
export async function getOrCreateActiveSession(userId: string, flowType: string): Promise<WhatsAppSession> {
  // Primero: desactivar otras sesiones activas del usuario (mantener exclusividad)
  await sql`
    UPDATE whatsapp_sessions
    SET is_active = false, updated_at = now()
    WHERE user_id = ${userId} AND is_active = true AND flow_type != ${flowType}
  `;

  // INSERT ATÓMICO: crear o reactivar sesión en una sola operación
  const [session] = await sql`
    INSERT INTO whatsapp_sessions (user_id, flow_type, state, current_step, is_active, updated_at)
    VALUES (${userId}, ${flowType}, '{}'::jsonb, 0, true, now(), now())
    ON CONFLICT (user_id, flow_type)
    DO UPDATE SET
      is_active = true,
      current_step = 0,
      state = '{}'::jsonb,
      updated_at = now()
    RETURNING *
  ` as any[];

  if (!session) throw new Error(`Failed to create or reactivate session for user: ${userId}`);
  return session;
}

/**
 * GET ACTIVE SESSION - PARA CONTINUACIÓN DE FLOWS
 */
export async function getActiveSession(userId: string): Promise<WhatsAppSession | null> {
  const [session] = await sql`
    SELECT * FROM whatsapp_sessions
    WHERE user_id = ${userId} AND is_active = true
    LIMIT 1
  ` as any[];
  return session || null;
}

/**
 * UPDATE SESSION STATE - PARA PROGRESO DE FLOWS
 */
export async function updateSessionState(
  sessionId: string,
  updates: {
    state?: any;
    currentStep?: number;
    isActive?: boolean;
    status?: string;
  }
): Promise<void> {
  const setParts = ['updated_at = now()'];
  if (updates.state !== undefined) setParts.push(`state = '${JSON.stringify(updates.state)}'::jsonb`);
  if (updates.currentStep !== undefined) setParts.push(`current_step = ${updates.currentStep}`);
  if (updates.isActive !== undefined) setParts.push(`is_active = ${updates.isActive}`);
  if (updates.status !== undefined) setParts.push(`status = '${updates.status}'`);

  await sql.unsafe(`UPDATE whatsapp_sessions SET ${setParts.join(', ')} WHERE id = ${sessionId}`);
}

/**
 * LOG MESSAGE - PARA HISTORIAL COMPLETO
 */
export async function logMessage(
  sessionId: string,
  direction: "incoming" | "outgoing",
  body: string,
  messageType = "text",
  incomingWamid?: string
): Promise<void> {
  await sql`
    INSERT INTO whatsapp_messages (session_id, direction, body, message_type, incoming_wamid, timestamp)
    VALUES (${sessionId}, ${direction}, ${body}, ${messageType}, ${incomingWamid || null}, now())
  `;
}

/**
 * IDEMPOTENCY CHECK - EVITAR RE-DELIVERIES
 */
export async function isAlreadyProcessed(messageId: string): Promise<boolean> {
  const [existing] = await sql`
    SELECT 1 FROM whatsapp_messages
    WHERE incoming_wamid = ${messageId}
    LIMIT 1
  ` as any[];
  return !!existing;
}

// =====================================================
// DETECCIÓN DE FLOWS INTELIGENTE
// =====================================================

/**
 * DETERMINAR FLOW BASADO EN CONTEXTO
 */
export function detectFlowType(
  message: WhatsAppMessage,
  payload: any // incluye landing params, referrer, etc
): string {

  const text = message.text?.body?.toLowerCase() || '';

  // PRIORIDAD 1: PARAMS DE LANDING (/wa_flow=utility)
  if (payload.flowFromLanding) {
    return payload.flowFromLanding; // 'utility', 'high_ticket', etc
  }

  // PRIORIDAD 2: KEYWORDS EXPLÍCITOS
  if (text.includes('soy founder') || text.includes('high ticket')) {
    return 'high_ticket';
  }

  if (text.includes('crear') || text.includes('protocolo') || text.includes('utility')) {
    return 'utility';
  }

  if (text.includes('ayuda') || text.includes('problema')) {
    return 'support';
  }

  if (text.includes('hablar con humano') || text.includes('especialista')) {
    return 'human';
  }

  // PRIORIDAD 3: DEFAULT AL FLOW MÁS COMPLETO
  return 'eight_q'; // Preguntas completas como fallback
}

// =====================================================
// ROUTER MAESTRO - CEREBRO DEL SISTEMA
// =====================================================

/**
 * ROUTE MESSAGE - FUNCIÓN CENTRAL DEL SISTEMA
 */
export async function routeMessage(payload: any): Promise<FlowResult> {
  const { from: phone, text, id: messageId } = payload;
  const messageText = text?.body?.trim() || '';

  try {
    console.log(`🔄 [ROUTER] Processing message from ${phone}: "${messageText.substring(0, 50)}..."`);

    // 1. IDEMPOTENCY: Evitar re-deliveries de Meta
    if (await isAlreadyProcessed(messageId)) {
      console.log(`⚡ [ROUTER] Duplicate message ${messageId} ignored`);
      return { handled: true, flowType: 'duplicate', action: 'ignored' };
    }

    // 2. UPSERT USER (ATÓMICO - NO CREA DUPLICADOS)
    const user = await upsertWhatsAppUser(phone, payload.contactName || null);
    console.log(`👤 [ROUTER] User ${phone} → ID: ${user.id}`);

    // 3. PRIORIDAD ABSOLUTA: SESSION ACTIVA
    const activeSession = await getActiveSession(user.id);
    if (activeSession) {
      console.log(`🔄 [ROUTER] Continuing ${activeSession.flowType} session: ${activeSession.id}`);
      return await delegateToHandler(activeSession, payload);
    }

    // 4. NO SESSION ACTIVA: DETECTAR FLOW NUEVO
    const requestedFlow = detectFlowType(payload, payload); // payload incluye landing params
    console.log(`🆕 [ROUTER] New ${requestedFlow} flow for user ${user.id}`);

    // 5. CREAR SESSION (ATÓMICO - NO DUPLICADOS)
    const session = await getOrCreateActiveSession(user.id, requestedFlow);

    return await delegateToHandler(session, payload);

  } catch (error) {
    console.error('❌ [ROUTER] Critical error:', error);

    // FALLBACK: Legacy system if something breaks
    try {
      const { processIncomingMessage } = await import('./flow');
      const fallbackResult = await processIncomingMessage(payload);
      return {
        handled: true,
        flowType: 'eight_q_fallback',
        response: fallbackResult.nextQuestion || 'Error interno temporal',
        error: 'Router failed, using legacy',
        status: 'fallback_active'
      };
    } catch (fallbackError) {
      return {
        handled: false,
        flowType: 'critical_error',
        error: 'Both new system and legacy failed',
        status: 'error'
      };
    }
  }
}

/**
 * DELEGATE TO HANDLER - ROUTING POR FLOW TYPE
 */
async function delegateToHandler(session: WhatsAppSession, payload: any): Promise<FlowResult> {
  const flowType = session.flowType;

  // LOG INCOMING MESSAGE
  const messageText = payload.text?.body || '';
  await logMessage(session.id, 'incoming', messageText, payload.type || 'text', payload.id);

  // ROUTING A HANDLERS IMPLEMENTADOS
  console.log(`🎯 [ROUTER] Delegating to ${flowType} handler`);

  try {
    let result: FlowResult;

    switch (flowType) {
      case 'eight_q':
        result = await handleEightQ(session, payload);
        break;

      case 'high_ticket':
        result = await handleHighTicket(session, payload);
        break;

      case 'utility':
        result = handleUtility(session, payload);
        break;

      case 'support':
        result = handleSupport(session, payload);
        break;

      case 'human':
        result = handleHuman(session, payload);
        break;

      default:
        result = await handleEightQ(session, payload); // Default a eight_q
        result.flowType = 'eight_q';
        result.action = 'default_fallback';
        break;
    }

    // LOG OUTGOING MESSAGE SI HAY RESPUESTA
    if (result.response) {
      await logMessage(session.id, 'outgoing', result.response, 'text');
    }

    return result;

  } catch (error) {
    console.error(`❌ [ROUTER] Handler error for ${flowType}:`, error);
    await logMessage(session.id, 'outgoing',
      'Disculpa, hubo un error procesando tu mensaje. ¿Puedes intentarlo nuevamente?',
      'text');

    return {
      handled: true,
      flowType,
      error: `Handler error: ${error instanceof Error ? error.message : String(error)}`,
      status: 'handler_error',
      response: 'Disculpa, hubo un error. ¿Puedes intentarlo nuevamente?'
    };
  }
}
