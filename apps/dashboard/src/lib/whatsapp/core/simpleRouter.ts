// =====================================================
// WHATSAPP SIMPLE ROUTER - FLOWS INDEPENDIENTES (FASE 4)
// Sistema simplificado sin switching entre flujos
// Un número = Un flujo = Una sola conversación
// =====================================================

import { sql } from "@/lib/database";
import type { WhatsAppUser, WhatsAppSession } from "@/db/schema";
import { notifyHumanAgent } from "@/lib/notifications";
import { db } from "~/db";
import { whatsappUsers, whatsappSessions, whatsappMessages } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notifySupportRequest } from "@/lib/discord"; // Dynamic or direct import
import { sendWhatsAppMessage, sendInteractiveMessage } from "../utils/client";
import { syncLeadAsClient } from "@/actions/leads";

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

// Los 6 flujos independientes
export type FlowType = 'utility' | 'high_ticket' | 'eight_q' | 'support' | 'human' | 'protocol_application';

/**
 * HANDLERS SIMPLES PARA CADA FLUJO
 */

// Utility Protocol Flow (Landing: utility-protocol) - NOW WITH PROGRESSION
// Utility Protocol Flow (Landing: utility-protocol - OPTIMIZED TECHNICAL FILTER 2.5)
async function handleUtilityFlow(message: string, step = 0, phone?: string): Promise<FlowResult> {
  const text = message.toLowerCase().trim();

  // Step 0: Entry Authority (No Servilismo)
  // Message 0 sent: "Estás entrando al Filtro de Viabilidad 2.5..."
  // Waiting for: "Sí", "Listo", "Continuar"
  if (step === 0) {
    if (text.includes('sí') || text.includes('si') || text.includes('listo') || text.includes('continuar')) {
      return {
        handled: true,
        flowType: 'utility',
        response: `Q1 — Acción Medible\n\nDescribe una sola acción concreta que el usuario realiza dentro de tu protocolo.\n\nNo visión.\nNo beneficios futuros.\n\n👉 Acción específica + resultado observable.`,
        action: 'next_question'
      };
    } else {
      return {
        handled: true,
        flowType: 'utility',
        response: `El Filtro de Viabilidad requiere confirmación explícita para iniciar. Responde "Listo" para comenzar.`,
        action: 'retry_step'
      };
    }
  }

  // Step 1: Q1 Answered -> Q2: Verification
  if (step === 1) {
    if (text.length < 5) {
      return {
        handled: true,
        flowType: 'utility',
        response: `Demasiado ambiguo. Describe la acción concreta.`,
        action: 'retry_step'
      };
    }
    return {
      handled: true,
      flowType: 'utility',
      response: `Q2 — Verificación\n\n¿Cómo se verifica objetivamente que esa acción ocurrió?\n\nEjemplos válidos:\n• on-chain\n• off-chain con oráculo\n• validación humana definida\n\nSi no hay verificación clara, no hay recompensa.`,
      action: 'next_question'
    };
  }

  // Step 2: Q2 Answered -> Q3: Full Flow
  if (step === 2) {
    return {
      handled: true,
      flowType: 'utility',
      response: `Q3 — Flujo Paso a Paso\n\nEnumera el flujo completo:\n\n1. Entrada del usuario\n2. Acción\n3. Validación\n4. Liberación de recompensa\n\nSin saltos. Sin abstracciones.`,
      action: 'next_question'
    };
  }

  // Step 3: Q3 Answered -> Framing (No Promise)
  if (step === 3) {
    // 🚀 MARKETING AUTOMATION: Utility Protocol Follow-up
    if (phone) {
      try {
        const { MarketingEngine } = await import('@/lib/marketing/engine');
        
        // Sync/Update client
        const syncRes = await syncLeadAsClient({
          whatsapp: phone,
          source: 'utility_filter',
          notes: 'Completed Utility Protocol Filter Q1-Q3',
          metadata: { flow: 'utility' }
        });

        if (syncRes.success && syncRes.data) {
          await MarketingEngine.startCampaign('Utility Protocol Follow-up', { leadId: syncRes.data.id });
          console.log(`[Utility] 🚀 Campaign triggered for ${phone}`);
        }
      } catch (e) { console.error('[Utility] Campaign Error:', e); }
    }

    return {
      handled: true,
      flowType: 'utility',
      response: `Gracias.\n\nCon esto evaluamos viabilidad funcional, no diseño ni narrativa.\nTu respuesta entra ahora a revisión arquitectónica.\n\nSi hay claridad suficiente:\n• Te indicaremos el siguiente paso técnico\n\nSi hay ambigüedad:\n• Te devolveremos el punto exacto donde colapsa el modelo\n\nNota: No todos los protocolos deben construirse aún.`,
      isCompleted: true,
      action: 'flow_completed'
    };
  }

  return {
    handled: true,
    flowType: 'utility',
    response: `Continuemos con el filtro... (Paso ${step})`
  };
}

