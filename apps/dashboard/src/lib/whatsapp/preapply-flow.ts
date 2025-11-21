import { WHATSAPP_FLOW_CONFIG, WHATSAPP_QUICK_INFO } from './flowConfig';
import {
  getOrCreatePreapplyLead,
  savePreapplyAnswer,
  advancePreapplyStep,
  markPreapplyCompleted,
  getPreapplyAnswers,
  handlePreapplyFlowDecision,
  getOrCreateActiveSession,
  updateSessionState,
  logMessage,
  closeSession,
  upsertWhatsAppUser,
  switchSessionFlow,
  getActiveSession
} from './preapply-db';
import { sendWhatsAppMessage } from './client';

/**
 * Interfaz común para resultados de todos los flow handlers
 */
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

// Tipos para mensajes de WhatsApp
interface WhatsAppMessage {
  from: string;
  type: 'text' | 'image' | 'document' | 'sticker' | 'audio' | 'video' | 'location' | 'contacts' | 'unknown';
  text?: {
    body: string;
  };
  timestamp: string;
  id: string;
}

interface ProcessingResult {
  nextMessage?: string;
  isCompleted?: boolean;
  projectRedirect?: boolean;
  error?: string;
  flowRedirect?: boolean;
}

/**
 * Keywords que activan flows específicos
 */
const FLOW_TRIGGERS = {
  high_ticket: ['soy founder', 'high ticket', 'capital', 'inversor', 'invertir', 'founder', 'founders', 'founders program', 'want founders'],
  support: ['ayuda', 'problema', 'ayudame', 'soporte', 'hablar con humano'],
  eight_q: ['eight questions', '8 preguntas', 'cuestionario', 'filtro 8q', 'inicio', 'empezar', 'iniciar', 'start', 'comenzar'],
  utility: ['utility protocol', 'protocolo utilidad', 'work to earn', 'w2e', 'loom protocol', 'arquitectura utilidad', 'protocolo funcional'],
  human: [], // Only switched by admin/system
} as const;

/**
 * Detectar si un mensaje inicia el flujo de 8 preguntas filtradas
 */
export function isPreapplyFlowTrigger(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Triggers específico para el flujo filtrado
  const specificTriggers = [
    "filtrar", "pre-apply", "preapply", "filtrado",
    "filtro", "cuestionario rápido", "rápido",
    "verificación", "validación", "preguntas rápidas"
  ];

  // O cualquier mención a "aplicar" o "apply"
  const hasApplyContext = lowerText.includes("apply") ||
                         lowerText.includes("aplicar") ||
                         lowerText.includes("pandor.as");

  const hasFilterContext = specificTriggers.some(trigger =>
    lowerText.includes(trigger)
  );

  return hasApplyContext || hasFilterContext;
}

/**
 * Detectar flow basado en keywords en el mensaje
 */
function detectFlowFromMessage(text: string): string {
  const lowerText = text.toLowerCase();

  for (const [flowType, keywords] of Object.entries(FLOW_TRIGGERS)) {
    const hasKeyword = keywords.some(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      console.log(`🔄 Flow detected from keywords: ${flowType}`);
      return flowType;
    }
  }

  return 'high_ticket'; // Default flow ahora es high_ticket para founders
}

/**
 * Procesar mensaje entrante para el flujo pre-apply con detección de Founders
 */
