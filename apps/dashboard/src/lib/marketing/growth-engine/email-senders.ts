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
import PostPurchaseSuccessEmail from '@/emails/PostPurchaseSuccessEmail';

import { EngagementLevel } from './types';
import { db } from '@/db';
import { emailMetrics } from '@/db/schema';

/**
 * Tracks an email attempt in the local database for real-time metrics
 */
async function trackEmailMetadata(payload: {
  emailId: string;
  recipient: string;
  subject: string;
  type: string;
}) {
  try {
    await db.insert(emailMetrics).values({
      emailId: payload.emailId,
      recipient: payload.recipient,
      emailSubject: payload.subject,
      type: payload.type,
      status: 'sent',
      createdAt: new Date(),
    }).onConflictDoNothing();
    console.log(`📊 [Metrics] Logged 'sent' status for ${payload.emailId}`);
  } catch (error) {
    console.error('❌ [Metrics] Error tracking email:', error);
  }
}

const NICHE_COPIES: Record<string, Record<string, Record<number | string, { subject: string, body: string, ctaText?: string }>>> = {
  'real_estate': {
    'high': {
      1: { 
        subject: "oportunidad ya está activa", 
        body: "la oportunidad ya está en operación.\n\nEs un sistema que te permite participar en proyectos inmobiliarios sin tener que adquirir una propiedad completa.\n\nDesde aquí puedes acceder a oportunidades estructuradas y comenzar a posicionarte dentro del ecosistema.", 
        ctaText: "Explorar oportunidades" 
      },
      2: { 
        subject: `Cómo funciona el acceso`, 
        body: "Dentro del sistema, el acceso no es igual para todos.\n\nExisten diferentes niveles que determinan:\n• qué proyectos puedes ver\n• en cuáles puedes participar\n• bajo qué condiciones entras\n\nEstos niveles se activan a través de artefactos.", 
        ctaText: "Ver cómo funciona" 
      },
      3: { 
        subject: "Tu posición dentro del sistema", 
        body: "Tu participación define tu acceso.\n\nLos artefactos te permiten:\n• entrar antes que otros\n• mejorar tus condiciones\n• acceder a oportunidades más sólidas\n\nEntre antes entres, mejor posición puedes tomar.\n\nNota: Algunos accesos tienen disponibilidad limitada.", 
        ctaText: "Ver beneficios" 
      },
      4: { 
        subject: "Acceso disponible ahora", 
        body: "El sistema está disponible.\n\nPuedes ingresar, activar tu acceso y comenzar a participar en los proyectos activos.", 
        ctaText: "Entrar ahora" 
      },
      'GENESIS': {
        subject: "Estás dentro de la ventana de oportunidad.",
        body: "Entraste en la primera ventana.\n\nNo es casualidad.\n\nLos primeros no solo entran antes,\nentran en mejores condiciones.\n\nTu acceso ya está activo.\n\nLo que hagas con esto… importa.\n\n— Equipo"
      },
      'POST_PURCHASE': {
        subject: "Tu participación en {projectName} está activa",
        body: "Has dado el paso más importante.\n\nAl participar en {projectName}, no solo estás adquiriendo un activo, estás activando una pieza clave de infraestructura inmobiliaria que garantiza transparencia y trazabilidad sobre cada metro cuadrado.\n\nTu posición ya está registrada en el protocolo.",
        ctaText: "ACCEDER A MI PANEL"
      }
    },
    'mid': {
      1: { 
        subject: "Una nueva forma de participar en bienes raíces", 
        body: "El ecosistema ya está disponible.\n\nEs una forma más flexible de acceder a proyectos inmobiliarios sin los requisitos tradicionales.\n\nPuedes entrar y conocer cómo funciona desde dentro.", 
        ctaText: "Explorar" 
      },
      2: { 
        subject: "No todos ven lo mismo", 
        body: "El acceso depende de tu nivel dentro del sistema.\n\nEsto define:\n• qué oportunidades ves\n• cuándo puedes entrar\n• qué beneficios obtienes", 
        ctaText: "Ver sistema" 
      },
      3: { 
        subject: "Por qué entrar ahora", 
        body: "Los primeros en participar suelen tener mejores condiciones y acceso a las mejores oportunidades.\n\nEntrar antes te da ventaja.", 
        ctaText: "Ver oportunidades" 
      },
      4: { 
        subject: "Acceso disponible", 
        body: "El sistema ya está abierto.\n\nPuedes entrar y comenzar a explorar las oportunidades disponibles.", 
        ctaText: "Entrar" 
      }
    }
  },
  'tech_startup': {
    'high': {
      1: { 
        subject: "La infraestructura ya está activa", 
        body: "La infraestructura ya está en marcha.\n\nEs un sistema donde puedes interactuar, construir y acceder a componentes que no están disponibles públicamente.\n\nYa puedes comenzar a explorar.", 
        ctaText: "Entrar al sistema" 
      },
      2: { 
        subject: "Cómo funciona realmente el acceso", 
        body: "Dentro del sistema existen artefactos.\n\nCada uno te da acceso a capacidades específicas:\n• interacción con el protocolo\n• acceso a herramientas\n• posiciones dentro del sistema\n\nNo todos los artefactos son iguales.", 
        ctaText: "Ver artefactos" 
      },
      3: { 
        subject: "Lo que puedes desbloquear", 
        body: "Tu participación define lo que puedes hacer dentro del sistema.\n\nLos artefactos habilitan:\n• más control\n• más acceso\n• más capacidad de construcción\n\nEntre antes participes, mejor posicionamiento obtienes.", 
        ctaText: "Explorar beneficios" 
      },
      4: { 
        subject: "Puedes activar tu acceso ahora", 
        body: "El sistema ya está disponible.\n\nPuedes entrar, adquirir artefactos y comenzar a interactuar.", 
        ctaText: "Activar acceso" 
      },
      'GENESIS': {
        subject: "Estás dentro antes que el resto.",
        body: "Entraste en la primera ventana.\n\nNo es casualidad.\n\nLos primeros no solo entran antes,\nentran en mejores condiciones.\n\nTu acceso ya está activo.\n\nLo que hagas con esto… importa.\n\n— Equipo"
      },
      'POST_PURCHASE': {
        subject: "Posición activada: {projectName}",
        body: "Bienvenido a la infraestructura.\n\nHas asegurado tu lugar en el despliegue de {projectName}. Esta acción te otorga acceso directo a los componentes modulares y la gobernanza del protocolo.\n\nEs hora de empezar a construir.",
        ctaText: "VER PANEL DE CONTROL"
      }
    },
    'mid': {
      1: { 
        subject: "Bienvenido al ecosistema", 
        body: "Ya puedes entrar.\n\nEs un sistema diseñado para operar sobre activos digitales y nuevas formas de infraestructura.", 
        ctaText: "Conocer más" 
      },
      2: { 
        subject: "Qué hay dentro", 
        body: "Dentro del sistema existen accesos estructurados a través de artefactos.\n\nEstos determinan cómo interactúas con el protocolo.", 
        ctaText: "Ver cómo funciona" 
      },
      3: { 
        subject: "Por qué participar ahora", 
        body: "Los primeros participantes suelen tener mejores condiciones, más acceso y mayor control.", 
        ctaText: "Ver beneficios" 
      },
      4: { 
        subject: "Acceso disponible", 
        body: "Puedes entrar cuando quieras y comenzar a participar.", 
        ctaText: "Entrar" 
      }
    }
  },
  'growth_os': {
    'high': {
      1: { subject: "Tu infraestructura está activa", body: "El Sistema Operativo de Adquisición ya está en operación.\n\nPuedes acceder ahora para integrar el motor de cierre automático a tu flujo de negocio." },
      2: { subject: "IA y Cierre Automático", body: "El motor de Growth OS no solo captura, sino que cierra.\n\nDentro existen niveles de automatización definidos por tus artefactos de certificación." },
      3: { subject: "Escala con Precisión", body: "Tu participación activa desbloquea capas de inteligencia avanzada para tu ecosistema." },
      4: { subject: "Enciende tu Motor", body: "Ya puedes entrar, firmar tu acceso y activar la infraestructura de crecimiento.", ctaText: "ACTIVAR SISTEMA" },
      'POST_PURCHASE': {
        subject: "Motor encendido: {projectName}",
        body: "La integración ha comenzado.\n\nYa eres parte de la red de {projectName}. El Sistema Operativo de Adquisición está listo para ser escalado bajo tu control.\n\nAccede a tu nodo ahora.",
        ctaText: "GESTIONAR NODO"
      }
    },
    'mid': {
      1: { subject: "Bienvenido al motor de adquisición", body: "El futuro de la adquisición autónoma ya está aquí.\n\nYa puedes entrar y conocer las reglas del motor de conversión." },
      2: { subject: "Capa de Inteligencia", body: "Descubre cómo el sistema procesa cada lead de forma determinística." },
      3: { subject: "Ventajas de Escala", body: "Como parte del ecosistema, accedes a herramientas de cierre que otros no conocen." },
      4: { subject: "Dashboard Abierto", body: "Puedes empezar a configurar tu nodo ahora.", ctaText: "ENCENDER" }
    }
  },
  'finance': {
    'high': {
      1: { subject: "Protocolo de liquidez activo", body: "Ya puedes interactuar con los pools y capas de rendimiento." },
      'POST_PURCHASE': {
        subject: "Posición financiera activa: {projectName}",
        body: "Tu capital ya está operando bajo las reglas del protocolo {projectName}. Has asegurado un nodo de liquidez que te otorga derechos sobre el flujo generado por el sistema.\n\nEl panel de control financiero ya está desbloqueado.",
        ctaText: "GESTIONAR LIQUIDEZ"
      }
    }
  },
  'creative': {
    'high': {
      1: { subject: "Registro de propiedad activo", body: "Tus derechos y participaciones ya están registrados en el protocolo." },
      'POST_PURCHASE': {
        subject: "Propiedad intelectual asegurada: {projectName}",
        body: "Bienvenido a la nueva era de la propiedad digital. Al participar en {projectName}, has registrado tu posición sobre activos de propiedad intelectual únicos.\n\nTu certificado de participación ya es visible en el ledger.",
        ctaText: "VER MI COLECCIÓN"
      }
    }
  },
  'impact': {
    'high': {
      1: { subject: "Infraestructura de impacto lista", body: "Estamos construyendo el futuro de {projectName} sobre bases sólidas." },
      'POST_PURCHASE': {
        subject: "Impacto activado: {projectName}",
        body: "Gracias por ser parte del cambio. Tu participación en {projectName} habilita el despliegue de infraestructura crítica para un futuro más sostenible y eficiente.\n\nSigue el progreso de la implementación desde tu panel.",
        ctaText: "VER IMPACTO"
      }
    }
  },
  'other': {
    'high': {
      1: { subject: "Acceso total desbloqueado", body: "Ya puedes empezar a participar en el ecosistema." },
      'POST_PURCHASE': {
        subject: "Bienvenido a {projectName}",
        body: "Tu participación ha sido confirmada exitosamente. Ya tienes acceso a todas las herramientas y beneficios exclusivos dentro del protocolo {projectName}.\n\nEs el momento de empezar a explorar.",
        ctaText: "ENTRAR AL PANEL"
      }
    }
  }
};

