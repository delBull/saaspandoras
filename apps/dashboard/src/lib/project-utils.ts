/**
 * Calculates the percentage of completion of a project
 * Based on required vs optional fields completed
 */
export function calculateProjectCompletion(project: Record<string, unknown>): {
  percentage: number;
  status: 'draft' | 'pending';
  missingFields: string[];
} {
  const requiredSections = [
    // Sección 1: Identidad del Proyecto
    { field: 'title', label: 'Título del proyecto' },
    { field: 'slug', label: 'Slug único' },
    { field: 'description', label: 'Descripción del proyecto' },
    { field: 'businessCategory', label: 'Categoría de negocio' },

    // Sección 7: Contacto del Solicitante
    { field: 'applicantName', label: 'Nombre del solicitante' },
    { field: 'applicantPosition', label: 'Cargo del solicitante' },
    { field: 'applicantEmail', label: 'Email del solicitante' },
    { field: 'verificationAgreement', label: 'Acuerdo de verificación' },

    // Sección 3: Información financiera básica
    { field: 'targetAmount', label: 'Monto objetivo' },
    { field: 'tokenType', label: 'Tipo de token' },
    { field: 'totalTokens', label: 'Supply total de tokens' },
    { field: 'tokensOffered', label: 'Tokens ofrecidos' },
    { field: 'tokenPriceUsd', label: 'Precio por token' },

    // Sección 5: Información legal básica
    { field: 'legalStatus', label: 'Estatus legal' },
  ];

  const optionalSections = [
    // Información adicional valiosa
    { field: 'website', label: 'Sitio web' },
    { field: 'logoUrl', label: 'Logo del proyecto' },
    { field: 'coverPhotoUrl', label: 'Imagen de portada' },
    { field: 'tagline', label: 'Tagline descriptivo' },
    { field: 'videoPitch', label: 'Video pitch' },
    { field: 'whitepaperUrl', label: 'Whitepaper' },

    // Información financiera adicional
    { field: 'totalValuationUsd', label: 'Valuación total' },
    { field: 'estimatedApy', label: 'APY estimado' },
    { field: 'yieldSource', label: 'Fuente de rendimiento' },
    { field: 'lockupPeriod', label: 'Periodo de lock-up' },
    { field: 'fundUsage', label: 'Uso de fondos' },

    // Equipo y transparencia
    { field: 'teamMembers', label: 'Miembros del equipo' },
    { field: 'advisors', label: 'Asesores' },
    { field: 'tokenDistribution', label: 'Distribución de tokens' },

    // Información técnica
    { field: 'contractAddress', label: 'Dirección del contrato' },
    { field: 'treasuryAddress', label: 'Dirección de tesorería' },

    // Documentación
    { field: 'valuationDocumentUrl', label: 'Documento de valuación' },
    { field: 'fiduciaryEntity', label: 'Entidad fiduciaria' },
    { field: 'dueDiligenceReportUrl', label: 'Reporte de due diligence' },

    // Redes sociales
    { field: 'twitterUrl', label: 'Twitter' },
    { field: 'discordUrl', label: 'Discord' },
    { field: 'telegramUrl', label: 'Telegram' },
    { field: 'linkedinUrl', label: 'LinkedIn' },

    // Contacto adicional
    { field: 'applicantPhone', label: 'Teléfono del solicitante' },
  ];

  // Validar campos requeridos
  const missingFields: string[] = [];
  let completedFields = 0;
  const totalRequiredFields = requiredSections.length;

  // Validar campos requeridos
  for (const item of requiredSections) {
    const value = project[item.field];
    if (value === null || value === undefined || value === '' ||
      (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(item.label);
    } else {
      completedFields++;
    }
  }

  // Agregar puntos de campos opcionales
  for (const item of optionalSections) {
    const value = project[item.field];
    if (value !== null && value !== undefined &&
      value !== '' && !(typeof value === 'string' && value.trim() === '')) {
      // Campos opcionales cuentan como bono
      completedFields += 0.5;
    }
  }

  // Calcular porcentaje (campos requeridos + bono opcionales)
  const totalPossibleFields = totalRequiredFields + (optionalSections.length * 0.5);
  const percentage = Math.round((completedFields / totalPossibleFields) * 100);

  // Determinar si el proyecto está listo para postulación
  const isReadyForSubmission = missingFields.length === 0;
  const status = isReadyForSubmission ? 'pending' : 'draft';

  return {
    percentage: Math.min(100, Math.max(0, percentage)),
    status,
    missingFields
  };
}

/**
 * Helper to get the calculated target amount (Meta) of a project.
 * Prioritizes the deployed configuration (w2eConfig) over the initial application form.
 */
export function getTargetAmount(project: any): number {
  if (!project) return 10000;
  try {
    const config = typeof project.w2eConfig === 'string'
      ? JSON.parse(project.w2eConfig)
      : (project.w2eConfig || {});

    // V2 Structure
    const tokenomics = config.tokenomics || {};
    if (tokenomics.initialSupply && tokenomics.price) {
      return Number(tokenomics.initialSupply) * Number(tokenomics.price);
    }

    // V1 Structure (Fallback)
    const tokenDetails = config.tokenDetails || {};
    if (tokenDetails.initialSupply && tokenDetails.price) {
      return Number(tokenDetails.initialSupply) * Number(tokenDetails.price);
    }

    // Database Fallback
    return Number(project.target_amount || project.targetAmount) || 10000;
  } catch (e) {
    return Number(project.target_amount || project.targetAmount) || 10000;
  }
}

// ... existing code ...

/**
 * ACTIVATES A CLIENT AFTER SUCCESSFUL PAYMENT
 * - Updates DB status to 'active_client'
 * - Sends Welcome Email
 * - Notifies Discord
 */
import { db } from "~/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
// Note: imports for Resend and Emails should be dynamic or top-level if compatible.
// Using dynamic imports inside the function to avoid circular deps if any.

export async function activateClient(projectId: number, method: string, amount: string) {
  console.log(`🚀 Activating Client Project ID: ${projectId} via ${method}`);

  try {
    // 1. Update DB
    const result = await db.update(projects)
      .set({
        status: 'active_client' as any, // Cast to any to avoid immediate legacy type mismatch until regen
      })
      .where(eq(projects.id, projectId))
      .returning();

    const project = result[0];
    if (!project) throw new Error("Project not found");

    console.log(`✅ DB Updated: ${project.title} is now active.`);

    // 2. Send Welcome Email
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (RESEND_API_KEY && project.applicantEmail) {
        const { render } = await import('@react-email/render');
        const WelcomeEmail = (await import('@/emails/welcome-active-client')).default;

        const html = await render(WelcomeEmail({
          name: project.applicantName || 'Founder',
          projectName: project.title,
          dashboardLink: 'https://dash.pandoras.finance/dashboard'
        }));

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Onboarding <onboarding@pandoras.finance>',
            to: [project.applicantEmail],
            subject: '¡Bienvenido a Pandora’s! Tu lugar está asegurado 🚀',
            html: html,
          }),
        });
        console.log('📧 Welcome Email sent.');
      }
    } catch (emailErr) {
      console.error('❌ Email Failed:', emailErr);
    }

    // 3. Notify Discord
    try {
      const { notifySystemAlert } = await import('@/lib/discord');
      // We reuse notifySystemAlert or create a new specific one. 
      // For now, let's use a custom fetch here or add a new method to discord lib if preferred.
      // Let's stick to the plan: "Notify Discord (Active Client Alert)"

      // Using raw fetch to webhook for simplicity if notifyNewLead isn't perfect fit, 
      // OR ideally we export a new function `notifyActiveClient` in discord.ts.
      // Let's assume we will add `notifyPaymentSuccess` to discord.ts next.
      const { notifyPaymentSuccess } = await import('@/lib/discord');
      if (notifyPaymentSuccess) {
        await notifyPaymentSuccess(project.title, amount, method, project.applicantEmail || 'No Email');
      }
    } catch (discordErr) {
      console.error('❌ Discord Notification Failed:', discordErr);
    }

    return { success: true, project };

  } catch (error) {
    console.error('❌ Activation Failed:', error);
    throw error;
  }
}