export async function processPreapplyMessage(message: WhatsAppMessage): Promise<ProcessingResult> {
  const userPhone = message.from;
  const currentText = message.text?.body?.trim();

  if (!currentText) {
    return { error: 'No se recibió texto en el mensaje' };
  }

  console.log(`🔔 Procesando mensaje PRE-APPLY de ${userPhone}: "${currentText.substring(0, 50)}..."`);

  // 🚨 PRIORIDAD: DETECCIÓN DE TODOS LOS FLOWS POR KEYWORDS
  const detectedFlow = detectFlowFromMessage(currentText);
  if (detectedFlow !== 'eight_q') {
    console.log(`🔄 FLOW DETECTED: ${detectedFlow} - Redirigiendo a multi-flow`);

    try {
      // Crear usuario en multi-flow si no existe
      const user = await upsertWhatsAppUser(userPhone);
      if (!user) {
        return {
          error: 'Error inicializando sesión',
          nextMessage: 'Error al inicializar tu proceso. Inténtalo nuevamente por favor.'
        };
      }

      // Crear/obtener sesión del flow detectado
      const session = await getOrCreateActiveSession(user.id, detectedFlow);
      if (!session) {
        return {
          error: `Error creando sesión de ${detectedFlow}`,
          nextMessage: 'Error iniciando proceso. Inténtalo nuevamente por favor.'
        };
      }

      // Forzar el estado al flow detectado (diagnóstico adicional)
      if (session.flowType !== detectedFlow) {
        await switchSessionFlow(session.id, detectedFlow);
        console.log(`✅ Forzado cambio a ${detectedFlow} flow`);
      }

      // Respuesta automática según el flow detectado
      const flowMessages: Record<string, string> = {
        high_ticket: `🎯 ¡Hola! Gracias por identificarte como Founder!

Soy Pandoras AI y veo que estás interesado en nuestro programa de Founders con capital disponible. Me encantaría conocer mejor tu proyecto y cómo podemos apoyarte en tu journey emprendedor.

Te enviaré información detallada sobre nuestro programa Founders y me pondré en contacto contigo por email también. ¿Te parece bien que nos sirva un poco más de información sobre tu idea?

Responde este mensaje con más detalles sobre tu proyecto para continuar.`,

        utility: `🚀 ¡Hola! Veo que estás interesado en nuestro Protocolo de Utilidad!

Nuestra arquitectura W2E (Work-to-Earn) permite tokenizar valor real a través de NFTs funcionales. Es un sistema donde el trabajo genera recompensas directas y duraderas.

¿Te gustaría que te cuente más sobre cómo funciona nuestro protocolo de utilidad?`,

        support: `💬 ¡Hola! Gracias por contactarnos.

Soy Pandoras AI y estoy aquí para Ayudar. ¿En qué puedo asistirte hoy? Mejórmne qué tipo de problema estás experimentando o qué necesitas saber.`,

        human: `👨‍💼 Gracias por tu mensaje.

He transferido tu conversación a uno de nuestros agentes humanos especializados. Te responderemos lo más pronto posible.

Mientras tanto, ¿hay algo específico sobre lo que necesitarías información inmediata?`
      };

      return {
        nextMessage: flowMessages[detectedFlow] || flowMessages.support,
        flowRedirect: true, // Indicador de que se redirigió a multi-flow
      };

    } catch (error) {
      console.error('❌ Error redirigiendo a multi-flow:', error);
      return {
        error: `Error interno procesando mensaje (${detectedFlow})`,
        nextMessage: 'Hubo un error procesando tu mensaje. Inténtalo nuevamente por favor.'
      };
    }
  }

  // Continuar con lógica normal de pre-apply para otros casos...
  const leadState = await getOrCreatePreapplyLead(userPhone);
  if (!leadState) {
    return { error: 'Error inicializando el proceso de pre-apply' };
  }

  // 2. Si es el primer mensaje, enviar bienvenida y primera pregunta
  if (leadState.step === 0 && currentText.toLowerCase() === 'start') {
    console.log(`✅ Iniciando pre-apply para ${userPhone}`);

    const welcomeMessage = WHATSAPP_FLOW_CONFIG.welcome.text;
    const firstQuestion = getFormattedQuestion(0);

    return {
      nextMessage: welcomeMessage + "\n\n" + firstQuestion
    };
  }

  // 3. Si pide info rápida
  if (currentText.toLowerCase() === 'info' || currentText.toLowerCase().includes('info')) {
    return {
      nextMessage: WHATSAPP_QUICK_INFO.info
    };
  }

  // 4. Procesar respuesta a la pregunta actual
  if (leadState.step < 8) {
    const currentQuestion = WHATSAPP_FLOW_CONFIG.questions[leadState.step];
    const validationResult = validatePreapplyAnswer(currentQuestion, currentText);

    if (!validationResult.isValid) {
      return {
        nextMessage: `❌ Respuesta inválida: ${validationResult.error}\n\n${getFormattedQuestion(leadState.step)}`
      };
    }

    // 5. Guardar respuesta
    console.log(`💾 Guardando respuesta para Q${leadState.step + 1}: ${JSON.stringify(validationResult.validatedValue)}`);

    // Extraer nombre/email de Q3 si corresponde
    let applicantName, applicantEmail;
    if (currentQuestion && currentQuestion.id === 'roles') {
      const extractResult = extractContactInfo(currentText);
      applicantName = extractResult.name;
      applicantEmail = extractResult.email;
    }

    const saveSuccess = await savePreapplyAnswer(
      leadState.id,
      currentQuestion!.id,
      validationResult.validatedValue,
      applicantName,
      applicantEmail
    );

    if (!saveSuccess) {
      return { error: 'Error guardando respuesta' };
    }

    // 6. Avanzar al siguiente step
    await advancePreapplyStep(leadState.id);

    // 7. Verificar si terminó
    const updatedState = await getOrCreatePreapplyLead(userPhone);
    if (!updatedState) return { error: 'Error obteniendo estado actualizado' };

    if (updatedState.step >= 8) {
      // COMPLETADO - Marcar como completado
      await markPreapplyCompleted(updatedState.id);

      console.log(`🎉 Lead ${userPhone} completó las 8 preguntas!`);

      return {
        isCompleted: true,
        projectRedirect: true,
        nextMessage: WHATSAPP_FLOW_CONFIG.final.text
      };
    }

    // 8. Enviar siguiente pregunta
    const nextFormattedQuestion = getFormattedQuestion(updatedState.step);
    return {
      nextMessage: `✅ Respuesta registrada!\n\n${nextFormattedQuestion}`
    };

  }

  // Si ya terminó y pide completar
  if (currentText.toLowerCase().includes('completar') || currentText.toLowerCase().includes('apply')) {
    return {
      projectRedirect: true,
      nextMessage: WHATSAPP_FLOW_CONFIG.final.text
    };
  }

  // Mensaje de no entendido
  return {
    nextMessage: "No entendí ese mensaje. Si quieres iniciar el proceso de validación, escribe 'START'.\n\n¿O necesitas ayuda sobre qué hacer?"
  };
}

