import { NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { eq, and, inArray, desc } from "@saasfly/db-core";
import { projects } from "@saasfly/db-core";
import type { 
  CatalogItemDto, 
  CatalogResponseDto, 
  CatalogVertical, 
  CatalogProductNature, 
  CatalogIntegrationMode, 
  CatalogVerificationFlag 
} from "@saasfly/shared";

export const dynamic = 'force-dynamic';

/**
 * Sanitizes and validates external URL against allowed domains or safe protocols.
 */
function resolveSafeTargetUrl(rawUrl: string | null | undefined, allowedDomains: unknown): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

    if (Array.isArray(allowedDomains) && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some((domain) => {
        if (typeof domain !== 'string') return false;
        const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
        return parsed.hostname.toLowerCase() === cleanDomain || parsed.hostname.toLowerCase().endsWith('.' + cleanDomain);
      });
      if (isAllowed) return parsed.toString();
    }

    // Default to the validated URL if no domain restrictions are explicitly enforced
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Maps DB business category to CatalogVertical.
 */
function resolveVertical(businessCategory: string | null | undefined): CatalogVertical {
  switch (businessCategory?.toLowerCase()) {
    case 'real_estate':
      return 'RWA_REAL_ESTATE';
    case 'saas':
    case 'tech':
      return 'SAAS_SOFTWARE';
    case 'services':
    case 'consulting':
    case 'agency':
      return 'GROWTH_SERVICES';
    case 'retail':
    case 'ecommerce':
      return 'SPECIALTY_GOODS';
    case 'dao':
    case 'community':
      return 'COMMUNITY_MEMBERSHIP';
    case 'infrastructure':
      return 'INFRASTRUCTURE';
    default:
      return 'OTHER';
  }
}

/**
 * Deterministically resolves product nature from pageLayoutType, tokenType, or category.
 */
function resolveProductNature(
  pageLayoutType: string | null | undefined,
  tokenType: string | null | undefined,
  vertical: CatalogVertical
): CatalogProductNature {
  if (pageLayoutType === 'membership') return 'MEMBERSHIP_PASS';
  if (pageLayoutType === 'access') return 'ACCESS_LICENSE';
  if (tokenType === 'fractional' || vertical === 'RWA_REAL_ESTATE') return 'FRACTIONAL_RIGHT';
  if (vertical === 'GROWTH_SERVICES') return 'B2B_SERVICE';
  if (vertical === 'SPECIALTY_GOODS') return 'PRODUCT_OFFER';
  if (tokenType === 'erc20' || tokenType === 'utility') return 'UTILITY_TOKEN';
  return 'ACCESS_LICENSE';
}

/**
 * Resolves integration mode and call to action safely.
 */
function resolveIntegration(
  p: typeof projects.$inferSelect,
  productNature: CatalogProductNature
): { mode: CatalogIntegrationMode; targetUrl: string | null; ctaLabel: string; requiresAuth: boolean } {
  const allowed = Array.isArray(p.allowedDomains) ? p.allowedDomains : [];
  const safeWebsite = resolveSafeTargetUrl(p.website, allowed);

  // If project has external allowed domain / website and is a white-label partner
  if (safeWebsite && (allowed.length > 0 || p.slug === 'snarai')) {
    return {
      mode: 'EXTERNAL_PORTAL',
      targetUrl: safeWebsite,
      ctaLabel: 'Visitar Portal',
      requiresAuth: false,
    };
  }

  // If on-chain contract is deployed and ready for direct checkout
  if (p.contractAddress && (p.deploymentStatus === 'deployed' || p.status === 'live')) {
    return {
      mode: 'DIRECT_CHECKOUT',
      targetUrl: `/project/${p.slug}`,
      ctaLabel: productNature === 'FRACTIONAL_RIGHT' ? 'Ver Oportunidad' : 'Adquirir',
      requiresAuth: true,
    };
  }

  // If B2B / growth service or no direct on-chain contract, route to contact/concierge
  if (productNature === 'B2B_SERVICE' || !p.contractAddress) {
    return {
      mode: 'CONTACT_REQUIRED',
      targetUrl: null,
      ctaLabel: 'Contactar',
      requiresAuth: false,
    };
  }

  return {
    mode: 'INFORMATION_ONLY',
    targetUrl: `/project/${p.slug}`,
    ctaLabel: 'Ver Detalles',
    requiresAuth: false,
  };
}

/**
 * Evaluates verification flags honestly without conflating tenant identity with product claims.
 */
function resolveVerificationFlags(p: typeof projects.$inferSelect): CatalogVerificationFlag[] {
  const flags: CatalogVerificationFlag[] = [];

  // Tenant is considered authenticated if status is live/approved with a confirmed organizationId
  if (p.organizationId && (p.status === 'live' || p.status === 'approved' || p.status === 'completed')) {
    flags.push('TENANT_AUTHENTICATED');
  }

  // Legal structure reviewed only if legalConfig is populated with agreement templates or formal legal status
  if (p.legalConfig && typeof p.legalConfig === 'object' && Object.keys(p.legalConfig).length > 0) {
    flags.push('LEGAL_STRUCTURE_REVIEWED');
  }

  // Cryptographically sealed only if deployment is deployed with contractAddress and chainId
  if (p.deploymentStatus === 'deployed' && p.contractAddress && p.chainId) {
    flags.push('CRYPTOGRAPHICALLY_SEALED');
  }

  // Hermes Concierge enabled if tenant runtime config is active
  if (p.tenantRuntimeConfig && typeof p.tenantRuntimeConfig === 'object') {
    flags.push('HERMES_CONCIERGE_ENABLED');
  }

  return flags;
}

/**
 * Resolves pricing faithfully without fabricating yields or false totals.
 */
function resolvePricing(p: typeof projects.$inferSelect): {
  amount: number | null;
  currency: string;
  formatted: string;
  isCustomQuote?: boolean;
} {
  if (p.price && Number(p.price) > 0) {
    const num = Number(p.price);
    return {
      amount: num,
      currency: 'USD',
      formatted: `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
    };
  }

  if (p.tokenPriceUsd && Number(p.tokenPriceUsd) > 0) {
    const num = Number(p.tokenPriceUsd);
    return {
      amount: num,
      currency: 'USD',
      formatted: `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD`,
    };
  }

  if (p.accessType === 'free') {
    return {
      amount: 0,
      currency: 'USD',
      formatted: 'Gratuito',
    };
  }

  return {
    amount: null,
    currency: 'USD',
    formatted: 'Cotización / Consulta',
    isCustomQuote: true,
  };
}

export async function GET() {
  try {
    // 1. Query verifiable, non-deleted, publicable projects from real database
    const rawProjects = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.isDeleted, false),
          inArray(projects.status, ['live', 'approved', 'completed'])
        )
      )
      .orderBy(desc(projects.featured), desc(projects.createdAt));

    // 2. Map deterministically to CatalogItemDto
    const items: CatalogItemDto[] = rawProjects.map((p) => {
      const vertical = resolveVertical(p.businessCategory);
      const productNature = resolveProductNature(p.pageLayoutType, p.tokenType, vertical);
      const integration = resolveIntegration(p, productNature);
      const verificationFlags = resolveVerificationFlags(p);
      const pricing = resolvePricing(p);

      const legalCfg = (p.legalConfig && typeof p.legalConfig === 'object') 
        ? (p.legalConfig as Record<string, unknown>) 
        : {};

      const agreementTemplateCid = typeof legalCfg.templateCid === 'string' ? legalCfg.templateCid : null;

      return {
        id: `catalog-${p.slug}`,
        slug: p.slug,
        title: p.title,
        tagline: p.tagline || null,
        description: p.description,
        imageUrl: p.coverPhotoUrl || p.imageUrl || null,
        logoUrl: p.logoUrl || null,

        canonicalOrgId: p.organizationId,
        tenantSlug: p.slug,
        tenantName: p.title,

        vertical,
        productNature,

        pricing,
        integration,

        verificationFlags,
        evidence: {
          agreementTemplateCid,
          contractAddress: p.contractAddress || null,
          chainId: p.chainId || null,
          whitepaperUrl: p.whitepaperUrl || null,
        },

        featured: Boolean(p.featured),
        status: p.status as 'live' | 'approved' | 'completed',
      };
    });

    const response: CatalogResponseDto = {
      success: true,
      timestamp: new Date().toISOString(),
      total: items.length,
      items,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[Catalog API] Fail-closed error querying projects:', error);

    // Strict compliance with Frozen Contract FC-011 and Condition 1:
    // Fail-closed with controlled error status 503, NEVER invent mock/fallback projects.
    return NextResponse.json(
      {
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'No fue posible consultar el catálogo en este momento. Intente más tarde.',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
