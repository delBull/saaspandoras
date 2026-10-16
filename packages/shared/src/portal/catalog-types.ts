/**
 * Catalog Contracts — Pandora's Growth OS & Sovereign Portal
 * 
 * Defines canonical data contracts for consumer-facing catalog items.
 * Adheres strictly to Frozen Contracts:
 * - FC-001 (Canonical Tenant Identity): organizationId vs slug resolution
 * - FC-003 (Authorization): Catalog is descriptive, not capability-granting
 * - FC-011 (Production Truth): No manufactured yields, metrics, CIDs, or claims
 */

export type CatalogVertical =
  | 'RWA_REAL_ESTATE'
  | 'GROWTH_SERVICES'
  | 'SAAS_SOFTWARE'
  | 'SPECIALTY_GOODS'
  | 'COMMUNITY_MEMBERSHIP'
  | 'INFRASTRUCTURE'
  | 'OTHER';

export type CatalogProductNature =
  | 'FRACTIONAL_RIGHT'
  | 'MEMBERSHIP_PASS'
  | 'ACCESS_LICENSE'
  | 'B2B_SERVICE'
  | 'PRODUCT_OFFER'
  | 'UTILITY_TOKEN';

export type CatalogIntegrationMode =
  | 'DIRECT_CHECKOUT'     // On-chain or platform-governed direct checkout flow
  | 'EXTERNAL_PORTAL'     // Sovereign White-label domain (e.g. S'Narai, verified via allowedDomains)
  | 'CONTACT_REQUIRED'    // Enterprise/B2B requiring concierge/Hermes interaction
  | 'INFORMATION_ONLY';   // Showcase / disclosure only

/**
 * Separate tenant-level verification from individual product-level claims.
 * Claims MUST NOT be derived arbitrarily from contract existence alone.
 */
export type CatalogVerificationFlag =
  | 'TENANT_AUTHENTICATED'           // Tenant has verified sovereign identity and active status
  | 'LEGAL_STRUCTURE_REVIEWED'       // Legal configuration/agreement template is present & active
  | 'CRYPTOGRAPHICALLY_SEALED'       // Artifacts/contracts sealed on-chain or NOM-151 timestamped
  | 'HERMES_CONCIERGE_ENABLED';      // Tenant has active Hermes agentic assistant enabled

export interface CatalogPriceDto {
  amount: number | null;
  currency: string;
  formatted: string;
  isCustomQuote?: boolean;
}

export interface CatalogIntegrationDto {
  mode: CatalogIntegrationMode;
  targetUrl: string | null;           // Sanitized and validated URL against tenant allowedDomains/site
  ctaLabel: string;
  requiresAuth: boolean;
}

export interface CatalogEvidenceDto {
  agreementTemplateCid?: string | null;
  contractAddress?: string | null;
  chainId?: number | null;
  whitepaperUrl?: string | null;
}

export interface CatalogItemDto {
  id: string;                         // Canonical identifier (e.g., project-slug or artifact-id)
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  imageUrl: string | null;
  logoUrl: string | null;

  // Tenant Authority
  canonicalOrgId: string;             // Persistent UUID / org identifier
  tenantSlug: string;
  tenantName: string;

  // Classification
  vertical: CatalogVertical;
  productNature: CatalogProductNature;

  // Pricing & Commercial Rail
  pricing: CatalogPriceDto;
  integration: CatalogIntegrationDto;

  // Verification & Evidence
  verificationFlags: CatalogVerificationFlag[];
  evidence: CatalogEvidenceDto;

  // Governance & Operational Metadata
  featured: boolean;
  status: 'live' | 'approved' | 'completed';
}

export interface CatalogResponseDto {
  success: boolean;
  timestamp: string;
  total: number;
  items: CatalogItemDto[];
}