/**
 * Validar respuesta según tipo de pregunta
 */
function validatePreapplyAnswer(question: any, answer: string): {
  isValid: boolean;
  error?: string;
  validatedValue?: any;
} {
  const text = answer.toLowerCase().trim();

  // Q1 & Q2 & Q5 - Texto libre con validación
  if (['mechanic', 'flow', 'goal'].includes(question.id)) {
    const minLength = question.validation.minLength;
    if (!answer.trim() || answer.trim().length < minLength) {
      return { isValid: false, error: `Respuesta demasiado corta. Por favor explica con al menos ${minLength} caracteres.` };
    }
    return { isValid: true, validatedValue: answer.trim() };
  }

  // Q3 - Roles (con extraction)
  if (question.id === 'roles') {
    const extractResult = extractContactInfo(answer);
    if (!extractResult.name || !extractResult.email) {
      return { isValid: false, error: 'Por favor indica nombre y correo electrónico (ej: Juan - juan@email.com o juan@email.com)' };
    }
    return { isValid: true, validatedValue: extractResult };
  }

  // Q4 - Stage (select)
  if (question.id === 'stage') {
    const optionIndex = parseInt(text) - 1;
    if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= question.options.length) {
      const options = question.options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n');
      return {
        isValid: false,
        error: `Elige un número del 1 al ${question.options.length}:\n${options}`
      };
    }
    return { isValid: true, validatedValue: question.options[optionIndex] };
  }

  // Q6 - Team (select)
  if (question.id === 'team') {
    const optionIndex = parseInt(text) - 1;
    if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= question.options.length) {
      const options = question.options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n');
      return {
        isValid: false,
        error: `Elige un número del 1 al ${question.options.length}:\n${options}`
      };
    }
    const selectedOption = question.options[optionIndex];

    // Si es "2–4 personas" o "5+", guardar info sobre responsable técnico
    if (selectedOption !== "Solo yo" && question.followupQuestion) {
      return { isValid: true, validatedValue: { size: selectedOption, needsTechnicalLead: true } };
    }
    return { isValid: true, validatedValue: { size: selectedOption, needsTechnicalLead: false } };
  }

  // Q7 - Audience (multi-select)
  if (question.id === 'audience') {
    // Permitir múltiples opciones separadas por comas o espacios
    const numbers = text.split(/[,;\s]+/)
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n));

    const validNumbers = numbers.filter(n => n >= 1 && n <= question.options.length);

    if (validNumbers.length === 0) {
      const options = question.options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n');
      return {
        isValid: false,
        error: `Elige los números que apliquen separados por coma (ej: "1, 2, 4"):\n${options}`
      };
    }

    const selectedOptions = validNumbers.map(num => question.options[num - 1]);
    return { isValid: true, validatedValue: selectedOptions };
  }

  // Q8 - Launch Date (texto libre)
  if (question.id === 'launchDate') {
    if (!answer.trim() || answer.trim().length < question.validation.minLength) {
      return { isValid: false, error: 'Por favor indica una fecha aproximada o período.' };
    }
    return { isValid: true, validatedValue: answer.trim() };
  }

  // Default
  return { isValid: false, error: 'Tipo de respuesta no reconocido' };
}

