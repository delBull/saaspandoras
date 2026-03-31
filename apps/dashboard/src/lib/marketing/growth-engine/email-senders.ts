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
        1: { 
          subject: `${projectName} ya está activo`, 
          body: `${projectName} ya está en operación.\n\nEs un sistema que te permite participar en proyectos inmobiliarios sin tener que adquirir una propiedad completa.\n\nDesde aquí puedes acceder a oportunidades estructuradas y comenzar a posicionarte dentro del ecosistema.`, 
          ctaText: `Explorar ${projectName}` 
        },
        2: { 
          subject: `Cómo funciona ${projectName}`, 
          body: `Dentro de ${projectName}, el acceso no es igual para todos.\n\nExisten diferentes niveles que determinan:\n• qué proyectos puedes ver\n• en cuáles puedes participar\n• bajo qué condiciones entras\n\nEstos niveles se activan a través de artefactos.`, 
          ctaText: "Ver cómo funciona" 
        },
        3: { 
          subject: "Tu posición dentro del sistema", 
          body: `Tu participación define tu acceso.\n\nLos artefactos te permiten:\n• entrar antes que otros\n• mejorar tus condiciones\n• acceder a oportunidades más sólidas\n\nEntre antes entres, mejor posición puedes tomar.\n\nNota: Algunos accesos tienen disponibilidad limitada.`, 
          ctaText: "Ver beneficios" 
        },
        4: { 
          subject: `Puedes entrar a ${projectName} ahora`, 
          body: `El sistema está disponible.\n\nPuedes ingresar, activar tu acceso y comenzar a participar en los proyectos activos.`, 
          ctaText: "Entrar ahora" 
        }
      },
      'mid': {
        1: { 
          subject: `Una nueva forma de participar en bienes raíces`, 
          body: `${projectName} ya está disponible.\n\nEs una forma más flexible de acceder a proyectos inmobiliarios sin los requisitos tradicionales.\n\nPuedes entrar y conocer cómo funciona desde dentro.`, 
          ctaText: "Explorar" 
        },
        2: { 
          subject: "No todos ven lo mismo", 
          body: `Dentro de ${projectName}, el acceso depende de tu nivel dentro del sistema.\n\nEsto define:\n• qué oportunidades ves\n• cuándo puedes entrar\n• qué beneficios obtienes`, 
          ctaText: "Ver sistema" 
        },
        3: { 
          subject: "Por qué entrar ahora", 
          body: "Los primeros en participar suelen tener mejores condiciones y acceso a las mejores oportunidades.\n\nEntrar antes te da ventaja.", 
          ctaText: "Ver oportunidades" 
        },
        4: { 
          subject: "Acceso disponible", 
          body: `${projectName} ya está abierto.\n\nPuedes entrar y comenzar a explorar las oportunidades disponibles.`, 
          ctaText: "Entrar" 
        }
      }
    },
    'tech_startup': {
      'high': {
        1: { 
          subject: `${projectName} ya está activo`, 
          body: `La infraestructura ya está en marcha.\n\n${projectName} es un sistema donde puedes interactuar, construir y acceder a componentes que no están disponibles públicamente.\n\nYa puedes comenzar a explorar.`, 
          ctaText: "Entrar al sistema" 
        },
        2: { 
          subject: `Cómo funciona realmente ${projectName}`, 
          body: `Dentro del sistema existen artefactos.\n\nCada uno te da acceso a capacidades específicas:\n• interacción con el protocolo\n• acceso a herramientas\n• posiciones dentro del sistema\n\nNo todos los artefactos son iguales.`, 
          ctaText: "Ver artefactos" 
        },
        3: { 
          subject: "Lo que puedes desbloquear", 
          body: `Tu participación define lo que puedes hacer dentro del sistema.\n\nLos artefactos habilitan:\n• más control\n• más acceso\n• más capacidad de construcción\n\nEntre antes participes, mejor posicionamiento obtienes.`, 
          ctaText: "Explorar beneficios" 
        },
        4: { 
          subject: "Puedes activar tu acceso ahora", 
          body: `El sistema ya está disponible.\n\nPuedes entrar, adquirir artefactos y comenzar a interactuar con ${projectName}.`, 
          ctaText: "Activar acceso" 
        }
      },
      'mid': {
        1: { 
          subject: `Bienvenido a ${projectName}`, 
          body: `Ya puedes entrar a ${projectName}.\n\nEs un sistema diseñado para operar sobre activos digitales y nuevas formas de infraestructura.`, 
          ctaText: "Conocer más" 
        },
        2: { 
          subject: "Qué hay dentro", 
          body: `Dentro del sistema existen accesos estructurados a través de artefactos.\n\nEstos determinan cómo interactúas con el protocolo.`, 
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
    'ecommerce': {
      'high': {
        1: { subject: "Acceso a inventario ya disponible", body: `El sistema ya está activo.\n\nPuedes acceder a productos con beneficios que no están disponibles de forma abierta con ${projectName}.`, ctaText: "Ver inventario" },
        2: { subject: "Cómo funciona el acceso", body: "El acceso a productos no es igual para todos.\n\nLos artefactos determinan:\n• prioridad\n• beneficios\n• condiciones especiales", ctaText: "Ver accesos" },
        3: { subject: "Lo que obtienes al participar", body: "Participar te permite:\n• acceder antes que otros\n• obtener mejores condiciones\n• desbloquear beneficios adicionales", ctaText: "Ver beneficios" },
        4: { subject: "Ya puedes entrar", body: "El acceso está abierto.\n\nPuedes comenzar a aprovecharlo ahora.", ctaText: "Entrar" }
      },
      'mid': {
        1: { subject: "Descubre el Protocolo de Stock", body: `Una nueva forma de acceder a inventario exclusivo con ${projectName}.\n\nEntra ahora y descubre cómo funciona el sistema de prioridad.`, ctaText: "Explorar" },
        2: { subject: "Beneficios de Miembro", body: "Participar en el sistema te otorga beneficios directos sobre el stock disponible.", ctaText: "Ver más" },
        3: { subject: "Tu posición importa", body: "Entrar temprano te asegura una mejor posición en la cola de acceso.", ctaText: "Ver ventajas" },
        4: { subject: "Sistema Abierto", body: "Ya puedes ingresar y activar tu perfil de cliente.", ctaText: "Ingresar" }
      }
    },
    'edtech': {
      'high': {
        1: { subject: "El sistema de aprendizaje está activo", body: `Ya puedes entrar a ${projectName}.\n\nNo es contenido tradicional. Es un sistema donde avanzas según lo que haces.`, ctaText: "Ver programa" },
        2: { subject: "Cómo funciona el sistema", body: "Tu progreso no es lineal.\n\nLos artefactos desbloquean:\n• niveles\n• mentoría\n• acceso a contenido avanzado", ctaText: "Ver estructura" },
        3: { subject: "Tu avance define tu acceso", body: "Mientras más participas:\n• más acceso obtienes\n• más oportunidades se abren", ctaText: "Ver beneficios" },
        4: { subject: "Puedes comenzar ahora", body: "El sistema ya está disponible.\n\nPuedes entrar y avanzar a tu ritmo.", ctaText: "Entrar" }
      },
      'mid': {
        1: { subject: "Aprende de forma diferente", body: `Explora el nuevo protocolo de aprendizaje de ${projectName}.\n\nUn sistema que evoluciona contigo.`, ctaText: "Conocer más" },
        2: { subject: "Metodología No Lineal", body: "Descubre cómo desbloquear nuevos módulos a través de la participación activa.", ctaText: "Ver método" },
        3: { subject: "Ventajas de este sistema", body: "Tú controlas tu ritmo y tu nivel de acceso al conocimiento experto.", ctaText: "Ver beneficios" },
        4: { subject: "Plataforma Activa", body: "Ya puedes iniciar tu recorrido.", ctaText: "Comenzar" }
      }
    },
    'wellness': {
      'high': {
        1: { subject: "El protocolo ya está activo", body: `Ya puedes comenzar con ${projectName}.\n\nEste sistema está diseñado para mejorar tu bienestar de forma estructurada.`, ctaText: "Ver protocolo" },
        2: { subject: "Cómo funciona", body: "El sistema se basa en acciones y consistencia.\n\nLos artefactos desbloquean:\n• rutinas\n• niveles\n• beneficios adicionales", ctaText: "Ver estructura" },
        3: { subject: "Resultados reales", body: "Tu progreso dentro del sistema define los resultados que obtienes.", ctaText: "Ver beneficios" },
        4: { subject: "Puedes iniciar", body: "Todo está listo.\n\nPuedes comenzar hoy.", ctaText: "Iniciar" }
      },
      'mid': {
        1: { subject: "Bienestar Sistémico", body: `Conoce el nuevo enfoque de ${projectName} para una vida equilibrada.`, ctaText: "Explorar" },
        2: { subject: "Consistencia Premiada", body: "Un sistema que recompensa tu avance diario con accesos exclusivos.", ctaText: "Ver más" },
        3: { subject: "Tu evolución importa", body: "Avanza niveles y desbloquea beneficios de salud optimizados.", ctaText: "Ver beneficios" },
        4: { subject: "Acceso Habilitado", body: "Puedes comenzar tu transformación cuando estés listo.", ctaText: "Entrar" }
      }
    },
    'gaming': {
      'high': {
        1: { subject: "El sistema ya está en vivo", body: `Puedes entrar ahora a ${projectName}.\n\nEl acceso te permite comenzar a desbloquear artefactos y progresar dentro del ecosistema.`, ctaText: "Entrar" },
        2: { subject: "Cómo funciona el desbloqueo", body: "Los artefactos determinan:\n• habilidades\n• acceso\n• progreso", ctaText: "Ver sistema" },
        3: { subject: "Tu progreso importa", body: "Mientras más participas, más puedes desbloquear.", ctaText: "Ver recompensas" },
        4: { subject: "Todo listo para jugar", body: "Puedes entrar y comenzar ahora.", ctaText: "Jugar" }
      },
      'mid': {
        1: { subject: "Nuevo Ecosistema de Juego", body: `Explora las reglas de este nuevo sistema con ${projectName}.`, ctaText: "Ver más" },
        2: { subject: "Artefactos y Habilidades", body: "Aprende cómo tu actividad se transforma en recompensas reales dentro del juego.", ctaText: "Conocer" },
        3: { subject: "Ventajas Tempranas", body: "Los primeros en participar aseguran los mejores ítems de acceso.", ctaText: "Ver catálogo" },
        4: { subject: "Servidores Activos", body: "Ya puedes iniciar tu sesión.", ctaText: "Ingresar" }
      }
    },
    'fintech': {
      'high': {
        1: { subject: "Acceso a estructura financiera activo", body: `El sistema ya está disponible con ${projectName}.\n\nPuedes participar y acceder a mejores condiciones de capital.`, ctaText: "Ver acceso" },
        2: { subject: "Cómo funciona", body: "Los artefactos determinan:\n• condiciones\n• oportunidades\n• acceso a capital", ctaText: "Ver estructura" },
        3: { subject: "Ventajas de participar", body: "Participar te permite optimizar cómo operas tu capital.", ctaText: "Ver beneficios" },
        4: { subject: "Puedes entrar ahora", body: "El sistema está abierto.", ctaText: "Entrar" }
      },
      'mid': {
        1: { subject: "Eficiencia de Capital", body: `Una nueva forma de gestionar activos y acceso a liquidez con ${projectName}.`, ctaText: "Explorar" },
        2: { subject: "Reglas de Operación", body: "Entiende cómo tu posición en el sistema mejora tus tasas y condiciones.", ctaText: "Ver más" },
        3: { subject: "Tu crecimiento importa", body: "A medida que participas, tus límites y capacidades aumentan.", ctaText: "Ver beneficios" },
        4: { subject: "Portal Activo", body: "Accede ahora a tu panel financiero.", ctaText: "Ingresar" }
      }
    },
    'growth_os': {
      'high': {
        1: { subject: `${projectName}: Tu infraestructura está activa`, body: "El Sistema Operativo de Adquisición ya está en operación.\n\nPuedes acceder ahora para integrar el motor de cierre automático a tu flujo de negocio." },
        2: { subject: "IA y Cierre Automático", body: "El motor de Growth OS no solo captura, sino que cierra.\n\nDentro existen niveles de automatización definidos por tus artefactos de certificación." },
        3: { subject: "Escala con Precisión", body: "Tu participación activa desbloquea capas de inteligencia avanzada para tu ecosistema." },
        4: { subject: "Enciende tu Motor", body: "Ya puedes entrar, firmar tu acceso y activar la infraestructura de crecimiento.", ctaText: "ACTIVAR SISTEMA" }
      },
      'mid': {
        1: { subject: `Bienvenido al ${projectName}`, body: "El futuro de la adquisición autónoma ya está aquí.\n\nYa puedes entrar y conocer las reglas del motor de conversión." },
        2: { subject: "Capa de Inteligencia", body: "Descubre cómo el sistema procesa cada lead de forma determinística." },
        3: { subject: "Ventajas de Escala", body: "Como parte del ecosistema, accedes a herramientas de cierre que otros no conocen." },
        4: { subject: "Dashboard Abierto", body: "Puedes empezar a configurar tu nodo ahora.", ctaText: "ENCENDER" }
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
        showPathway: context.step === 4 || (context.step === 1 && !isPandora) 
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
      tags: [{ name: 'audience', value: 'creator_welcome' }],
      react: WaitlistEmail({ 
        subject,
        body,
        step: "GENESIS",
        projectName: projectName,
        brandHeader: context.brandHeader
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