// High Ticket Founders Flow (Landing: founders)
// High Ticket Founders Flow (Landing: founders - OPTIMIZED HIGH STATUS)
async function handleHighTicketFlow(message: string, step = 0, phone?: string): Promise<FlowResult> {
  const text = message.toLowerCase().trim();

  if (text.includes('cancelar') || text.includes('stop')) {
    return {
      handled: true,
      flowType: 'high_ticket',
      response: `Operación cancelada. Si cambias de opinión, envía "founders" para reiniciar.`
    };
  }

  // Step 0: Authority + Exclusivity Check
  // Message 0 sent: "Estás aplicando al Pandora Founders Inner Circle... ¿Seguimos?"
  // Waiting for: "Sí", "Vamos", "Ok"
  if (step === 0) {
    if (text.includes('sí') || text.includes('si') || text.includes('vamos') || text.includes('ok') || text.includes('dale')) {
      return {
        handled: true,
        flowType: 'high_ticket',
        response: `Perfecto.\n\nEn una frase:\n¿Qué tipo de proyecto estás construyendo y en qué etapa real está hoy?`,
        action: 'next_question'
      };
    } else {
      return {
        handled: true,
        flowType: 'high_ticket',
        response: `El Inner Circle requiere decisión rápida. Confirma si deseas continuar respondiendo "Sí".`,
        action: 'retry_step'
      };
    }
  }

  // Step 1: Context (Project Type & Stage) -> Ask Capital
  if (step === 1) {
    // Basic validation
    if (text.length < 3) {
      return {
        handled: true,
        flowType: 'high_ticket',
        response: `Por favor sé un poco más descriptivo sobre tu proyecto.`,
        action: 'retry_step'
      };
    }

    return {
      handled: true,
      flowType: 'high_ticket',
      response: `Gracias.\n\nPara ser directo: el Inner Circle existe para founders que ya juegan con capital propio o controlado, no para levantar desde cero.\n\n¿Qué rango de capital tienes disponible para ejecutar?\n\n1️⃣ $25k – $50k\n2️⃣ $50k – $100k\n3️⃣ $100k+`,
      action: 'next_question'
    };
  }

  // Step 2: Capital Answered -> Ask Timeline
  if (step === 2) {
    // If capital is too low or invalid, we could filter here, but we pass to Timeline for now to get full picture
    return {
      handled: true,
      flowType: 'high_ticket',
      response: `Última.\n\n¿En qué ventana estás tomando decisiones?\n\n1️⃣ Ejecutar este mes\n2️⃣ Ejecutar en ≤90 días\n3️⃣ Aún explorando`,
      action: 'next_question'
    };
  }

  // Step 3: Timeline Answered -> Qualification & Close
  if (step === 3) {
    // Logic: Fits if Timeline = 1 or 2 AND Capital was sufficient (assumed yes if they got here, or we check history if needed)
    // Simple filter: If currently saying "3" (Exploring), reject.
    if (text.includes('3') || text.includes('explora')) {
      return {
        handled: true,
        flowType: 'high_ticket',
        response: `Gracias por la claridad.\n\nEl Inner Circle no sería el vehículo correcto ahora mismo.\nTe recomiendo seguir desarrollando tracción y volver a aplicar cuando estés en fase de ejecución real.`,
        isCompleted: true,
        action: 'flow_completed' // Rejection
      };
    }

    // 🚀 MARKETING AUTOMATION: Founders Nurture
    if (phone) {
      try {
        const { MarketingEngine } = await import('@/lib/marketing/engine');
        
        // Sync/Update client as High Ticket lead
        const syncRes = await syncLeadAsClient({
          whatsapp: phone,
          source: 'founders_wa',
          package: 'founders_program',
          notes: 'Qualified High Ticket Founder via WA',
        });

        if (syncRes.success && syncRes.data) {
          await MarketingEngine.startCampaign('Founders Nurture', { leadId: syncRes.data.id });
          console.log(`[Founders] 🚀 Campaign triggered for ${phone}`);
        }
      } catch (e) { console.error('[Founders] Campaign Error:', e); }
    }

    return {
      handled: true,
      flowType: 'high_ticket',
      response: `Entendido.\n\nPor lo que veo, tu perfil sí encaja con el Inner Circle actual.\n\nEl siguiente paso no es una venta ni una llamada abierta.\nEs una Conversación de Capital para:\n• Validar encaje estratégico\n• Determinar si tiene sentido abrirte espacio\n\nAgenda aquí tu sesión:\n🔗 https://dash.pandoras.finance/schedule/protocol?type=capital\n\n_Nota: solo abrimos cupos cuando hay alineación clara._`,
      isCompleted: true,
      action: 'flow_completed'
    };
  }

  // Fallback
  return {
    handled: true,
    flowType: 'high_ticket',
    response: `Continuemos. (Paso ${step})`
  };
}