/**
 * Extraer información de contacto de la respuesta Q3
 */
function extractContactInfo(answer: string): { name?: string; email?: string } {
  const result: { name?: string; email?: string } = {};

  // Buscar email con regex simple
  const emailMatch = answer.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // Extraer nombre (todo antes del email, o todo si no hay email)
  let namePart = answer;
  if (result.email) {
    namePart = answer.replace(result.email, '').trim();
  }

  // Limpiar nombre de caracteres extra
  const name = namePart
    .replace(/[-–]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (name && name.length > 0) {
    result.name = name;
  }

  return result;
}

/**
 * Generar pregunta formateada con opciones
 */
function getFormattedQuestion(step: number): string {
  const question = WHATSAPP_FLOW_CONFIG.questions[step];
  if (!question) return 'Cuestionario completado.';

  let formatted = `Pregunta ${step + 1} de 8:\n${question.question}`;

  // Formatear opciones para select/multiselect
  if (question.component === 'select' && question.options) {
    const options = question.options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n');
    formatted += '\n\nElige una opción:\n' + options;
  }

  if (question.component === 'multi-select' && question.options) {
    const options = question.options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n');
    formatted += '\n\nElige las que apliquen (ej: "1, 3, 5"):\n' + options;
  }

  return formatted + '\n\nRespuesta:';
}

/**
 * Procesar mensaje usando el sistema multi-flow inteligente
 */
export async function processMultiFlowMessage(message: any): Promise<FlowResult> {
  const userPhone = message.from;
  const messageText = message.text?.body?.trim();

  try {
    console.log(`🔄 Processing multi-flow for ${userPhone}: "${messageText?.substring(0, 50)}..."`);

    // Paso 1: Determinar el flujo apropiado (inteligente)
    const flowDecision = await determineFlowType(userPhone, messageText);

    console.log(`🎯 Flow Decision: ${flowDecision.flowType} (reason: ${flowDecision.reason})`);

    // Paso 2: Routing basado en el tipo de flujo determinado
    switch (flowDecision.flowType) {
      case 'human':
        return await handleHumanFlow(userPhone, message, flowDecision.session || null);

      case 'high_ticket':
        return await handleHighTicketFlow(userPhone, message, flowDecision.session || null);

      case 'support':
        return await handleSupportFlow(userPhone, message, flowDecision.session || null);

      case 'eight_q':
      default:
        return await handleEightQFlow(userPhone, message, flowDecision.session || null);
    }

  } catch (error) {
    console.error('❌ Error en processMultiFlowMessage:', error);

    // Fallback al sistema legacy si algo falla
    try {
      const { processIncomingMessage } = await import('./flow');
      const fallbackResult = await processIncomingMessage(message);
      return {
        handled: true,
        flowType: 'eight_q_fallback',
        response: fallbackResult.nextQuestion || 'Error interno. Intentando legacy system...',
        error: 'Multi-flow failed, using legacy',
        status: 'fallback'
      };
    } catch (fallbackError) {
      return {
        handled: false,
        error: 'Both multi-flow and legacy failed',
        flowType: 'error',
        status: 'critical_error'
      };
    }
  }
}

/**
 * Determinar el tipo de flujo basado en keywords y estado del usuario
 */
async function determineFlowType(userPhone: string, messageText: string) {
  // Keywords para detectar cambio de flujo
  const FLOW_KEYWORDS = {
    high_ticket: ['soy founder', 'high ticket', 'capital', 'inversor', 'invertir', 'funding', 'levantar capital'],
    support: ['ayuda', 'problema', 'ayudame', 'soporte', 'hablar con humano', 'no entiendo', 'no funciona'],
    human: [] // Solo por escalación admin
  };

  // Detectar si el usuario quiere cambiar de flujo
  const detectFlowChange = (text: string) => {
    for (const [flowType, keywords] of Object.entries(FLOW_KEYWORDS)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        return flowType;
      }
    }
    return null;
  };

  // Si hay keywords de cambio de flujo, intentar cambiar
  const requestedFlow = detectFlowChange(messageText || '');
  if (requestedFlow) {
    console.log(`🔄 User requested flow change to: ${requestedFlow}`);

    try {
      const decision = await handlePreapplyFlowDecision(userPhone, requestedFlow);
      if (decision.shouldUseMultiFlow && decision.session) {
        return {
          flowType: requestedFlow,
          reason: 'keyword_detected',
          session: decision.session
        };
      }
    } catch (error) {
      console.error('Error cambiando de flujo:', error);
    }
  }

  // Si no hay cambio solicitado, mantener flujo actual o determinar nuevo
  const currentSession = await getActiveSession(userPhone);

  if (currentSession) {
    // Usuario ya tiene un flujo activo
    const flowType = currentSession.flowType;
    console.log(`🔄 User has active ${flowType} session, continuing...`);
    return {
      flowType,
      reason: 'existing_session',
      session: currentSession
    };
  }

  // Usuario nuevo - determinar flujo inicial
  const isInitialTrigger = (text: string) => {
    const lowerText = text.toLowerCase();
    const protocolKeywords = ['protocolo', 'utilidad', 'crear', 'pandoras', 'proyecto'];
    const creatorKeywords = ['soy', 'creador', 'quiere', 'hacer', 'lanzar'];

    return protocolKeywords.some(k => lowerText.includes(k)) ||
           creatorKeywords.some(k => lowerText.includes(k)) ||
           lowerText.length > 10; // Mensajes más largos son intenciones serias
  };

  const initialFlow = isInitialTrigger(messageText || '') ? 'eight_q' : 'support';
  console.log(`🆕 New user, starting with ${initialFlow} flow`);

  // Crear sesión inicial
  const decision = await handlePreapplyFlowDecision(userPhone, initialFlow);

  return {
    flowType: decision.shouldUseEightQ ? 'eight_q' : 'support',
    reason: 'new_user_detection',
    session: decision.session
  };
}

