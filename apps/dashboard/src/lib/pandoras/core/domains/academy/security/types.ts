/**
 * 🛡️ Pandora's Academy — Information Classification & Executive Clearance Contracts
 * apps/dashboard/src/lib/pandoras/core/domains/academy/security/types.ts
 */

export type KnowledgeClassification =
  | 'PUBLIC'          // Public information (Landing, docs, public FAQs)
  | 'TENANT_SCOPED'   // Tenant-specific business data (S'Narai, Zunu, etc.)
  | 'INTERNAL'        // Internal operational SOPs and checklists
  | 'CONFIDENTIAL'    // Corporate architecture, IP register, Treasury PAS allocations
  | 'RESTRICTED'      // Private keys, infrastructure secrets, webhook credentials
  | 'ACADEMY_ONLY';   // Exam case scenarios, secret grading rubrics, candidate records

export type ExecutiveRoleClearance =
  | 'TIER_1_COO'        // Full access to Holding architecture, IP strategy, Treasury PAS
  | 'TIER_2_OPERATIONS' // Deal Rooms, SPEI processing, Agent ops (Restricted from Holding IP & Tax)
  | 'TIER_3_MARKETING'  // Brand narrative, funnels, campaigns (Restricted from Treasury & SPVs)
  | 'TIER_4_OPERATOR';  // Public FAQs, support triage (Restricted from all internal secrets)

export type OrganizationType = 'INTERNAL' | 'TENANT';

export type ApplicationScope =
  | 'ACADEMY'
  | 'HERMES_PORTAL'
  | 'DEAL_ROOM'
  | 'ACQUISITION_FUNNEL'
  | 'ADMIN_CONTROL_PLANE';

export type ExecutionPurpose =
  | 'COO_ASSESSMENT'
  | 'OPERATIONS_ASSESSMENT'
  | 'MARKETING_ASSESSMENT'
  | 'TENANT_CUSTOMER_SUPPORT'
  | 'DEAL_ROOM_CLOSING'
  | 'PUBLIC_LEAD_ACQUISITION'
  | 'INTERNAL_AUDIT';

export interface RuntimeExecutionContext {
  organizationId: string;
  organizationType: OrganizationType;
  application: ApplicationScope;
  purpose: ExecutionPurpose;
  actorId: string;
  roleClearance: ExecutiveRoleClearance;
  targetRole?: 'COO' | 'DIR_OPERATIONS' | 'DIR_MARKETING' | 'OPERATOR';
  allowedClassifications: KnowledgeClassification[];
}

export interface ClassifiedKnowledgeDocument {
  docId: string;
  title: string;
  version: string;
  contentHash: string;
  classification: KnowledgeClassification;
  minClearance: ExecutiveRoleClearance;
  targetRoleScope: 'COO' | 'DIR_OPERATIONS' | 'DIR_MARKETING' | 'OPERATOR' | 'ALL';
  ownerOrganizationId: string;
  summary: string;
  fullContent: string;
}

export interface ScopeValidationResult {
  isAuthorized: boolean;
  reason: string;
  violationType?: 'CROSS_TENANT_LEAK' | 'INSUFFICIENT_CLEARANCE' | 'CLASSIFICATION_QUARANTINE' | 'PURPOSE_MISMATCH';
}