/**
 * Resolves the niche and intent context for a project to provide consistent storytelling.
 */
function resolveNicheContext(context: { 
  projectName?: string; 
  businessCategory?: string; 
  brandHeader?: string;
  engagementLevel?: EngagementLevel;
}) {
  const projectName = context.projectName || "Pandora";
  const category = context.businessCategory?.toLowerCase() || '';
  
  // Niche mapping logic (Scalable)
  let niche = 'tech_startup';
  
  if (category.includes('real_estate') || category.includes('inmobiliario') || context.brandHeader?.toLowerCase().includes('narai')) {
    niche = 'real_estate';
  } else if (category.includes('growth_os') || category.includes('marketing') || projectName.toLowerCase().includes('growth os')) {
    niche = 'growth_os';
  } else if (['defi', 'finance', 'sports_fan_tokens'].includes(category)) {
    niche = 'finance';
  } else if (['art_collectibles', 'music_audio', 'intellectual_property', 'metaverse', 'gaming', 'social_networks'].includes(category)) {
    niche = 'creative';
  } else if (['renewable_energy', 'healthcare', 'education', 'supply_chain', 'infrastructure'].includes(category)) {
    niche = 'impact';
  } else if (category === 'other') {
    niche = 'other';
  } else if (projectName.toLowerCase().includes('pandora')) {
    niche = 'tech_startup';
  }

  const intent: EngagementLevel = context.engagementLevel || 'mid';
  const nicheMap = NICHE_COPIES[niche] || NICHE_COPIES['tech_startup'];
  const intentMap = nicheMap?.[intent === 'critical' ? 'high' : (intent === 'low' ? 'mid' : intent)] || nicheMap?.['mid'];

  return { niche, intent, intentMap, projectName };
}

