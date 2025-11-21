import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WHATSAPP, validateWhatsAppConfig } from '@/lib/whatsapp/config';
import { processIncomingMessage } from '@/lib/whatsapp/flow';
import { processMultiFlowMessage } from '@/lib/whatsapp/preapply-flow';

/**
 * Interfaz común para resultados de todos los flow handlers
 */
interface FlowResult {
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

    // DETERMINAR FLUJO Y PROCESAR CON EL SISTEMA MULTI-FLOW
    const flowResult = await processMultiFlowMessage({
      from: message.from,
      type: message.type,
      text: message.text,
      timestamp: message.timestamp,
      id: message.id,
      // Agregar otros campos si es necesario
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



/**
 * Determinar el tipo de flujo basado en keywords y estado del usuario
 */
async function determineFlowType(userPhone: string, messageText: string) {
  const { handlePreapplyFlowDecision, getActiveSession } = await import('@/lib/whatsapp/preapply-db');

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
async function handleEightQFlow(userPhone: string, message: any, session: any) {
  console.log(`🔢 Processing Eight-Q flow for ${userPhone}`);

  const { processIncomingMessage } = await import('@/lib/whatsapp/flow');
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
async function handleHighTicketFlow(userPhone: string, message: any, session: any) {
  console.log(`💰 Processing High-Ticket flow for ${userPhone}`);

  // Importar logMessage para guardar el mensaje
  const { logMessage, updateSessionState, closeSession } = await import('@/lib/whatsapp/preapply-db');

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
async function handleSupportFlow(userPhone: string, message: any, session: any) {
  console.log(`🛠️ Processing Support flow for ${userPhone}`);

  // Importar logMessage para guardar el mensaje
  const { logMessage, updateSessionState } = await import('@/lib/whatsapp/preapply-db');

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
async function handleHumanFlow(userPhone: string, message: any, session: any) {
  console.log(`👨‍💼 Processing Human flow for ${userPhone}`);

  const { handleHumanAgentFlow } = await import('./webhook/handlers/human');

  return await handleHumanAgentFlow(message, session);
}

/**
 * Generar indicador de progreso para flujos
 */
function getProgressIndicator(current: number, total: number): string {
  if (current === 0) return 'Iniciando...';
  return `${current}/${total}`;
}
