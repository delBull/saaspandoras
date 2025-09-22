import { type Project } from "~/db/schema";

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
    const value = (project as Record<string, unknown>)[item.field];
    if (value === null || value === undefined || value === '' ||
        (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(item.label);
    } else {
      completedFields++;
    }
  }

  // Agregar puntos de campos opcionales
  for (const item of optionalSections) {
    const value = (project as Record<string, unknown>)[item.field];
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
