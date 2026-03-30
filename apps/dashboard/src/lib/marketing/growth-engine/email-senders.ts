import { resend, FROM_EMAIL } from '@/lib/resend';
import ExploreStep1Email from '@/emails/explore/step1';
import InvestStep1Email from '@/emails/invest/step1';
import B2BWelcomeEmail from '@/emails/b2b-welcome';
import B2BFollowupEmail from '@/emails/b2b-followup';
import B2BCallReminderEmail from '@/emails/b2b-call-reminder';
import B2BBookingConfirmedEmail from '@/emails/b2b-booking-confirmed';
import B2BNoShowRecoveryEmail from '@/emails/b2b-no-show-recovery';
import WaitlistEmail from '@/emails/WaitlistEmail';
import ProjectEducationalEmail from '@/emails/educational-nurture';

import { EngagementLevel } from './types';

export async function sendWaitlistSequenceEmail(context: {
  to: string;
  step: 1 | 2 | 3 | 4;
  projectName?: string;
  projectSlug?: string;
  brandHeader?: string;
  engagementLevel?: EngagementLevel;
}) {
  const projectName = context.projectName || "Pandora";
  console.log(`[Growth Engine] Sending Waitlist Email (Step ${context.step}) for ${projectName} to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  // Determine the Copy based on the project context
  const isNarai = context.brandHeader?.toLowerCase().includes('narai');
  const isPandora = context.projectName?.toLowerCase().includes('pandora');
  const isGrowthOs = context.projectName?.toLowerCase().includes('growth os');
  const niche = isNarai ? 'real_estate' : (isGrowthOs ? 'growth_os' : (isPandora ? 'tech_startup' : 'other'));
  const intent = context.engagementLevel || 'mid';
  
  const NICHE_COPIES: Record<string, Record<string, Record<number, { subject: string, body: string, ctaText?: string }>>> = {
    'real_estate': {
      'high': {
        1: { subject: "Narai: Tu acceso prioritario.", body: "Detectamos tu interés de alto nivel.\n\nNo estamos perdiendo tiempo. La plusvalía no espera.\n\nTu perfil califica para las primeras unidades.\n\nMantente atento, esto se moverá rápido.", ctaText: "VER MARKET DE NARAI" },
        2: { subject: "El activo real, digitalizado.", body: "Mientras otros analizan, los que saben están tomando posición.\n\nNarai es la digitalización de la confianza.\n\nEstamos listos para habilitar tu acceso.", ctaText: "ADQUIRIR ARTEFACTO NARAI" },
        3: { subject: "Decisión Narai.", body: "Las ventanas de oportunidad en Bienes Raíces son cortas.\n\nSi estás viendo esto, es porque sigues en el filtro superior.\n\nSolo un paso más.", ctaText: "INGRESAR AL PROTOCOLO" },
        4: { 
          subject: "Iniciación Narai: Tu acceso está listo.", 
          body: "El tiempo de espera terminó.\n\nTodo está listo para tu entrada oficial a Narai.\n\nRecuerda: Tu billetera (wallet) será tu identidad criptográfica. No hay usuarios ni contraseñas, solo verificación en cadena.\n\nSi no te conectas pronto, tu lugar será reasignado al siguiente en la fila.", 
          ctaText: "ADQUIRIR ACCESO DEFINITIVO" 
        }
      },
      'mid': {
        1: { subject: "Bienvenido al Ecosistema Narai.", body: "Recibimos tu solicitud.\n\nNarai fusiona la seguridad del ladrillo con la liquidez de la red.\n\nEn los próximos días entenderás por qué somos diferentes.", ctaText: "VER MARKET DE NARAI" },
        2: { subject: "Construyendo sobre roca.", body: "La mayoría busca retornos rápidos. Nosotros buscamos retornos sólidos.\n\nEl activo real es la base de todo lo que hacemos.\n\nSeguimos evaluando tu perfil.", ctaText: "VER ARTEFACTOS DISPONIBLES" },
        3: { subject: "Tu futuro en Narai.", body: "Estamos curando cada acceso.\n\nNo es masivo. Es exclusivo.\n\nPronto tendrás noticias definitivas.", ctaText: "ADQUIRIR ARTEFACTO (FASE 1)" },
        4: { 
          subject: "Iniciación Narai: Tu acceso está listo.", 
          body: "Tu perfil ha sido aprobado.\n\nTodo está listo para tu entrada oficial a Narai.\n\nRecuerda: Tu billetera será tu identidad criptográfica definitiva.\n\nSi no te presentas pronto, tu lugar será reasignado.", 
          ctaText: "INGRESAR AL PROTOCOLO" 
        }
      }
    },
    'tech_startup': {
      'high': {
        1: { subject: "Ritual de Acceso: Fase I — Iniciación", body: "Vemos que estás listo para construir.\n\nLa infraestructura descentralizada no espera a nadie.\n\nEl sistema ha detectado tu señal y te ha asignado una vía de validación prioritaria.\n\nMantén tu llave lista." },
        2: { subject: "Fase II: El Registro en Sombra", body: "Estamos desplegando el OS para la nueva economía.\n\nTu perfil ha sido marcado para el Genesis Drop.\n\nNo estamos buscando usuarios, buscamos nodos fundadores." },
        3: { subject: "Fase III: Validación por Proximidad", body: "Estás a un paso de la Llave Maestra.\n\nLa red te reconoce y el filtro se estrecha.\n\nPrepárate para la activación final." },
        4: { 
          subject: "Fase IV: El Despertar de la Llave", 
          body: "Has pasado el filtro final.\n\nLa red de Pandora ha autorizado la creación de tu clave de acceso definitiva.\n\nA partir de este momento, tu identidad criptográfica es tu único rastro en el ecosistema.\n\nTu ventana de vinculación ha comenzado. Reclama tu lugar antes de que las compuertas se cierren.", 
          ctaText: "INICIAR RITUAL DE IDENTIDAD" 
        }
      },
      'mid': {
        1: { subject: "Tu solicitud a Pandora OS.", body: "Recibimos tu interés.\n\nEstamos construyendo la infraestructura de la libertad financiera.\n\nEl sistema está evaluando tu perfil dentro de la cola de acceso restringido.\n\nTe mantendremos al tanto de la evolución." },
        2: { subject: "El Nuevo Standard OS.", body: "Pandora no es una app. Es un sistema operativo para activos digitales.\n\nEstamos seleccionando a los primeros testers para la fase Beta.\n\nTu rastro digital sigue en proceso de validación." },
        3: { subject: "Filtro de Red.", body: "La red se fortalece con cada nodo.\n\nEstamos verificando tu elegibilidad para el acceso temprano.\n\nEn los próximos días recibirás la señal definitiva." },
        4: { 
          subject: "Protocolo de Iniciación: Ingresa ahora.", 
          body: "Has sido seleccionado para la prueba estructural.\n\nLa red de Pandora ha autorizado tu clave de acceso.\n\nTu ventana de vinculación digital está disponible.", 
          ctaText: "INICIAR RITUAL DE ACCESO" 
        }
      }
    },
    'growth_os': {
      'high': {
        1: { subject: "Growth OS: Acceso Institutional.", body: "Detectamos un perfil de alta convicción.\n\nEstás en la cola de despliegue prioritario para el Sistema Operativo de Adquisición.\n\nLa ventaja es el tiempo." },
        2: { subject: "Escalando con IA Determinística.", body: "El Growth OS está analizando tu ecosistema.\n\nEstamos listos para activar tu capa de cierre automático.\n\nSolo para partners seleccionados." },
        3: { subject: "Protocolo de Cierre Activado.", body: "Tu instancia está lista.\n\nEl acceso Genesis al Growth OS es para quienes entienden que la infraestructura es el activo.\n\nEntra ahora." },
        4: { 
          subject: "Growth OS: Despliegue Autorizado.", 
          body: "El motor está listo para tu integración.\n\nTu instancia institucional del Growth OS te espera.\n\nConecta tu identidad cripto para firmar el acceso a tu dashboard de conversión y activar la infraestructura.\n\nEl protocolo se bloqueará en 24 horas si no hay actividad.", 
          ctaText: "ACTIVAR GROWTH OS" 
        }
      },
      'mid': {
        1: { subject: "Bienvenido al Growth OS.", body: "Has tomado el primer paso hacia la adquisición autónoma.\n\nEstamos validando tu proyecto para la integración del motor de cierre.\n\nRecibirás detalles técnicos pronto." },
        2: { subject: "La Capa de Inteligencia.", body: "El Growth OS no es un CRM. Es un cerebro de conversión.\n\nEstamos preparando tu brief de integración.\n\nSiguiente paso: Activación." },
        3: { subject: "Validación de Nodo Growth.", body: "Seguimos evaluando tu perfil.\n\nLa red de partners de Growth OS es limitada.\n\nTe notificaremos si eres seleccionado." },
        4: { 
          subject: "Growth OS: Activación Autorizada.", 
          body: "Has sido verificado.\n\nTu instancia core del Growth OS te espera.\n\nConecta tu identidad cripto para firmar tu contrato digital y encender tu dashboard.", 
          ctaText: "ACTIVAR GROWTH OS" 
        }
      }
    }
  };

  // Fallback Logic
  const nicheMap = NICHE_COPIES[niche] || NICHE_COPIES['tech_startup'];
  const intentMap = nicheMap?.[intent === 'critical' ? 'high' : (intent === 'low' ? 'mid' : intent)] || nicheMap?.['mid'];
  const emailData = intentMap?.[context.step] || {
    subject: `Actualización de Acceso: Paso ${context.step}`,
    body: "Seguimos procesando tu solicitud de acceso al ecosistema.\n\nRecibirás una confirmación en las próximas horas."
  };

  // Determine dynamic CTA URL based on project/niche
  const isCoreRitual = niche === 'tech_startup' || niche === 'growth_os';
  const resolvedCtaUrl = isCoreRitual 
    ? "https://dash.pandoras.finance/access" 
    : `https://dash.pandoras.finance/projects/${context.projectSlug || 'default'}`;

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject: emailData.subject,
      react: WaitlistEmail({ 
        subject: emailData.subject,
        body: emailData.body,
        step: context.step,
        projectName: projectName,
        brandHeader: context.brandHeader || `${projectName.toUpperCase()} // PROTOCOLO DE ESPERA`,
        ctaText: ('ctaText' in emailData) ? emailData.ctaText as string | undefined : undefined,
        ctaUrl: resolvedCtaUrl
      }) as React.ReactElement,
    });
    console.error(`[Resend Engine] ✅ Success (Step ${context.step}):`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Resend Engine] ❌ Failure (Step ${context.step}):`, error);
    throw error;
  }
}

export async function sendGenesisWelcomeEmail(context: {
  to: string;
  projectName?: string;
  brandHeader?: string;
}) {
  const projectName = context.projectName || "Pandora";
  console.log(`[Growth Engine] Sending Genesis Welcome Email for ${projectName} to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  const isNarai = projectName.toLowerCase().includes('narai');
  const subject = isNarai ? "Estás dentro de Narai." : "Estás dentro antes que el resto.";
  const body = isNarai
    ? "Entraste en la primera ventana de Narai.\n\nNo es casualidad.\n\nLos primeros no solo entran antes,\nentran en mejores condiciones.\n\nTu acceso ya está activo.\n\nLo que hagas con esto… importa.\n\n— Narai"
    : "Entraste en la primera ventana.\n\nNo es casualidad.\n\nLos primeros no solo entran antes,\nentran en mejores condiciones.\n\nTu acceso ya está activo.\n\nLo que hagas con esto… importa.\n\n— Pandora";

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject,
      react: WaitlistEmail({ 
        subject,
        body,
        step: "GENESIS",
        projectName: projectName,
        brandHeader: context.brandHeader
      }),
    });
    console.log(`[Growth Engine] Resend Success (Genesis Welcome):`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (Genesis Welcome):`, error);
    throw error;
  }
}

export async function sendB2BFollowupEmail(context: {
  to: string;
  projectName: string;
}) {
  console.log(`[Growth Engine] Sending B2B Followup Email to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject: `¿Seguimos adelante con ${context.projectName}?`,
      react: B2BFollowupEmail({ 
        projectName: context.projectName,
      }),
    });
    console.log(`[Growth Engine] Resend Success (B2B Followup):`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (B2B Followup):`, error);
    throw error;
  }
}

export async function sendB2BWelcomeEmail(context: {
  to: string;
  projectName: string;
  source: string;
  subType: string;
}) {
  console.log(`[Growth Engine] Sending B2B Welcome Email to ${context.to} (source: ${context.source})`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  // Personalization Logic
  let ctaText = "Agendar Llamada Estratégica";
  let ctaUrl = "https://calendly.com/pandoras-finance/strategy";

  if (context.source === 'growth-os-landing') {
    ctaText = "Agendar Auditoría de Infraestructura";
    ctaUrl = "https://calendly.com/pandoras-finance/growth-audit";
  } else if (context.subType === 'protocol_application_form') {
    ctaText = "Agendar Sesión de Despliegue";
    ctaUrl = "https://calendly.com/pandoras-finance/protocol-deployment";
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject: `Confirmación de Solicitud: ${context.projectName}`,
      react: B2BWelcomeEmail({ 
        projectName: context.projectName,
        source: context.source,
        ctaText,
        ctaUrl
      }),
    });
    console.log(`[Growth Engine] Resend Success (B2B Welcome):`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (B2B Welcome):`, error);
    throw error;
  }
}