/**
 * Handler para flujo Eight-Q (formulario de 8 preguntas)
 */
async function handleEightQFlow(userPhone: string, message: any, session: any): Promise<FlowResult> {
  console.log(`🔢 Processing Eight-Q flow for ${userPhone}`);

  const { processIncomingMessage } = await import('./flow');
  const result = await processIncomingMessage(message);

  return {
    handled: true,
    flowType: 'eight_q',
    response: result.nextQuestion,
    isCompleted: result.isCompleted,
    projectCreated: result.projectCreated,
    action: result.isCompleted ? 'project_created' : 'question_sent',
    progress: getProgressIndicator(session?.current_step || 0, 8),
    status: result.isCompleted ? 'completed' : 'active'
  };
}

/**
 * Handler para flujo High-Ticket (founders/inversores)
 */
async function handleHighTicketFlow(userPhone: string, message: any, session: any): Promise<FlowResult> {
  console.log(`💰 Processing High-Ticket flow for ${userPhone}`);

  const messageBody = message.text?.body || '';

  // Log del mensaje entrante
  if (session?.id) {
    await logMessage(session.id, 'incoming', messageBody, message.type || 'text');
  }

  // Respuesta premium para founders
  const premiumResponse = `💎 ¡Excelente decisión! Eres un perfil perfecto para nuestro programa High-Ticket.

Un asesor especializado te contactará personalmente en las próximas 24 horas para discutir tu visión y los términos de inversión.

Mientras tanto:
• Prepara tu pitch deck
• Reúne métricas clave
• Identifica tus milestones de crecimiento

¿Hay algo específico que quisieras saber sobre el proceso de inversión?

📞 Nuestro equipo de Founders: +52 132 213 7439
📧 founders@pandoras.finance

Mantente pendiente de tu email registrado.`;

  // Log respuesta saliente
  if (session?.id) {
    await logMessage(session.id, 'outgoing', premiumResponse, 'text');
    await updateSessionState(session.id, { currentStep: 1 });
  }

  return {
    handled: true,
    flowType: 'high_ticket',
    response: premiumResponse,
    action: 'premium_contact_initiated',
    status: 'contacted'
  };
}

