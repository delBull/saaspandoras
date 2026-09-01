/**
 * 🏛️ Provisioning & Onboarding Domain Contracts
 * src/lib/dash-contracts/provisioning/index.ts
 *
 * Strict DTOs and type contracts governing tenant provisioning,
 * product installation intent, and onboarding boundary responses.
 */

export type OnboardingProductKey = 'HERMES' | 'GROWTH_OS' | 'PANDORAS_RWA';

export type ProvisioningPlanTier = 'STARTER' | 'PRO' | 'ENTERPRISE';

export type ProvisioningInstallationStatus = 'TRIAL' | 'ACTIVE' | 'PENDING_CONFIG';

export interface ProvisioningProductSelection {
  product: OnboardingProductKey;
  plan?: ProvisioningPlanTier;
}

export interface TenantOrganizationDTO {
  name: string;
  slug: string;
  businessCategory?: string;
  website?: string;
  description?: string;
  applicantEmail?: string;
  applicantPhone?: string;
}

export interface ProvisioningRequestDTO {
  organization: TenantOrganizationDTO;
  products: OnboardingProductKey[];
  idempotencyKey: string;
}

export interface InstalledProductSummaryDTO {
  id: number;
  productFamily: string;
  plan: string;
  status: string;
  trialEndsAt?: string | null;
}

export interface ProvisioningResponseDTO {
  success: boolean;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  installedProducts: InstalledProductSummaryDTO[];
  redirectUrl: string;
  isIdempotentReplay?: boolean;
}
