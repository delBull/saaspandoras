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
        1: { subject: "Narai: Activos Reales, Control Digital.", body: "Bienvenido al ecosistema Narai.\n\nHas sido seleccionado para evaluar proyectos inmobiliarios fraccionados de alto rendimiento.\n\nEn los próximos días recibirás tu invitación formal para reclamar tu Identidad Narai.", ctaText: "EXPLORAR ECOSISTEMA" },
        2: { subject: "Narai Ritual: Fase de Validación.", body: "La plusvalía digital se construye sobre activos físicos.\n\nPara participar en la gobernanza de Narai y obtener recompensas, necesitarás conectar tu perfil en Pandoras Finance.\n\nEstamos preparando tu slot de acceso.", ctaText: "VER ESTADO DE VALIDACIÓN" },
        3: { subject: "Artefactos y Utilidad Narai.", body: "En Narai, tu participación se traduce en 'Artefactos' (Licencias y Certificados).\n\nEstos no son solo documentos, son llaves operativas que calculan tus recompensas directas y tu poder de voto en decisiones del protocolo.\n\nTu acceso está casi listo.", ctaText: "SABER MÁS SOBRE ARTEFACTOS" },
        4: { 
          subject: "Acceso Narai: Tu Pasaporte está listo.", 
          body: "Todo está listo para tu entrada oficial.\n\nSigue estos pasos para activar tu utilidad:\n1. Haz Login en Pandoras Finance.\n2. Reclama tu 'Entry Pass' gratuito de Narai.\n3. Participa en actividades para obtener tus primeros 'Artefactos'.\n\nTu billetera es tu llave. Si tardas demasiado, el sistema reasignará tu lugar.", 
          ctaText: "ACTIVAR MI ACCESO" 
        }
      },
      'mid': {
        1: { subject: "Bienvenido a Narai.", body: "Recibimos tu interés en la tokenización inmobiliaria.\n\nNarai es el puente entre la seguridad física y la liquidez digital.\n\nEstamos evaluando tu perfil para el siguiente drop de accesos.", ctaText: "VER NARAI" },
        2: { subject: "Bases Sólidas en Narai.", body: "Mientras el mercado especula, nosotros construimos sobre activos reales.\n\nPronto aprenderás cómo obtener tu Pase de Entrada para participar en las decisiones del ecosistema.", ctaText: "VER PORTAL" },
        3: { subject: "Tu futuro en la Red Narai.", body: "La participación activa es premiada con Licencias de Operación.\n\nEstos artefactos te dan acceso a rendimientos preferenciales.\n\nEspera la señal final.", ctaText: "REVISAR CUOTA" },
        4: { 
          subject: "Iniciación Narai: Acceso Confirmado.", 
          body: "Has sido aprobado.\n\nIngresa ahora para obtener tu pase gratuito de Narai.\n\nEste pase te permite generar los Artefactos necesarios para reclamar recompensas y participar en la gobernanza.", 
          ctaText: "INGRESAR AL PORTAL" 
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
        1: { subject: "Growth OS: Tu infraestructura está en cola.", body: "Hemos detectado un perfil de alto desempeño.\n\nEstás en la lista de prioritaria para el despliegue del Sistema Operativo de Adquisición.\n\nEl tiempo es el único activo que no se recupera, estamos agilizando tu proceso." },
        2: { subject: "IA Determinística para tu Ecosistema.", body: "El motor de Growth OS está analizando tu modelo de negocio.\n\nEstamos preparando tu capa de cierre automático de leads.\n\nSolo abrimos estas instancias para partners con visión de escala." },
        3: { subject: "Sistema de Cierre: Listo para Activar.", body: "Tu instancia personalizada está preparada.\n\nEl acceso Genesis al Growth OS es para quienes entienden que la infraestructura técnica es la base del crecimiento.\n\nTu dashboard te espera." },
        4: { 
          subject: "Growth OS: Despliegue de Instancia Autorizado.", 
          body: "El motor de conversión está listo para integrarse a tu flujo.\n\nConecta tu Wallet para firmar el acceso a tu dashboard y activar la infraestructura.\n\nA través de este acceso podrás obtener Artefactos de Certificación que validan tu capacidad de cierre.", 
          ctaText: "ACTIVAR GROWTH OS" 
        }
      },
      'mid': {
        1: { subject: "Bienvenido al Growth OS.", body: "Has dado el primer paso hacia la adquisición de leads de forma autónoma.\n\nEstamos validando tu proyecto para la integración del motor de cierre.\n\nRecibirás detalles técnicos en las próximas horas." },
        2: { subject: "Capa de Inteligencia y Conversión.", body: "El Growth OS no es un CRM tradicional, es un cerebro de conversión.\n\nEstamos preparando tu brief de integración personalizado.\n\nSiguiente paso: Activación de Nodo." },
        3: { subject: "Validación de Nodo en Proceso.", body: "Seguimos evaluando la compatibilidad de tu perfil con la red.\n\nLa red de partners de Growth OS es selectiva por diseño.\n\nTe notificaremos en cuanto el slot esté disponible." },
        4: { 
          subject: "Growth OS: Activación Autorizada.", 
          body: "Tu perfil ha sido verificado satisfactoriamente.\n\nTu instancia del Growth OS te espera.\n\nConecta tu identidad digital para firmar tu contrato y encender tu propio dashboard de marketing avanzado.", 
          ctaText: "ENCENDER DASHBOARD" 
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
  const queryParam = context.step === 4 ? "?approved=true" : "";
  const resolvedCtaUrl = isCoreRitual 
    ? `https://dash.pandoras.finance/access${queryParam}` 
    : `https://dash.pandoras.finance/projects/${context.projectSlug || 'default'}${queryParam}`;

  try {
    const data = await resend.emails.send({
      from: `${projectName} <${FROM_EMAIL}>`,
      to: [context.to],
      subject: emailData.subject,
      react: WaitlistEmail({ 
        subject: emailData.subject,
        body: emailData.body,
        step: context.step,
        projectName: projectName,
        brandHeader: context.brandHeader || `${projectName.toUpperCase()} // PROTOCOLO DE ESPERA`,
        ctaText: ('ctaText' in emailData) ? emailData.ctaText as string | undefined : undefined,
        ctaUrl: resolvedCtaUrl,
        showPathway: context.step === 4 || (context.step === 1 && !isPandora) // Show pathway on step 4 or step 1 (for external projects)
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
      from: `${projectName} <${FROM_EMAIL}>`,
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
      from: `Pandora <${FROM_EMAIL}>`,
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
      from: `Pandora <${FROM_EMAIL}>`,
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
      from: `${context.projectName} <${FROM_EMAIL}>`,
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
      from: `${context.projectName} <${FROM_EMAIL}>`,
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
      from: `Pandora <${FROM_EMAIL}>`,
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
      from: `Pandora <${FROM_EMAIL}>`,
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
      from: `Pandora <${FROM_EMAIL}>`,
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
      from: `Pandora <${FROM_EMAIL}>`,
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
