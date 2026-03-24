import { resend, FROM_EMAIL } from '@/lib/resend';
import ExploreStep1Email from '@/emails/explore/step1';
import InvestStep1Email from '@/emails/invest/step1';
import B2BWelcomeEmail from '@/emails/b2b-welcome';
import B2BFollowupEmail from '@/emails/b2b-followup';
import B2BCallReminderEmail from '@/emails/b2b-call-reminder';
import B2BBookingConfirmedEmail from '@/emails/b2b-booking-confirmed';
import B2BNoShowRecoveryEmail from '@/emails/b2b-no-show-recovery';
import WaitlistEmail from '@/emails/WaitlistEmail';

export async function sendWaitlistSequenceEmail(context: {
  to: string;
  step: 1 | 2 | 3 | 4;
}) {
  console.log(`[Growth Engine] Sending Waitlist Email (Step ${context.step}) to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  const sequences = {
    1: {
      subject: "Tu acceso está en revisión.",
      body: "Recibimos tu solicitud.\n\nNo estamos abriendo esto al público.\n\nEstamos seleccionando perfiles con visión y timing.\n\nEn los próximos días recibirás más contexto.\n\nSi estás dentro… lo sabrás antes que el resto."
    },
    2: {
      subject: "Esto no se está explicando afuera.",
      body: "La mayoría entra tarde porque espera claridad.\n\nPero la claridad llega cuando ya es caro.\n\nLo que estamos construyendo no es visible aún.\n\nPero ya está en movimiento.\n\nY los primeros no están esperando confirmación.\n\nEstán tomando posición.\n\nSi esto resuena contigo, mantente atento. Los siguientes pasos no serán públicos."
    },
    3: {
      subject: "No todos van a pasar.",
      body: "Estamos filtrando accesos.\n\nNo por volumen.\n\nPor criterio.\n\nLos que entienden:\n→ no preguntan “qué es”\n→ preguntan “cómo entro”\n\nSi ese eres tú, pronto tendrás acceso.\n\nSi esto resuena contigo, mantente atento."
    },
    4: {
      subject: "Se está abriendo una ventana.",
      body: "Estamos habilitando accesos limitados.\n\nNo es público.\n\nNo es masivo.\n\nSi recibes el siguiente correo, significa que estás dentro.\n\nPrepárate. El acceso no se repite dos veces."
    }
  };

  const emailData = sequences[context.step];

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject: emailData.subject,
      react: WaitlistEmail({ 
        subject: emailData.subject,
        body: emailData.body,
        step: context.step
      }),
    });
    return { success: true, data };
  } catch (error) {
    console.error(`[Growth Engine] Resend Error (Waitlist Step ${context.step}):`, error);
    throw error;
  }
}

export async function sendGenesisWelcomeEmail(context: {
  to: string;
}) {
  console.log(`[Growth Engine] Sending Genesis Welcome Email to ${context.to}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
      if (isProd) {
          throw new Error('[Growth Engine] CRITICAL: RESEND_API_KEY is missing');
      }
      return { success: true, mocked: true };
  }

  const subject = "Estás dentro antes que el resto.";
  const body = "Entraste en la primera ventana.\n\nNo es casualidad.\n\nLos primeros no solo entran antes,\nentran en mejores condiciones.\n\nTu acceso ya está activo.\n\nLo que hagas con esto… importa.\n\n— Pandora";

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [context.to],
      subject,
      react: WaitlistEmail({ 
        subject,
        body,
        step: "GENESIS"
      }),
    });
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
