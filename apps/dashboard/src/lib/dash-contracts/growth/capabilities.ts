/**
 * 📦 Dash Contracts — Growth Capabilities, Governance & Feature Gates
 * src/lib/dash-contracts/growth/capabilities.ts
 */

export type GrowthCapabilityKey =
  | 'growth.crm'
  | 'growth.email'
  | 'growth.nft'
  | 'growth.finance'
  | 'growth.governance'
  | 'growth.analytics'
  | 'growth.automations'
  | 'growth.agents';

export type GrowthPlanTier = 'STARTER' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';

export type CapabilityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface GrowthCapabilityDefinition {
  key: GrowthCapabilityKey;
  label: string;
  description: string;
  tierRequired: GrowthPlanTier;
  enabled: boolean;
  permissions: string[];
  riskLevel: CapabilityRiskLevel;
  requiresGovernance: boolean;
  requiresHumanApproval: boolean;
  agentExecutable: boolean;
  limits?: {
    maxItems?: number;
    monthlyQuota?: number;
    dailySpendLimitUsdc?: number;
    [key: string]: unknown;
  };
}

export interface TenantGrowthProfileDTO {
  organizationId: string;
  organizationSlug: string;
  planTier: GrowthPlanTier;
  status: 'ACTIVE' | 'PAST_DUE' | 'TRIAL' | 'INACTIVE';
  capabilities: GrowthCapabilityDefinition[];
  limitsUsed: {
    leadsCount: number;
    monthlyEmailsSent: number;
    activeWorkflows: number;
    dailySpentUsdc: number;
  };
}

export interface GetCapabilitiesResponseDTO {
  profile: TenantGrowthProfileDTO;
  enabledKeys: GrowthCapabilityKey[];
}