export async function sendExploreWelcomeEmail(context: {
  to: string;
  projectName: string;
  differentiator: string;
  projectSlug?: string;
  baseUrl?: string;
}) {
  console.log(`[Growth Engine] Sending Explore Step 1 Email to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing in production environment');
      }
      console.warn('[Growth Engine] RESEND_API_KEY not configured. Mocking email send.');
      return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject: `Acceso rápido: Entendiendo ${context.projectName}`,
      react: ExploreStep1Email({ 
        projectName: context.projectName,
        differentiator: context.differentiator,
        projectSlug: context.projectSlug,
        baseUrl: context.baseUrl
      }),
    });
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (Explore Step 1):`, error);
    throw error;
  }
}

export async function sendInvestWelcomeEmail(context: {
  to: string;
  projectName: string;
  projectSlug?: string;
  baseUrl?: string;
}) {
  console.log(`[Growth Engine] Sending Invest Step 1 Email to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing in production environment');
      }
      console.warn('[Growth Engine] RESEND_API_KEY not configured. Mocking email send.');
      return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject: `Tu interés en ${context.projectName} - Siguientes Pasos`,
      react: InvestStep1Email({ 
        projectName: context.projectName,
        projectSlug: context.projectSlug,
        baseUrl: context.baseUrl
      }),
    });
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (Invest Step 1):`, error);
    throw error;
  }
}

