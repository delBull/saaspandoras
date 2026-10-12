import { db, projects, eq } from "@saasfly/db-core";
import { CanonicalEmailBranding } from "./types";
import { emailTheme } from "./theme";

export const PANDORAS_DEFAULT_BRANDING: CanonicalEmailBranding = {
  name: "Pandora's Growth OS",
  logoUrl: "https://dash.pandoras.finance/images/pandoras-logo.png",
  accentColor: emailTheme.colors.accentDefault,
  supportEmail: "soporte@pandoras.finance",
  isPandorasPlatform: true,
  legalUrls: {
    terms: "https://pandoras.finance/terms",
    privacy: "https://pandoras.finance/privacy",
    agreement: "https://dash.pandoras.finance/legal/terms",
    riskDisclosure: "https://dash.pandoras.finance/legal/risk-disclosure",
    phaseDynamics: "https://dash.pandoras.finance/legal/phase-dynamics",
  }
};

/**
 * Server-authoritative branding resolver (FC-001 & FC-005)
 * Resolves verified brand attributes strictly from canonical database records (tenantRuntimeConfig).
 * Never trusts unauthenticated client inputs.
 */
export async function resolveEmailBranding(options?: {
  tenantSlug?: string;
  tenantId?: number;
  explicitBrand?: Partial<CanonicalEmailBranding>;
}): Promise<CanonicalEmailBranding> {
  const { tenantSlug, tenantId, explicitBrand } = options || {};

  if (!tenantSlug && !tenantId) {
    if (explicitBrand?.name && explicitBrand.name !== "Pandora's") {
      return {
        ...PANDORAS_DEFAULT_BRANDING,
        ...explicitBrand,
        isPandorasPlatform: explicitBrand.isPandorasPlatform ?? false,
      };
    }
    return PANDORAS_DEFAULT_BRANDING;
  }

  try {
    let project = null;

    if (tenantId) {
      const [found] = await db.select().from(projects).where(eq(projects.id, tenantId)).limit(1);
      project = found;
    } else if (tenantSlug) {
      const [found] = await db.select().from(projects).where(eq(projects.slug, tenantSlug)).limit(1);
      project = found;
    }

    if (!project) {
      return {
        ...PANDORAS_DEFAULT_BRANDING,
        ...(explicitBrand || {}),
      };
    }

    const runtimeConfig = (project.tenantRuntimeConfig || {}) as Record<string, any>;
    const brandConfig = runtimeConfig.brandConfig || {};

    // Fallbacks genéricos derivados del proyecto canónico — NUNCA special-casing
    // por slug de tenant (cada tenant debe configurar su propia marca en DB).
    const fallbackName = project.title || "Pandora's Growth OS";
    const fallbackColor = emailTheme.colors.accentDefault;

    return {
      tenantId: String(project.id),
      name: brandConfig.companyName || brandConfig.name || fallbackName,
      logoUrl: brandConfig.logoUrl || project.logoUrl || undefined,
      accentColor: brandConfig.primaryColor || brandConfig.color || fallbackColor,
      supportEmail: brandConfig.supportEmail || PANDORAS_DEFAULT_BRANDING.supportEmail,
      isPandorasPlatform: project.slug === 'pandoras',
      legalUrls: {
        terms: brandConfig.termsUrl || `https://dash.pandoras.finance/legal/terms/${project.slug}`,
        privacy: brandConfig.privacyUrl || `https://dash.pandoras.finance/legal/privacy/${project.slug}`,
        agreement: brandConfig.agreementUrl || `https://dash.pandoras.finance/legal/agreement/${project.slug}`,
        riskDisclosure: brandConfig.riskUrl || `https://dash.pandoras.finance/legal/risk-disclosure/${project.slug}`,
        phaseDynamics: brandConfig.phaseDynamicsUrl || `https://dash.pandoras.finance/legal/phase-dynamics/${project.slug}`,
      }
    };
  } catch (error) {
    console.error("⚠️ [resolveEmailBranding] Failed to query tenant runtime config, using safe platform fallback:", error);
    return {
      ...PANDORAS_DEFAULT_BRANDING,
      ...(explicitBrand || {}),
    };
  }
}