/**
 * Handler para flujo Support (soporte técnico)
 */
async function handleSupportFlow(userPhone: string, message: any, session: any): Promise<FlowResult> {
  console.log(`🛠️ Processing Support flow for ${userPhone}`);

  const messageBody = message.text?.body || '';

  // Log del mensaje entrante
  if (session?.id) {
    await logMessage(session.id, 'incoming', messageBody, message.type || 'text');
  }

  // Respuesta automática del soporte
  let supportResponse = '';

  // Intentar detectar el tipo de problema
  const lowerBody = messageBody.toLowerCase();

  if (lowerBody.includes('no funciona') || lowerBody.includes('error')) {
    supportResponse = `🔧 **Problema Técnico Detectado**

Entiendo que estás teniendo un problema técnico. Vamos a solucionarlo:

1. ¿En qué pantalla específicamente ocurre el error?
2. ¿Qué estabas intentando hacer?
3. ¿Aparece algún mensaje de error específico?

Mientras tanto, intenta:
• Refrescar la página (F5)
• Limpiar caché del navegador
• Intentar en una ventana incógnita

Si el problema persiste, te conectaré con nuestro equipo técnico especializado.`;
  } else if (lowerBody.includes('cuenta') || lowerBody.includes('login')) {
    supportResponse = `🔐 **Soporte de Cuenta**

Para ayudarte con problemas de cuenta:

**¿Qué necesitas?**
• ¿No puedes acceder a tu cuenta?
• ¿Olvidaste tu contraseña?
• ¿Problema con tu wallet?
• ¿Error en la verificación KYC?

Por favor indica el problema específico y te guío paso a paso.

**Enlaces útiles:**
• /login - Para iniciar sesión
• /profile - Gestionar tu cuenta
• /help - Centro de ayuda`;
  } else {
    supportResponse = `🆘 **Centro de Soporte Pandoras**

Hola soy tu asistente de soporte automatizado. Estoy aquí para ayudarte.

**¿Con quéarea necesitas ayuda?**
• 🚀 **Crear Protocolo** - Problemas con el builder
• 💰 **Finanzas** - Wallets, pagos, transacciones
• 📊 **Gamificación** - Puntos, achievements, leaderboard
• 👤 **Cuenta** - Login, perfil, configuración

**Opciones rápidas:**
Responde con el número correspondiente:
1. Conectar con agente humano
2. FAQ más frecuentes
3. Status del sistema
4. Volver al menú principal

¿Qué necesitas hoy? 💬`;
  }

  // Log respuesta saliente
  if (session?.id) {
    await logMessage(session.id, 'outgoing', supportResponse, 'text');
    await updateSessionState(session.id, { currentStep: (session.current_step || 0) + 1 });
  }

  return {
    handled: true,
    flowType: 'support',
    response: supportResponse,
    action: 'support_response_sent',
    status: 'active'
  };
}

/**
 * Handler para flujo Human (escalado a agentes humanos)
 */
async function handleHumanFlow(userPhone: string, message: any, session: any): Promise<FlowResult> {
  console.log(`👨‍💼 Processing Human flow for ${userPhone}`);

  const { handleHumanAgentFlow } = await import('../../app/api/whatsapp/webhook/handlers/human');

  return await handleHumanAgentFlow(message, session);
}

/**
 * Generar indicador de progreso para flujos
 */
function getProgressIndicator(current: number, total: number): string {
  if (current === 0) return 'Iniciando...';
  return `${current}/${total}`;
}