export async function sendWaitlistSequenceEmail(context: {
  to: string;
  step: 1 | 2 | 3 | 4;
  projectName?: string;
  projectSlug?: string;
  brandHeader?: string;
  engagementLevel?: EngagementLevel;
  businessCategory?: string;
}) {
  const { projectName, niche, intentMap } = resolveNicheContext(context);
  console.log(`[Growth Engine] Sending Waitlist Email (Step ${context.step}) for ${projectName} (Niche: ${niche}) to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  const emailData = intentMap?.[context.step] || {
    subject: `Actualización de Acceso: Paso ${context.step}`,
    body: "Seguimos procesando tu solicitud de acceso al ecosistema.\n\nRecibirás una confirmación en las próximas horas."
  };

  // Determine dynamic CTA URL based on project/niche
  const isCoreRitual = niche === 'tech_startup' || niche === 'growth_os';
  const queryParam = context.step === 4 ? "?approved=true" : "";
  const resolvedCtaUrl = `https://dash.pandoras.finance/accessv2?project=${context.projectSlug || 'pandoras'}${queryParam}`;

  try {
    const data = await resend.emails.send({
      from: `${projectName} <${FROM_EMAIL}>`,
      to: [context.to],
      subject: emailData.subject,
      tags: [
        { name: 'audience', value: 'waitlist_sequence' },
        { name: 'step', value: String(context.step) },
        { name: 'project', value: context.projectSlug || 'pandora' }
      ],
      react: WaitlistEmail({ 
        subject: emailData.subject,
        body: emailData.body,
        step: context.step,
        projectName: projectName,
        brandHeader: context.brandHeader || `${projectName.toUpperCase()} // PROTOCOLO DE ESPERA`,
        ctaText: ('ctaText' in emailData) ? emailData.ctaText as string | undefined : undefined,
        ctaUrl: resolvedCtaUrl,
        showPathway: context.step === 4 || (context.step === 1 && niche !== 'tech_startup') 
      }) as React.ReactElement,
    });

    // Log to metrics table
    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject: emailData.subject,
        type: 'waitlist_sequence'
      });
    }

    console.log(`[Resend Engine] ✅ Success (Step ${context.step}):`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Resend Engine] ❌ Failure (Step ${context.step}):`, error);
    throw error;
  }
}

export async function sendGenesisWelcomeEmail(context: {
  to: string;
  projectName?: string;
  projectSlug?: string;
  brandHeader?: string;
  businessCategory?: string;
}) {
  const { projectName, intentMap } = resolveNicheContext(context);
  console.log(`[Growth Engine] Sending Genesis Welcome Email for ${projectName} to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  const emailData = intentMap?.['GENESIS'] || {
    subject: "Estás dentro antes que el resto.",
    body: "Entraste en la primera ventana.\n\nNo es casualidad.\n\nLos primeros no solo entran antes,\nentran en mejores condiciones.\n\nTu acceso ya está activo.\n\nLo que hagas con esto… importa.\n\n— Equipo"
  };

  const subject = emailData.subject;
  const body = emailData.body;

  try {
    const data = await resend.emails.send({
      from: `${projectName} <${FROM_EMAIL}>`,
      to: [context.to],
      subject,
      tags: [{ name: 'audience', value: 'creator_welcome' }],
      react: WaitlistEmail({ 
        subject,
        body,
        step: "GENESIS",
        projectName: projectName,
        brandHeader: context.brandHeader,
        ctaText: "ENTRAR AL SISTEMA",
        ctaUrl: `https://dash.pandoras.finance/accessv2?project=${context.projectSlug || 'pandoras'}&returning=true`
      }) as React.ReactElement,
    });

    // Log to metrics table
    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject,
        type: 'creator_welcome'
      });
    }

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
      tags: [{ name: 'audience', value: 'b2b_followup' }],
      react: B2BFollowupEmail({ 
        projectName: context.projectName,
      }) as React.ReactElement,
    });

    // Log to metrics table
    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject: `¿Seguimos adelante con ${context.projectName}?`,
        type: 'b2b_followup'
      });
    }

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
      tags: [{ name: 'audience', value: 'b2b_welcome' }],
      react: B2BWelcomeEmail({ 
        projectName: context.projectName,
        source: context.source,
        ctaText,
        ctaUrl
      }) as React.ReactElement,
    });

    // Log to metrics table
    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject: `Confirmación de Solicitud: ${context.projectName}`,
        type: 'b2b_welcome'
      });
    }

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
      tags: [
        { name: 'audience', value: 'explore_welcome' },
        { name: 'project', value: context.projectSlug || 'unknown' }
      ],
      react: ExploreStep1Email({ 
        projectName: context.projectName,
        differentiator: context.differentiator,
        projectSlug: context.projectSlug,
        baseUrl: context.baseUrl
      }) as React.ReactElement,
    });

    // Log to metrics table
    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject: `Acceso rápido: Entendiendo ${context.projectName}`,
        type: 'explore_welcome'
      });
    }

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
      tags: [
        { name: 'audience', value: 'invest_welcome' },
        { name: 'project', value: context.projectSlug || 'unknown' }
      ],
      react: InvestStep1Email({ 
        projectName: context.projectName,
        projectSlug: context.projectSlug,
        baseUrl: context.baseUrl
      }) as React.ReactElement,
    });

    // Log to metrics table
    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject: `Tu interés en ${context.projectName} - Siguientes Pasos`,
        type: 'invest_welcome'
      });
    }

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
      tags: [
        { name: 'audience', value: 'b2b_reminder' },
        { name: 'reminder_type', value: context.type }
      ],
      react: B2BCallReminderEmail({ 
        name: context.name,
        meetingDate: context.meetingDate,
        meetingTime: context.meetingTime,
        type: context.type,
      }) as React.ReactElement,
    });

    // Log to metrics table
    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject: context.type === 'D-0' ? "¡Hoy nos vemos!" : `Recordatorio de sesión: ${context.meetingDate}`,
        type: 'b2b_reminder'
      });
    }

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
      tags: [{ name: 'audience', value: 'b2b_booking_confirmed' }],
      react: B2BBookingConfirmedEmail({ 
        name: context.name,
        meetingDate: context.meetingDate,
        meetingTime: context.meetingTime,
      }) as React.ReactElement,
    });

    // Log to metrics table
    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject: "Sesión confirmada: Preparemos tu protocolo",
        type: 'b2b_booking_confirmed'
      });
    }

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
      tags: [{ name: 'audience', value: 'b2b_no_show' }],
      react: B2BNoShowRecoveryEmail({ 
        name: context.name,
        rescheduleUrl: "https://dash.pandoras.finance/schedule/founders"
      }) as React.ReactElement,
    });

    // Log to metrics table
    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject: "Te extrañamos en la sesión - ¿Agendamos de nuevo?",
        type: 'b2b_no_show'
      });
    }

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
      subject: `Evolucionando ${context.projectName}`,
      tags: [{ name: 'audience', value: 'educational_nurture' }],
      react: ProjectEducationalEmail({ 
        name: context.name,
        projectName: context.projectName,
        courseUrl: context.courseUrl
      }) as React.ReactElement,
    });

    // Log to metrics table
    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject: `Evolucionando ${context.projectName}`,
        type: 'educational_nurture'
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (Educational Nurture):`, error);
    throw error;
  }
}

export async function sendVIPConciergeEmail(context: {
  to: string;
  projectName?: string;
  brandHeader?: string;
}) {
  const { projectName, niche } = resolveNicheContext(context);
  console.log(`[Growth Engine] Sending VIP Concierge Email for ${projectName} (Niche: ${niche}) to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  const subject = "Atención Prioritaria - Tu solicitud fue recibida";
  const body = niche === 'real_estate' 
    ? `Hemos recibido tu solicitud de acceso VIP para ${projectName}.\n\nTu perfil ha sido catalogado como de alta prioridad y ha sido asignado directamente a uno de nuestros directores inmobiliarios.\n\nEn breve te contactaremos personalmente por WhatsApp o llamada para darte seguimiento uno a uno y presentarte las oportunidades exclusivas.\n\nNo requieres hacer nada más por el momento.\n\n— Equipo ${projectName}`
    : `Hemos recibido tu solicitud de acceso VIP para ${projectName}.\n\nTu perfil ha sido catalogado como de alta prioridad y ha sido asignado directamente a uno de nuestros directores.\n\nEn breve te contactaremos personalmente por WhatsApp o llamada para darte seguimiento uno a uno.\n\nNo requieres hacer nada más por el momento.\n\n— Equipo ${projectName}`;

  try {
    const data = await resend.emails.send({
      from: `${projectName} <${FROM_EMAIL}>`,
      to: [context.to],
      subject,
      tags: [{ name: 'audience', value: 'vip_concierge' }],
      react: WaitlistEmail({
        subject,
        body,
        step: "VIP",
        projectName: projectName,
        brandHeader: context.brandHeader || `${projectName.toUpperCase()} // CONJUNTO VIP`
      }) as React.ReactElement,
    });

    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject,
        type: 'vip_concierge'
      });
    }

    console.log(`[Growth Engine] Resend Success (VIP Concierge):`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (VIP Concierge):`, error);
    throw error;
  }
}

export async function sendPostPurchaseSuccessEmail(context: {
  to: string;
  projectName?: string;
  projectSlug?: string;
  businessCategory?: string;
  fundingPercentage?: number;
  currentPhase?: string;
  brandHeader?: string;
}) {
  const { projectName, intentMap } = resolveNicheContext(context);
  console.log(`[Growth Engine] Sending Post-Purchase Success Email for ${projectName} to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  const emailData = intentMap?.['POST_PURCHASE'] || {
    subject: `Tu participación en ${projectName} está activa`,
    body: `Has dado el paso más importante. Ahora eres parte de la infraestructura que está redefiniendo el sector de ${context.businessCategory || 'Tecnología'}.\n\nTu posición ya está registrada.`
  };

  // Dynamic template replacements
  const subject = emailData.subject.replace('{projectName}', projectName);
  const body = emailData.body.replace('{projectName}', projectName);
  const ctaText = emailData.ctaText || "ACCEDER A MI PANEL";
  const ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance'}/projects/${context.projectSlug || 'default'}/dao`;

  try {
    const data = await resend.emails.send({
      from: `${projectName} <${FROM_EMAIL}>`,
      to: [context.to],
      subject,
      tags: [
        { name: 'audience', value: 'post_purchase_success' },
        { name: 'project', value: context.projectSlug || 'unknown' }
      ],
      react: PostPurchaseSuccessEmail({ 
        projectName,
        projectSlug: context.projectSlug,
        subject,
        body,
        fundingPercentage: context.fundingPercentage || 0,
        currentPhase: context.currentPhase || 'Public Sale',
        ctaText,
        ctaUrl
      }) as React.ReactElement,
    });

    if (data && 'id' in data && data.id) {
      const resendId = (data as any).id;
      await trackEmailMetadata({
        emailId: String(resendId),
        recipient: context.to,
        subject,
        type: 'post_purchase_success'
      });
    }

    console.log(`[Growth Engine] Resend Success (Post-Purchase):`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (Post-Purchase):`, error);
    throw error;
  }
}