// Creator / Start Flow (Landing: start) - SOVEREIGNTY FILTER
async function handleCreatorFlow(message: string, step = 0, phone?: string): Promise<FlowResult> {
  const text = message.toLowerCase().trim();

  // Step 0: User sent "start" or similar -> We send Introduction
  if (step === 0) {
    return {
      handled: true,
      flowType: 'creator',
      response: `Estás entrando a Pandora’s.\n\nEsto no es una plataforma para crecer seguidores.\nEs infraestructura para creadores que no quieren alquilar su negocio.\n\nAntes de continuar, aclaremos algo.\n\nResponde **"Continuar"** para iniciar.`,
      action: 'next_question'
    };
  }

  // Step 1: User replied to "Continuar". We show Q1 (Identity)
  if (step === 1) {
    return {
      handled: true,
      flowType: 'creator',
      response: `¿Con cuál de estas frases te identificas más?\n\n1️⃣ Tengo audiencia, pero no control\n2️⃣ Monetizo, pero dependo de plataformas\n3️⃣ Quiero soberanía real, no hacks de crecimiento\n\nResponde 1, 2 o 3.`,
      action: 'next_question'
    };
  }

  // Step 2: User replied 1, 2, or 3. We show Q2 (Quiebre Mental)
  if (step === 2) {
    return {
      handled: true,
      flowType: 'creator',
      response: `Bien.\n\nLa mayoría de los creadores nunca pasan de ahí.\n\nFollowers ≠ Infraestructura\nLikes ≠ Valor\nEngagement ≠ Negocio\n\nPandora existe para convertir participación en propiedad.\n\nResponde "Entendido" para avanzar.`,
      action: 'next_question'
    };
  }

  // Step 3: User replied "Entendido". We show Q3 (Enrutamiento)
  if (step === 3) {
    return {
      handled: true,
      flowType: 'creator',
      response: `Ahora dime:\n\n¿Qué quieres construir primero?\n\n1️⃣ Membresía soberana (acceso / lealtad)\n2️⃣ Incentivar trabajo real (Work-to-Earn)\n3️⃣ Aún no lo tengo claro\n\nResponde con el número.`,
      action: 'next_question'
    };
  }

  // Step 4: User replied 1, 2, or 3. Routing + Campaign
  if (step === 4) {
    // 🚀 MARKETING AUTOMATION: Start Creator Nurture
    if (phone) {
      try {
        const { MarketingEngine } = await import('@/lib/marketing/engine');
        
        // Sync Lead
        const syncRes = await syncLeadAsClient({
          whatsapp: phone,
          source: 'creator_filter_wa',
          name: 'Creator Sovereign',
          notes: 'Completed Start/Creator sovereignty filter',
        });

        if (syncRes.success && syncRes.data) {
          await MarketingEngine.startCampaign('Start Creator Nurture', { leadId: syncRes.data.id });
          console.log(`[Creator] 🚀 Campaign triggered for ${phone}`);
        }
      } catch (e) { console.error('[Creator] Campaign Error:', e); }
    }

    if (text.includes('1') || text.includes('2')) {
      // Route to Utility
      return {
        handled: true,
        flowType: 'creator',
        response: `Perfecto.\n\nEl siguiente paso no es venderte nada.\nEs confirmar que tu utilidad existe antes de lanzar.\n\nEstás siendo redirigido al Filtro de Arquitectos...\n\n(Escribe "Utility" para confirmar)`,
        action: 'redirect_utility_suggestion'
      };
    }

    // Option 3 or Fallback
    return {
      handled: true,
      flowType: 'creator',
      response: `Entendido.\n\nTus respuestas han sido registradas.\n\nEl siguiente paso es educación estratégica sobre soberanía.\nTe enviaremos los principios por correo.\n\nCuando tengas claro qué construir, escribe "Utility" para iniciar el diseño técnico.`,
      isCompleted: true,
      action: 'flow_completed'
    };
  }

  return { handled: true, flowType: 'creator', response: `Continuemos... (Paso ${step})` };
}

