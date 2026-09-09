/**
 * 🧭 Tenant Experience Context (UX & Presentation Guidance)
 * apps/dashboard/src/lib/mesh/tenant-experience-context.ts
 *
 * Directiva de Seguridad y Arquitectura:
 * ⚠️ TenantExperienceContext JAMÁS concede autorización, provisioning ni capabilities.
 * Es exclusivamente un servicio de presentación, ordenamiento visual y recomendación UX.
 * La autorización real y el acceso a rutas residen en resolvePortalContext y CapabilityRegistry.
 */

export type PrimaryGoal = 
  | 'REVENUE_GROWTH'       // CRM, Pipelines, Adquisición comercial
  | 'CONVERSATIONAL_SALES' // Cerrador IA 24/7 en WhatsApp/Telegram/Web
  | 'CAPITAL_ASSET_VAULT'  // Tokenización y RWA (Proyectos inmobiliarios/bienes)
  | 'COMMUNITY_ACADEMY';   // Formación y programas de capacitación

export type ExperienceMode =
  | 'COMMERCIAL_FIRST'     // Foco en Growth OS + CRM
  | 'HERMES_CLOSER_FIRST'  // Foco en Agente Conversacional Hermes AI
  | 'RWA_EXPANSION_FIRST'  // Foco en Tokenización & Proyectos de Capital
  | 'BALANCED';            // Foco multi-herramienta equilibrado

export type RwaStatus =
  | 'ACTIVE'               // Contrato desplegado o módulo activo
  | 'BACKSTAGE'            // Disponible como opción de expansión pero no protagonista
  | 'AVAILABLE';           // En catálogo / no instalado

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  actionUrl: string;
  actionLabel: string;
  badge?: string;
  priority: 'HIGH' | 'MEDIUM' | 'EXPANSION';
}

export interface TenantExperienceContext {
  /** Canonical Organization UUID (from projects.id or organization.id) */
  canonicalOrgId: string;
  /** URL slug */
  slug: string;
  /** Primary identified business goal */
  primaryGoal: PrimaryGoal;
  /** Visual presentation mode */
  experienceMode: ExperienceMode;
  /** Hero title personalized for business context */
  heroTitle: string;
  /** Explanatory subheadline */
  heroSubtitle: string;
  /** RWA visibility status (decoupled from experienceMode) */
  rwaStatus: RwaStatus;
  /** Products installed in reality */
  installedProductKeys: ('HERMES' | 'GROWTH_OS' | 'PANDORAS_RWA')[];
  /** Recommended next actions (no authorization implied) */
  recommendedActions: RecommendedAction[];
  /** Recommended expansion products */
  recommendedExpansions: {
    productKey: string;
    title: string;
    description: string;
    href: string;
  }[];
}

export interface ResolveExperienceInput {
  canonicalOrgId: string;
  slug: string;
  installedModules?: ('HERMES' | 'GROWTH_OS' | 'PANDORAS_RWA')[];
  explicitIntent?: PrimaryGoal;
  acquisitionSource?: string;
  hasContractDeployed?: boolean;
}

/**
 * Resolves the presentation experience context using deterministic precedence:
 * Explicit Intent > Acquisition Source > Installed Products > Commercial Default
 */
