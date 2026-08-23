/**
 * 🏛️ HERMES OS — Tenant Sovereignty & Authority Contracts
 * src/lib/pandoras/core/domains/hermes/tenants/contracts.ts
 *
 * Implements the 4 foundational contracts from ADR-018:
 * 1. TenantAuthorityManifest
 * 2. TenantIdentitySoulManifest
 * 3. TenantClaimContract (Extended Pre-Publication Lifecycle)
 * 4. IntegrationCredential & TenantControlPlaneContext
 */

import { GovernedClaim, EpistemicCategory, KnowledgeDisclosureClearance } from '../knowledge/claim-contract-engine';

export type TenantGovernanceLifecycleStatus = 
  | 'DRAFT'
  | 'PENDING_ACTIVATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'ARCHIVED';

export type ClaimLifecycleStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'AUTHORIZED'
  | 'SIGNED'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'DEPRECATED'
  | 'REVOKED';

/**
 * 1. Tenant Authority Manifest (Root of Authority on IPFS)
 */
export interface TenantAuthorityManifest {
  manifestVersion: '1.0.0';
  tenantId: string;
  version: number;
  
  // IPFS CIDs of sub-manifests
  identityManifestCid: string;
  claimContractCid: string;
  policyManifestCid?: string;
  
  // Agent Web3 Identity
  agentWalletAddress: string;
  
  // Governance & Integrity
  governanceStatus: TenantGovernanceLifecycleStatus;
  merkleRoot: string;
  previousManifestCid?: string;
  
  signedAt: string;
  agentSignature: string; // EIP-712 signature
}

/**
 * 2. Declarative Identity, Voice & Policies Manifest
 */
export interface TenantIdentitySoulManifest {
  tenantId: string;
  version: number;
  agentName: string;
  organizationName: string;
  persona: string;
  voice: string;
  tone: {
    dos: string[];
    donts: string[];
  };
  languagePolicy: {
    avoidAsDefault: string[];
    preferred: Record<string, string>;
    allowedWhenAsked: string[];
  };
  claimsPolicy: {
    prohibited: string[];
    requiredQualification: string[];
  };
  escalationPolicy: {
    legalQuestions: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
    taxQuestions: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
    customInvestmentAdvice: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
    unavailableProjectData: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
    founderRequest: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
    outOfScopeQuestion: 'ANSWER';
  };
  canonicalUrls: Record<string, string>;
  closingSignature: string;
}

/**
 * Input structure for provisioning an external tenant's intelligence
 */
export interface TenantKnowledgePackInput {
  title: string;
  dimension: string;
  content: string;
  visibility?: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
  classification?: KnowledgeDisclosureClearance;
}

export interface TenantClaimInput {
  claimId: string;
  category: EpistemicCategory;
  canonicalAssertion: string;
  permittedPhrasings?: string[];
  disclosureClearance?: KnowledgeDisclosureClearance;
  isDeterministicFact?: boolean;
}

export interface TenantIntelligenceProvisionInput {
  tenantId: string;
  organizationName: string;
  agentName?: string;
  
  // Deterministic Project Metadata
  projectMetadata?: {
    tokenPriceUsd?: string | number;
    totalSupply?: string | number;
    location?: string;
    legalEntity?: string;
    jurisdiction?: string;
    websiteUrl?: string;
    whitepaperUrl?: string;
  };

  // Knowledge & Claims
  knowledgePacks?: TenantKnowledgePackInput[];
  customClaims?: TenantClaimInput[];

  // Identity & Soul configuration
  persona?: string;
  voice?: string;
  forbiddenTerms?: string[];
  preferredReplacements?: Record<string, string>;
  canonicalUrls?: Record<string, string>;
}

export interface TenantProvisionResult {
  tenantId: string;
  version: number;
  claimContractCid: string;
  identityManifestCid: string;
  authorityManifestCid: string;
  merkleRoot: string;
  signerAddress: string;
  claimsCount: number;
  knowledgePacksCount: number;
  status: TenantGovernanceLifecycleStatus;
}

/**
 * 4. Integration Credential & Control Plane Context (ADR-018)
 */
export interface IntegrationCredential {
  apiKey: string;
  tenantId: string;
  scope: 'READ_ONLY' | 'AGENT_RUNTIME' | 'ADMIN_GOVERNANCE';
  issuedAt: string;
  expiresAt?: string;
  revoked: boolean;
}

export interface TenantControlPlaneContext {
  tenantId: string;
  organizationId: string;
  resolvedSlug: string;
  authorityManifestCid?: string;
  governanceStatus: TenantGovernanceLifecycleStatus;
  rateLimitTier: 'STANDARD' | 'ENTERPRISE' | 'PRO';
  authenticatedVia: 'INTEGRATION_KEY' | 'SESSION_TOKEN' | 'INTERNAL_MESH';
  credentialScope: 'READ_ONLY' | 'AGENT_RUNTIME' | 'ADMIN_GOVERNANCE';
}

export interface TenantGatewayVerificationResult {
  allowed: boolean;
  context?: TenantControlPlaneContext;
  errorCode?: 'INVALID_CREDENTIAL' | 'TENANT_MISMATCH' | 'INACTIVE_TENANT' | 'RATE_LIMIT_EXCEEDED' | 'INSUFFICIENT_SCOPE';
  errorMessage?: string;
}
