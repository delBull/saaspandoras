/**
 * 🏛️ PLATFORM GOVERNANCE CONTRACTS: RWA & CAPITAL STRUCTURING
 * apps/dashboard/src/lib/dash-contracts/admin/rwa.ts
 *
 * Real World Asset Deal Pipeline, institutional structuring,
 * compliance, and multi-stage tokenization lifecycle.
 */

export type RwaPipelineStage =
  | 'APPLIED'
  | 'SCREENING'
  | 'DUE_DILIGENCE'
  | 'COMPLIANCE'
  | 'STRUCTURING'
  | 'APPROVAL'
  | 'DEPLOYMENT'
  | 'LIVE'
  | 'REJECTED';

export interface RwaCapitalStructuring {
  legalVehicle: string; // ej. S.A.P.I. de C.V., Trust, SPV Delaware
  jurisdiction: string;
  assetValuationUsd: number;
  totalTokenSupply: number;
  tokenTicker: string;
  initialTokenPriceUsd: number;
  targetApyPercentage?: number | null;
  offeringPhases: Array<{
    phaseNumber: number;
    phaseName: string;
    tokenAllocation: number;
    pricePerTokenUsd: number;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  contractArchitecture: 'ERC20_FRACTIONAL' | 'ERC721_VAULT' | 'DUAL_TOKEN';
  distributionModel: 'WHITELISTED_PUBLIC' | 'ACCREDITED_ONLY' | 'PRIVATE_SYNDICATE';
}

export interface RwaDealSummaryDTO {
  id: string;
  title: string;
  slug: string;
  originatingTenantId: string;
  sponsorName: string;
  stage: RwaPipelineStage;
  underlyingAssetType: 'REAL_ESTATE' | 'ENERGY' | 'AGRI_TECH' | 'PRIVATE_EQUITY' | 'OTHER';
  structuring?: RwaCapitalStructuring | null;
  contractAddress?: string | null;
  chain: string;
  ndaSigned: boolean;
  createdAt: string;
  updatedAt: string;
}