// Deprecated Stub - Redirect to Creator Flow
async function handleEightQFlow(message: string, step = 0): Promise<FlowResult> {
  return {
    handled: true,
    flowType: 'creator',
    response: `(Iniciando flujo de diagnóstico...)`,
    action: 'redirect_creator'
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
async function handleHumanFlow(phone: string, message = '', step = 0): Promise<FlowResult> {
  const text = message.toLowerCase().trim();
  // Send notification to Discord/Email
  await notifyHumanAgent(phone, message || 'Usuario solicita hablar con humano');

  // NOTIFICAR SI ES START
  if (step === 0 && !text.includes('gracias')) {
    try {
      notifySupportRequest(phone, text, 'Human Flow Requested');
    } catch (e) { console.error(e); }
  }

  return {
    handled: true,
    flowType: 'human',
    response: step === 0
      ? `👨‍💻 Un agente humano ha sido notificado. Te responderemos en breve.\n\nPuedes escribir tu consulta ahora mismo:`
      : `👨‍💼 **Escalado a Agente Humano**\n\nGracias por escribirnos. Un agente especializado te contactará en las próximas 2-4 horas.\n\n📧 **Confirmación:** Recibirás un email de confirmación.\n📞 **Urgente:** Si es urgente, llama a +52 1 332 213 7498`,
    action: 'human_escalated'
  };
}

// Protocol Application Flow (Automated Follow-up - OPTIMIZED CLOSING)
async function handleProtocolApplicationFlow(message: string, step = 0, phone?: string): Promise<FlowResult> {
  const text = message.toLowerCase().trim();

  // Step 0: Welcome & Permission (Triggered manually or via initial hook)
  // Message 0 sent: "Recibí tu aplicación... ¿Seguimos?"
  // Waiting for: "Sí", "Vamos", "Ok"
  if (step === 0) {
    // If we are entering this function, it means we are usually handling a reply.
    // However, in the updated flow, the system sends the first message. 
    // We assume step 0 is the state WAITING for the user to confirm "Seguimos".
    if (text.includes('sí') || text.includes('si') || text.includes('vamos') || text.includes('ok') || text.includes('dale')) {
      return {
        handled: true,
        flowType: 'protocol_application',
        response: `Perfecto.\n\n¿En qué estado real está tu proyecto hoy?\n\n1️⃣ Tengo comunidad / activos y quiero lanzar en ≤30 días\n2️⃣ Tengo idea validada pero necesito estructurar ejecución\n3️⃣ Solo estoy explorando opciones\n\n_Responde con el número (1, 2 o 3)._`,
        action: 'next_question'
      };
    } else {
      // Nudge if they don't confirm
      return {
        handled: true,
        flowType: 'protocol_application',
        response: `Antes de avanzar, necesito confirmar si estás listo para evaluar la ejecución.\n\n¿Seguimos? (Responde "Sí" para continuar)`,
        action: 'retry_step'
      };
    }
  }

  // Step 1: Reality Check Answered (1, 2, or 3)
  // Waiting for Qualification
  if (step === 1) {
    // Filter: If 3 (Exploring), we might downsell or pause.
    if (text.includes('3') || text.includes('explora')) {
      return {
        handled: true,
        flowType: 'protocol_application',
        response: `Entendido. Pandora está optimizado para ejecución inmediata.\n\nTe recomiendo revisar nuestros recursos gratuitos en la web y volver cuando estés listo para lanzar.\n\nCierro el proceso por ahora. Saludos.`,
        isCompleted: true,
        action: 'flow_completed' // Soft rejection / specific bucket
      };
    }

    // If 1 or 2, proceed to Budget (Framed)
    return {
      handled: true,
      flowType: 'protocol_application',
      response: `Gracias.\n\nPara ser transparente: Pandora no es experimental ni low-cost. Trabajamos solo con proyectos que pueden ejecutar sin fricción financiera.\n\n¿Qué rango tienes asignado para infraestructura + ejecución inicial?\n\n1️⃣ $7k–$15k\n2️⃣ $15k–$35k\n3️⃣ $35k+\n\n_Tu respuesta es confidencial._`,
      action: 'next_question'
    };
  }

  // Step 2: Budget Answered -> Scheduling
  if (step === 2) {
    // Map budget for context (could be saved to DB)
    let budgetLevel = 'Standard';
    if (text.includes('1') || text.includes('7k')) budgetLevel = 'Starter';
    if (text.includes('2') || text.includes('15k')) budgetLevel = 'Pro';
    if (text.includes('3') || text.includes('35k')) budgetLevel = 'Enterprise';

    // 🚀 MARKETING AUTOMATION: Start Hot Leads Campaign
    if (phone) {
      try {
        const { MarketingEngine } = await import('@/lib/marketing/engine');
        
        // Sync Lead
        const syncRes = await syncLeadAsClient({
          whatsapp: phone,
          source: 'protocol_app_wa',
          notes: `Protocol Application - Budget: ${budgetLevel}`,
          metadata: { budgetLevel }
        });

        if (syncRes.success && syncRes.data) {
          console.log(`[Protocol App] 🎯 Starting Hot Leads campaign for lead ${syncRes.data.id}`);
          await MarketingEngine.startCampaign('ApplyProtocol Hot Leads', { leadId: syncRes.data.id });
        } else {
          console.warn(`[Protocol App] ⚠️ Could not sync lead for phone ${phone}, cannot start campaign`);
        }
      } catch (error) {
        console.error('[Protocol App] ❌ Failed to start marketing campaign:', error);
      }
    }

    return {
      handled: true,
      flowType: 'protocol_application',
      response: `Perfecto.\nPor lo que veo, tu perfil sí encaja con los protocolos que estamos lanzando ahora.\n\nEl siguiente paso es una llamada estratégica de 15 minutos para:\n• Confirmar viabilidad real\n• Definir si entramos en ejecución\n• Ver qué modelo aplica\n\nAgenda aquí:\n🔗 https://dash.pandoras.finance/schedule/protocol?type=strategy\n\nSi no ves horario, responde 'AGENDAR'.`,
      isCompleted: true,
      action: 'flow_completed'
    };
  }

  // Post-completion / Fallback (Manual Agenda)
  if (step >= 3) {
    if (text.includes('agendar')) {
      try {
        notifySupportRequest(message, 'User requested manual scheduling (Protocol Flow)', 'Protocol Application - Scheduling');
      } catch (e) { /* ignore */ }

      return {
        handled: true,
        flowType: 'protocol_application',
        response: `Perfecto. Te escribo personalmente para coordinar.\n\n_Nota: estamos cerrando agenda de esta semana, así que priorizo hoy._`,
        action: 'human_escalated'
      };
    }
    return {
      handled: true,
      flowType: 'protocol_application',
      response: `Ya tenemos tu aplicación en proces. Si necesitas soporte urgente, escribe "support".`
    };
  }

  return {
    handled: true,
    flowType: 'protocol_application',
    response: 'Por favor selecciona una de las opciones anteriores.'
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

  // SPECIFIC FLOWS - HIGH PRIORITY
  if (text.includes('8 preguntas') || text.includes('evaluación') || text.includes('evaluacion') || text.match(/iniciar.*evaluaci[óo]n/)) {
    return 'eight_q';
  }

  if (text.includes('soporte') || text.includes('ayuda') || text.includes('problema')) {
    return 'support';
  }

  if (text.includes('humano') || text.includes('agente') || text.includes('persona')) {
    return 'human';
  }

  if (text.includes('founder') || text.includes('capital') || text.includes('inversión')) {
    return 'high_ticket';
  }

  // GENERIC FLOWS - LOW PRIORITY
  if (text.includes('protocolo') || text.includes('utilidad') || text.includes('crear') || text.includes('utility')) {
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
  const messageType = 'text';
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
      // Define deep link messages that should trigger a switch
      const deepLinkMessages = {
        'hola, soy founder y quiero aplicar al programa founders de pandora\'s. tengo capital disponible.': 'high_ticket',
        'hola, quiero iniciar mi evaluación de 8 preguntas': 'eight_q',
        'estoy interesado en crear un utility protocol funcional': 'utility',
        'necesito ayuda técnica con mi proyecto': 'support',
        'quiero hablar con un agente humano': 'human'
      };

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

      const lowerText = messageText.toLowerCase().trim();

      // Check for deep links exact match first
      let requestedSwitch = deepLinkMessages[lowerText as keyof typeof deepLinkMessages];

      // Then check for short commands exact match
      if (!requestedSwitch) {
        const foundCommand = Object.keys(flowSwitchCommands).find(cmd => lowerText === cmd);
        if (foundCommand) {
          requestedSwitch = flowSwitchCommands[foundCommand as keyof typeof flowSwitchCommands];
        }
      }

      // If user wants to switch flows, do it immediately
      if (requestedSwitch && flowSwitchCommands[requestedSwitch as keyof typeof flowSwitchCommands] !== existingFlow) {
        const newFlow = flowSwitchCommands[requestedSwitch as keyof typeof flowSwitchCommands];
        console.log(`🔄 [FLOW-SWITCH] Usuario ${phone} cambiando de ${existingFlow} a ${newFlow}`);

        // 1. Desactivar sesión actual evitando colisiones
        await sql`
          UPDATE whatsapp_sessions 
          SET is_active = false, updated_at = now()
          WHERE user_id = (SELECT id FROM whatsapp_users WHERE phone = ${phone})
            AND is_active = true
        `;

        // 2. Activar/Crear sesión del nuevo flujo
        await sql`
          INSERT INTO whatsapp_sessions (user_id, flow_type, state, current_step, is_active)
          SELECT id, ${newFlow}, '{}'::jsonb, 0, true
          FROM whatsapp_users WHERE phone = ${phone}
          ON CONFLICT (user_id, flow_type)
          DO UPDATE SET is_active = true, current_step = 0, state = '{}'::jsonb, updated_at = now()
        `;

        // Handle the message with the new flow
        switch (newFlow) {
          case 'utility':
            result = await handleUtilityFlow(messageText, 0, phone);
            break;
          case 'high_ticket':
            result = await handleHighTicketFlow(messageText, 0, phone);
            break;
          case 'creator':
            result = await handleCreatorFlow(messageText, 0, phone);
            if (result.action === 'redirect_utility_suggestion') {
              // Auto-switch to utility
              await sql`UPDATE whatsapp_sessions SET flow_type = 'utility', current_step = 0 WHERE user_id = (SELECT id FROM whatsapp_users WHERE phone = ${phone}) AND is_active = true`;
              // Immediately start Utility step 0
              result = await handleUtilityFlow("start_from_creator", 0, phone);
              result.response = `🔄 **Redirigiendo al Filtro Técnico...**\n\n${result.response}`;
            } else if (result.action === 'next_question') {
              await updateFlowStep(phone, 1);
            } else if (result.action === 'flow_completed') {
              await updateFlowStep(phone, 5); // Mark done
            }
            break;
          case 'eight_q':
            // Redirect legacy 8q to Creator flow now? Or Utility?
            // User instruction was 8q -> Utility manually, but 'start' -> Creator.
            // Let's map 'start' to 'creator' in detection logic below.
            // If someone is stuck in 8q, we can switch them to creator.
            result = await handleCreatorFlow(messageText, 0, phone); // Treat as new creator flow entry
            await sql`UPDATE whatsapp_sessions SET flow_type = 'creator', current_step = 0 WHERE user_id = (SELECT id FROM whatsapp_users WHERE phone = ${phone}) AND is_active = true`;
            break;
          case 'support':
            result = handleSupportFlow(messageText);
            break;
          case 'human':
            result = await handleHumanFlow(phone, messageText);
            break;

          case 'protocol_application':
            result = await handleProtocolApplicationFlow(messageText, currentState.step, phone);
            if (result.action === 'next_question') {
              await updateFlowStep(phone, 2);
            } else if (result.action === 'flow_completed') {
              await updateFlowStep(phone, 3);
            }
            break;
          default:
            result = await handleEightQFlow(messageText, 0);
        }

        result.response = `🔄 **Cambiando a ${newFlow.replace('_', ' ').toUpperCase()}**\n\n${result.response || ''}`;
      } else {
        // PROCESS EXISTING FLOW NORMALLY
        switch (existingFlow) {
          case 'utility':
            result = await handleUtilityFlow(messageText, currentState.step, phone);
            if (result.action === 'next_question') {
              const next = currentState.step + 1;
              await updateFlowStep(phone, next);
            } else if (result.action === 'flow_completed') {
              await updateFlowStep(phone, 4);
            }
            break;
          case 'high_ticket':
            result = await handleHighTicketFlow(messageText, currentState.step, phone);

            // Only advance if input was valid (next_question)
            if (result.action === 'next_question' && currentState.step < 3) {
              const nextStep = currentState.step + 1;
              await updateFlowStep(phone, nextStep);
            }
            if (result.isCompleted) {
              await updateFlowStep(phone, 3); // Mark as max step
            }
            break;
          case 'eight_q':
            console.log(`🔍 [EIGHT_Q] Processing message for step ${currentState.step}: "${messageText}"`);
            result = await handleEightQFlow(messageText, currentState.step);
            console.log(`📈 [EIGHT_Q] Result: action=${result.action}, progress=${result.progress}`);

            if (result.action === 'next_question') {
              const nextStep = currentState.step + 1;
              console.log(`📊 [EIGHT_Q] Updating step from ${currentState.step} to ${nextStep}`);
              await updateFlowStep(phone, nextStep);
            } else if (result.isCompleted) {
              await updateFlowStep(phone, 8); // Mark as completed
            }
            break;
          case 'support':
            result = handleSupportFlow(messageText);
            break;
          case 'human':
            result = await handleHumanFlow(phone, messageText);
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
    console.log(`🆕 [SIMPLE-ROUTER] Nuevo usuario ${phone} → Asignando flujo: "${detectedFlow}" (Basado en keywords/landing)`);

    // Asignar flujo
    await assignFlow(phone, detectedFlow, payload.contactName || null);

    // Sync WhatsApp lead to clients table for admin visibility
    try {
      await syncLeadAsClient({
        whatsapp: phone,
        name: payload.contactName || undefined,
        source: `wa_${detectedFlow}`,
        metadata: { flowType: detectedFlow, firstMessage: messageText.substring(0, 200) }
      });
    } catch (syncErr) {
      console.warn('[SIMPLE-ROUTER] syncLeadAsClient failed (non-blocking):', syncErr);
    }

    // Procesar mensaje inicial
    let result: FlowResult;
    switch (detectedFlow) {
      case 'utility':
        result = await handleUtilityFlow(messageText);
        break;
      case 'high_ticket':
        result = await handleHighTicketFlow(messageText, 0);
        break;
      case 'eight_q':
        result = await handleEightQFlow(messageText, 0);
        break;
      case 'support':
        result = handleSupportFlow(messageText);
        break;
      case 'human':
        result = await handleHumanFlow(phone, messageText);
        break;
      case 'protocol_application':
        result = await handleProtocolApplicationFlow(messageText, 1, phone);
        break;
      default:
        result = await handleEightQFlow(messageText, 0);
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
