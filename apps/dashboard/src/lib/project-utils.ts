import { getRawPhases } from "./phase-utils";

/**
 * Resolves a project slug to its canonical version.
 * Handles legacy aliases (e.g., narai -> snarai) to ensure backwards compatibility.
 * This is the central source of truth for project renaming transitions.
 */
export function resolveProjectSlug(slug: string): string {
  if (!slug) return slug;
  const s = slug.toLowerCase();
  
  // Legacy Aliases Mapping (Scalable)
  const ALIASES: Record<string, string> = {
    'narai': 'snarai',
  };
  
  return ALIASES[s] || slug;
}


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
  if (!project) return 0;
  
  try {
    // Use the unified phase extractor
    const phases = getRawPhases(project);

    if (Array.isArray(phases) && phases.length > 0) {
      const totalPhasesAmount = phases.reduce((acc: number, phase: any) => {
        const price = Number(phase.tokenPrice || phase.price || 0);
        const allocation = Number(phase.tokenAllocation || phase.allocation || phase.limit || phase.amount || phase.maxSupply || 0);
        const cap = Number(phase.cap || phase.target || 0);
        
        // V2 PRIORITY: If we have price and allocation, use their product.
        // This prevents cases where "limit" might be incorrectly set to the unit price.
        const calculatedValue = (price > 0 && allocation > 0) ? (price * allocation) : 0;
        
        // Use the higher value between calculated and explicit cap (if any)
        const phaseValue = Math.max(calculatedValue, cap);
        
        return acc + (isNaN(phaseValue) ? 0 : phaseValue);
      }, 0);
      
      if (totalPhasesAmount > 0) return totalPhasesAmount;
    }

    // Fallback to DB fields if no phases found
    // 🛡️ RECOVERY: Some projects use project.goal or project.targetAmount (camelCase)
    const dbAmount = Number(project.target_amount || project.targetAmount || project.goal || project.target_amount_usd);
    
    // Valid DB amounts (not dummy placeholders like 100000 or 10000 unless they are the real target)
    if (!isNaN(dbAmount) && dbAmount > 0) {
        // If it looks like a dummy placeholder but we have no other data, use it as last resort
        return dbAmount;
    }

    // Absolute fallback
    return 0;
  } catch (e) {
    console.warn("[getTargetAmount] Parsing failed, using fallback:", e);
    const fallbackAmount = Number(project?.target_amount || project?.targetAmount || 0);
    return (!isNaN(fallbackAmount) && fallbackAmount > 0) ? fallbackAmount : 0;
  }
}

/**
 * Sanitizes a URL for use in <img> tags.
 * Handles IPFS, relative paths, and invalid placeholders.
 * V3 FIX: Forces absolute URLs for commerce widgets to load correctly on external domains.
 */
export function sanitizeUrl(url: any): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const cleanUrl = url.trim();
  
  // Ignore common placeholder strings or invalid values
  const placeholders = ['image', 'logo', 'icon', 'undefined', 'null', 'cover', 'placeholder'];
  if (placeholders.includes(cleanUrl.toLowerCase())) return null;
  
  // Handle IPFS: ipfs://CID or ipfs:CID or just a raw CID (starting with Qm or ba)
  if (cleanUrl.startsWith('ipfs:') || cleanUrl.startsWith('ipfs://')) {
    const path = cleanUrl.replace(/^ipfs:(\/*)/, '');
    return `https://ipfs.io/ipfs/${path}`;
  }
  
  // Detect raw CID (Common in Web3/Thirdweb)
  if (cleanUrl.startsWith('Qm') && cleanUrl.length >= 46) {
    return `https://ipfs.io/ipfs/${cleanUrl}`;
  }

  // Handle standard absolute URLs
  if (cleanUrl.startsWith('http')) {
    return cleanUrl;
  }
  
  // Handle relative paths - Force pointing back to the Dashboard to ensure assets load correctly on Narai/External
  if (cleanUrl.startsWith('/')) {
    return `https://dash.pandoras.finance${cleanUrl}`;
  }

  // Handle data URLs
  if (cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }
  
  // Default fallback: Assume it might be a relative asset on the dashboard
  return `https://dash.pandoras.finance/${cleanUrl}`;
}