export function resolveTenantExperienceContext(
  input: ResolveExperienceInput
): TenantExperienceContext {
  const {
    canonicalOrgId,
    slug,
    installedModules = [],
    explicitIntent,
    acquisitionSource,
    hasContractDeployed = false,
  } = input;

  const hasHermes = installedModules.includes('HERMES');
  const hasGrowth = installedModules.includes('GROWTH_OS');
  const hasRwa = installedModules.includes('PANDORAS_RWA') || hasContractDeployed;

  // 1. Resolve Primary Goal by deterministic precedence
  let primaryGoal: PrimaryGoal = 'REVENUE_GROWTH'; // Default commercial first

  if (explicitIntent) {
    primaryGoal = explicitIntent;
  } else if (acquisitionSource) {
    const src = acquisitionSource.toLowerCase();
    if (src.includes('hermes') || src.includes('closer') || src.includes('bot')) {
      primaryGoal = 'CONVERSATIONAL_SALES';
    } else if (src.includes('rwa') || src.includes('token') || src.includes('realestate')) {
      primaryGoal = 'CAPITAL_ASSET_VAULT';
    } else if (src.includes('academy')) {
      primaryGoal = 'COMMUNITY_ACADEMY';
    } else {
      primaryGoal = 'REVENUE_GROWTH';
    }
  } else if (hasRwa && !hasGrowth && !hasHermes) {
    primaryGoal = 'CAPITAL_ASSET_VAULT';
  } else if (hasHermes && !hasGrowth) {
    primaryGoal = 'CONVERSATIONAL_SALES';
  } else {
    primaryGoal = 'REVENUE_GROWTH';
  }

  // 2. Resolve Visual Experience Mode
  let experienceMode: ExperienceMode = 'COMMERCIAL_FIRST';
  switch (primaryGoal) {
    case 'CONVERSATIONAL_SALES':
      experienceMode = 'HERMES_CLOSER_FIRST';
      break;
    case 'CAPITAL_ASSET_VAULT':
      experienceMode = 'RWA_EXPANSION_FIRST';
      break;
    case 'COMMUNITY_ACADEMY':
      experienceMode = 'BALANCED';
      break;
    case 'REVENUE_GROWTH':
    default:
      experienceMode = 'COMMERCIAL_FIRST';
      break;
  }

  // 3. Resolve RWA Status ("No esconder, no protagonizar")
  let rwaStatus: RwaStatus = 'AVAILABLE';
  if (hasRwa) {
    rwaStatus = 'ACTIVE';
  } else {
    // Si no está instalado, queda backstage como vía de expansión
    rwaStatus = 'BACKSTAGE';
  }

  // 4. Personalize Titles & Explanations
  let heroTitle = 'Tu Sistema Operativo Comercial';
  let heroSubtitle = 'Gestiona tus prospectos, automatiza el seguimiento y escala la captación de tu negocio.';

  if (experienceMode === 'HERMES_CLOSER_FIRST') {
    heroTitle = 'Tu Cerrador de Ventas con Inteligencia Artificial';
    heroSubtitle = 'Hermes atiende, califica y cierra prospectos 24/7 en tus canales de mensajería.';
  } else if (experienceMode === 'RWA_EXPANSION_FIRST') {
    heroTitle = 'Tokenización de Activos & Capital Soberano';
    heroSubtitle = 'Emisión de certificados, modelado de tokenomics y fondeo on-chain respaldado.';
  }

  // 5. Generate Recommended Actions
  const recommendedActions: RecommendedAction[] = [];

  if (experienceMode === 'COMMERCIAL_FIRST') {
    recommendedActions.push({
      id: 'growth-pipeline-setup',
      title: 'Configurar Pipeline de Ventas',
      description: 'Define las etapas de prospección comercial de tu negocio.',
      actionUrl: `/growth-os/organizations/${slug}`,
      actionLabel: 'Abrir Growth OS',
      badge: 'Motor Comercial',
      priority: 'HIGH',
    });
    if (!hasHermes) {
      recommendedActions.push({
        id: 'hermes-activate-closer',
        title: 'Activar Cerrador IA Hermes',
        description: 'Conecta un agente para responder y cerrar ventas de forma autónoma.',
        actionUrl: `/portal/${slug}`,
        actionLabel: 'Conectar Hermes',
        badge: 'Cerrador 24/7',
        priority: 'MEDIUM',
      });
    }
  } else if (experienceMode === 'HERMES_CLOSER_FIRST') {
    recommendedActions.push({
      id: 'hermes-persona-setup',
      title: 'Entrenar el Conocimiento de Hermes',
      description: 'Sube las respuestas clave de tu negocio para que Hermes cierre con precisión.',
      actionUrl: `/portal/${slug}/knowledge`,
      actionLabel: 'Bóveda de Conocimiento',
      badge: 'Cerrador 24/7',
      priority: 'HIGH',
    });
    if (!hasGrowth) {
      recommendedActions.push({
        id: 'growth-activate-crm',
        title: 'Vincular con CRM Growth OS',
        description: 'Sincroniza los leads captados por Hermes en tu pipeline comercial.',
        actionUrl: `/growth-os/organizations/${slug}`,
        actionLabel: 'Configurar CRM',
        badge: 'Motor Comercial',
        priority: 'MEDIUM',
      });
    }
  }

  // 6. Recommended Expansion Cards
  const recommendedExpansions = [];
  if (!hasRwa) {
    recommendedExpansions.push({
      productKey: 'PANDORAS_RWA',
      title: 'Bóveda de Activos & Tokenización',
      description: '¿Tu empresa tiene activos físicos o proyectos inmobiliarios? Fracciona y levanta capital on-chain.',
      href: `/ecosystem/${slug}/capital`,
    });
  }

  return {
    canonicalOrgId,
    slug,
    primaryGoal,
    experienceMode,
    heroTitle,
    heroSubtitle,
    rwaStatus,
    installedProductKeys: installedModules,
    recommendedActions,
    recommendedExpansions,
  };
}