export async function sendCallReminderEmail(context: {
  to: string;
  name: string;
  meetingDate: string;
  meetingTime: string;
  type: 'D-3' | 'D-1' | 'D-0';
}) {
  console.log(`[Growth Engine] Sending Call Reminder (${context.type}) to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject: context.type === 'D-0' ? "¡Hoy nos vemos!" : `Recordatorio de sesión: ${context.meetingDate}`,
      react: B2BCallReminderEmail({ 
        name: context.name,
        meetingDate: context.meetingDate,
        meetingTime: context.meetingTime,
        type: context.type,
      }),
    });
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (Call Reminder ${context.type}):`, error);
    throw error;
  }
}

export async function sendBookingConfirmedEmail(context: {
  to: string;
  name: string;
  meetingDate: string;
  meetingTime: string;
}) {
  console.log(`[Growth Engine] Sending Booking Confirmation to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject: "Sesión confirmada: Preparemos tu protocolo",
      react: B2BBookingConfirmedEmail({ 
        name: context.name,
        meetingDate: context.meetingDate,
        meetingTime: context.meetingTime,
      }),
    });
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (Booking Confirmation):`, error);
    throw error;
  }
}

export async function sendNoShowRecoveryEmail(context: {
  to: string;
  name: string;
}) {
  console.log(`[Growth Engine] Sending No-Show Recovery to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject: "Te extrañamos en la sesión - ¿Agendamos de nuevo?",
      react: B2BNoShowRecoveryEmail({ 
        name: context.name,
        rescheduleUrl: "https://dash.pandoras.finance/schedule/founders"
      }),
    });
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (No-Show Recovery):`, error);
    throw error;
  }
}

export async function sendEducationalNurtureEmail(context: {
  to: string;
  name: string;
  projectName: string;
  courseUrl: string;
}) {
  console.log(`[Growth Engine] Sending Educational Nurture Email to ${context.to} for ${context.projectName}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject: `Paso siguiente: Tu Masterclass de ${context.projectName} está lista`,
      react: ProjectEducationalEmail({ 
        name: context.name,
        projectName: context.projectName,
        courseUrl: context.courseUrl
      }),
    });
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (Educational Nurture):`, error);
    throw error;
  }
}
