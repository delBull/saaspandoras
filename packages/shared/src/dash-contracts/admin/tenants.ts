/**
 * 🏛️ PLATFORM GOVERNANCE CONTRACTS: TENANTS (ADMIN TENANT LENS)
 * apps/dashboard/src/lib/dash-contracts/admin/tenants.ts
 *
 * Types for the Admin Tenant Lens. Strictly READ-ONLY observability
 * of registered organizations, installed runtimes and compute usage.
 */

export type TenantLifecycleState = 
  | 'PROVISIONED' 
  | 'ACTIVE' 
  | 'TRIAL' 
  | 'PAUSED' 
  | 'SUSPENDED' 
  | 'ARCHIVED';

export type TenantRiskRating = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TenantProductInstallation {
  hermesAiMesh: boolean;
  growthOsCrm: boolean;
  tokenomicsRwa: boolean;
  installedAt?: string | null;
}

export interface TenantComputeSnapshot {
  creditBalanceUsd: number;
  sandboxBalanceUsd: number;
  totalDepositedUsd: number;
  totalSpentUsd: number;
  markupPercentage: number;
  isSandboxEnabled: boolean;
  totalEventsCount: number;
}

export interface AdminTenantLensDTO {
  id: string;
  slug: string;
  name: string;
  category: string;
  lifecycleState: TenantLifecycleState;
  riskRating: TenantRiskRating;
  creatorWallet: string;
  treasuryAddress?: string | null;
  poolContractAddress?: string | null;
  products: TenantProductInstallation;
  intents: string[];
  compute: TenantComputeSnapshot;
  knowledgeDocsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantListFilterOptions {
  searchQuery?: string;
  lifecycleState?: TenantLifecycleState | 'ALL';
  productFilter?: Array<'hermes' | 'growth' | 'rwa'>;
  sortBy?: 'name' | 'createdAt' | 'credits' | 'spent';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TenantListResult {
  tenants: AdminTenantLensDTO[];
  totalCount: number;
  page: number;
  totalPages: number;
}
