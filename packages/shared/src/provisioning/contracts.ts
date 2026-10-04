export type OnboardingProductKey = 'HERMES' | 'GROWTH_OS' | 'PANDORAS_RWA';

export interface ProvisioningRequestDTO {
  organization: {
    name: string;
    slug?: string;
    description?: string;
    businessCategory?: string;
    website?: string;
    applicantEmail?: string;
    applicantPhone?: string;
  };
  products?: OnboardingProductKey[];
  idempotencyKey?: string;
  intents?: {
    hermesPriority?: string;
    growthPriority?: string;
    rwaPriority?: string;
  };
}

export interface ProvisioningResponseDTO {
  success: boolean;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  installedProducts: Array<{
    id: number;
    productFamily: string;
    plan: string;
    status: string;
    trialEndsAt?: string;
  }>;
  redirectUrl: string;
  isIdempotentReplay: boolean;
}
