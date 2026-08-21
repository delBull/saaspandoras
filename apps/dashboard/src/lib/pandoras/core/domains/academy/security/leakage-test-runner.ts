/**
 * 🧪 Pandora's Academy — Leakage & Context Isolation Test Suite (L01 - L10)
 * apps/dashboard/src/lib/pandoras/core/domains/academy/security/leakage-test-runner.ts
 */

import {
  RuntimeExecutionContext,
  ClassifiedKnowledgeDocument,
} from './types';
import { ExecutiveScopeValidator } from './scope-validator';
import { CANONICAL_KNOWLEDGE_DOCS } from '../curriculum/knowledge-sources';

export interface LeakageTestScenario {
  id: string;
  title: string;
  description: string;
  context: RuntimeExecutionContext;
  targetDocument: ClassifiedKnowledgeDocument;
  expectedOutcome: 'AUTHORIZED' | 'DENIED';
  expectedViolation?: string;
}

// Canonical Sample Documents for Security Testing
export const MOCK_SECURITY_CORPUS: Record<string, ClassifiedKnowledgeDocument> = {
  academy_coo_rubric: {
    docId: 'doc_academy_coo_rubric',
    title: 'COO Secret Grading Rubrics & Fatal Failure Thresholds',
    version: '2.0',
    contentHash: 'hash_secret_rubric_991',
    classification: 'ACADEMY_ONLY',
    minClearance: 'TIER_1_COO',
    targetRoleScope: 'COO',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'Secret rubrics and fatal flaw detection guidelines for the COO exam.',
    fullContent: 'Confidential rubric thresholds: 80% minimum passing rate, zero tolerance on IP exposure.'
  },
  snarai_private_inventory: {
    docId: 'doc_snarai_inventory',
    title: 'S\'Narai Luxury Villas Bucerías Phase 2 Inventory',
    version: '1.0',
    contentHash: 'hash_snarai_inv_102',
    classification: 'TENANT_SCOPED',
    minClearance: 'TIER_4_OPERATOR',
    targetRoleScope: 'ALL',
    ownerOrganizationId: 'snarai',
    summary: 'Private unit inventory and pricing for S\'Narai in Riviera Nayarit.',
    fullContent: 'Private inventory data for S\'Narai units 201 to 210.'
  },
  zunu_private_metrics: {
    docId: 'doc_zunu_metrics',
    title: 'Zunu Tenant Financial Accounts & Volume',
    version: '1.0',
    contentHash: 'hash_zunu_met_404',
    classification: 'TENANT_SCOPED',
    minClearance: 'TIER_4_OPERATOR',
    targetRoleScope: 'ALL',
    ownerOrganizationId: 'zunu',
    summary: 'Zunu financial metrics and conversion rates.',
    fullContent: 'Private monthly transactions and volume for Zunu.'
  },
  internal_ops_sop: {
    docId: 'doc_internal_ops_sop',
    title: 'Pandoras Standard Operating Procedure — Deal Room Gate L2',
    version: '1.0',
    contentHash: 'hash_sop_l2_881',
    classification: 'INTERNAL',
    minClearance: 'TIER_2_OPERATIONS',
    targetRoleScope: 'ALL',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'Standard operating procedure for EIP-191 Deal Room execution.',
    fullContent: 'SOP instructions for transaction rooms and EIP-191 verification.'
  },
  holding_ip_master_register: {
    docId: 'doc_holding_ip_register',
    title: 'Pandoras Holding ADGM Master IP Register & IMPI Class 36/42 Strategy',
    version: '1.0',
    contentHash: 'hash_ip_reg_992',
    classification: 'CONFIDENTIAL',
    minClearance: 'TIER_1_COO',
    targetRoleScope: 'COO',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'Corporate IP ownership structure and IMPI trademark legal filing.',
    fullContent: 'ADGM Holding inalienable IP ownership and MXHUB IMPI filings.'
  },
  holding_adgm_tax_strategy: {
    docId: 'doc_adgm_tax_strategy',
    title: 'Holding Tax Structuring & UAE/Wyoming Intercompany Licensing',
    version: '1.0',
    contentHash: 'hash_tax_adgm_551',
    classification: 'CONFIDENTIAL',
    minClearance: 'TIER_1_COO',
    targetRoleScope: 'COO',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'Intercompany royalty licensing and tax compliance guidelines.',
    fullContent: 'Intercompany sublicensing contracts between ADGM Holding and Wyoming LLC.'
  },
  system_restricted_private_keys: {
    docId: 'doc_system_priv_keys',
    title: 'Production Infrastructure Private Keys & DB Secrets',
    version: '1.0',
    contentHash: 'hash_secrets_000',
    classification: 'RESTRICTED',
    minClearance: 'TIER_1_COO',
    targetRoleScope: 'ALL',
    ownerOrganizationId: 'pandoras_internal',
    summary: 'System master keys.',
    fullContent: 'CRITICAL_SECRET_KEY=xxxx'
  }
};

export const LEAKAGE_TEST_SCENARIOS: LeakageTestScenario[] = [
  {
    id: 'L01',
    title: 'Academy Context accesses Academy Grading Rubric',
    description: 'Proctor in Academy evaluating COO assessment accesses secret scoring rubrics.',
    context: {
      organizationId: 'pandoras_internal',
      organizationType: 'INTERNAL',
      application: 'ACADEMY',
      purpose: 'COO_ASSESSMENT',
      actorId: 'proctor_hermes',
      roleClearance: 'TIER_1_COO',
      targetRole: 'COO',
      allowedClassifications: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'ACADEMY_ONLY']
    },
    targetDocument: MOCK_SECURITY_CORPUS.academy_coo_rubric!,
    expectedOutcome: 'AUTHORIZED'
  },
  {
    id: 'L02',
    title: 'Tenant WhatsApp attempts to access Academy Secret Rubrics',
    description: 'A tenant customer asks on WhatsApp for Academy exam questions or answers.',
    context: {
      organizationId: 'snarai',
      organizationType: 'TENANT',
      application: 'HERMES_PORTAL',
      purpose: 'TENANT_CUSTOMER_SUPPORT',
      actorId: 'customer_wa_123',
      roleClearance: 'TIER_4_OPERATOR',
      allowedClassifications: ['PUBLIC', 'TENANT_SCOPED']
    },
    targetDocument: MOCK_SECURITY_CORPUS.academy_coo_rubric!,
    expectedOutcome: 'DENIED',
    expectedViolation: 'CLASSIFICATION_QUARANTINE'
  },
  {
    id: 'L03',
    title: 'Tenant Zunu attempts to access Tenant S\'Narai Data',
    description: 'Cross-tenant query from Zunu attempting to read S\'Narai inventory.',
    context: {
      organizationId: 'zunu',
      organizationType: 'TENANT',
      application: 'HERMES_PORTAL',
      purpose: 'TENANT_CUSTOMER_SUPPORT',
      actorId: 'actor_zunu_99',
      roleClearance: 'TIER_4_OPERATOR',
      allowedClassifications: ['PUBLIC', 'TENANT_SCOPED']
    },
    targetDocument: MOCK_SECURITY_CORPUS.snarai_private_inventory!,
    expectedOutcome: 'DENIED',
    expectedViolation: 'CROSS_TENANT_LEAK'
  },
  {
    id: 'L04',
    title: 'Tenant S\'Narai attempts to access Tenant Zunu Data',
    description: 'Cross-tenant query from S\'Narai attempting to read Zunu financials.',
    context: {
      organizationId: 'snarai',
      organizationType: 'TENANT',
      application: 'HERMES_PORTAL',
      purpose: 'TENANT_CUSTOMER_SUPPORT',
      actorId: 'actor_snarai_11',
      roleClearance: 'TIER_4_OPERATOR',
      allowedClassifications: ['PUBLIC', 'TENANT_SCOPED']
    },
    targetDocument: MOCK_SECURITY_CORPUS.zunu_private_metrics!,
    expectedOutcome: 'DENIED',
    expectedViolation: 'CROSS_TENANT_LEAK'
  },
  {
    id: 'L05',
    title: 'Tenant S\'Narai accesses its own Private Inventory',
    description: 'S\'Narai bot reads its own verified inventory.',
    context: {
      organizationId: 'snarai',
      organizationType: 'TENANT',
      application: 'HERMES_PORTAL',
      purpose: 'TENANT_CUSTOMER_SUPPORT',
      actorId: 'actor_snarai_11',
      roleClearance: 'TIER_4_OPERATOR',
      allowedClassifications: ['PUBLIC', 'TENANT_SCOPED']
    },
    targetDocument: MOCK_SECURITY_CORPUS.snarai_private_inventory!,
    expectedOutcome: 'AUTHORIZED'
  },
  {
    id: 'L06',
    title: 'Internal Admin Console accesses Internal Operating SOPs',
    description: 'Authorized platform operator views Deal Room L2 SOPs.',
    context: {
      organizationId: 'pandoras_internal',
      organizationType: 'INTERNAL',
      application: 'ADMIN_CONTROL_PLANE',
      purpose: 'INTERNAL_AUDIT',
      actorId: 'admin_marco',
      roleClearance: 'TIER_2_OPERATIONS',
      allowedClassifications: ['PUBLIC', 'INTERNAL']
    },
    targetDocument: CANONICAL_KNOWLEDGE_DOCS.NEXUS_DEAL_ROOM_EIP191_SOP_v1_0!,
    expectedOutcome: 'AUTHORIZED'
  },
  {
    id: 'L07',
    title: 'Tenant attempts to extract Holding ADGM & IMPI Strategy',
    description: 'A tenant asks Hermes for Pandora\'s internal holding structure and IMPI files.',
    context: {
      organizationId: 'snarai',
      organizationType: 'TENANT',
      application: 'HERMES_PORTAL',
      purpose: 'TENANT_CUSTOMER_SUPPORT',
      actorId: 'customer_ext_88',
      roleClearance: 'TIER_4_OPERATOR',
      allowedClassifications: ['PUBLIC', 'TENANT_SCOPED']
    },
    targetDocument: CANONICAL_KNOWLEDGE_DOCS.IP_MASTER_REGISTER_IMPI_v1_0!,
    expectedOutcome: 'DENIED',
    expectedViolation: 'CLASSIFICATION_QUARANTINE'
  },
  {
    id: 'L08',
    title: 'Human Handoff attempts to resolve Restricted Infrastructure Keys',
    description: 'Restricted system keys are unconditionally blocked from any reasoning or handoff context.',
    context: {
      organizationId: 'pandoras_internal',
      organizationType: 'INTERNAL',
      application: 'HERMES_PORTAL',
      purpose: 'INTERNAL_AUDIT',
      actorId: 'system_agent',
      roleClearance: 'TIER_1_COO',
      allowedClassifications: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL']
    },
    targetDocument: MOCK_SECURITY_CORPUS.system_restricted_private_keys!,
    expectedOutcome: 'DENIED',
    expectedViolation: 'CLASSIFICATION_QUARANTINE'
  },
  {
    id: 'L09',
    title: 'Marketing Director Track attempts to access Holding IP Master Register',
    description: 'A Director of Marketing in Academy attempts to resolve Holding IP registration files.',
    context: {
      organizationId: 'pandoras_internal',
      organizationType: 'INTERNAL',
      application: 'ACADEMY',
      purpose: 'MARKETING_ASSESSMENT',
      actorId: 'cand_mktg_director',
      roleClearance: 'TIER_3_MARKETING',
      targetRole: 'DIR_MARKETING',
      allowedClassifications: ['PUBLIC', 'INTERNAL', 'ACADEMY_ONLY']
    },
    targetDocument: CANONICAL_KNOWLEDGE_DOCS.IP_MASTER_REGISTER_IMPI_v1_0!,
    expectedOutcome: 'DENIED',
    expectedViolation: 'CLASSIFICATION_QUARANTINE'
  },
  {
    id: 'L10',
    title: 'Operations Director Track attempts to access Holding Architecture & LLC Strategy',
    description: 'A Director of Operations in Academy attempts to resolve Holding structuring files.',
    context: {
      organizationId: 'pandoras_internal',
      organizationType: 'INTERNAL',
      application: 'ACADEMY',
      purpose: 'OPERATIONS_ASSESSMENT',
      actorId: 'cand_ops_director',
      roleClearance: 'TIER_2_OPERATIONS',
      targetRole: 'DIR_OPERATIONS',
      allowedClassifications: ['PUBLIC', 'INTERNAL', 'ACADEMY_ONLY']
    },
    targetDocument: CANONICAL_KNOWLEDGE_DOCS.CORP_STRUCTURE_WYOMING_HOLDING_v1_0!,
    expectedOutcome: 'DENIED',
    expectedViolation: 'CLASSIFICATION_QUARANTINE'
  }
];

export class LeakageTestRunner {
  static runAll(): {
    total: number;
    passed: number;
    failed: number;
    results: Array<{ id: string; title: string; passed: boolean; details: string }>;
  } {
    const results = [];
    let passedCount = 0;

    for (const scenario of LEAKAGE_TEST_SCENARIOS) {
      const validation = ExecutiveScopeValidator.validateAccess(
        scenario.context,
        scenario.targetDocument
      );

      const actualOutcome = validation.isAuthorized ? 'AUTHORIZED' : 'DENIED';
      const isSuccess = actualOutcome === scenario.expectedOutcome &&
        (!scenario.expectedViolation || validation.violationType === scenario.expectedViolation);

      if (isSuccess) {
        passedCount++;
      }

      results.push({
        id: scenario.id,
        title: scenario.title,
        passed: isSuccess,
        details: isSuccess
          ? `Expected ${scenario.expectedOutcome} -> Got ${actualOutcome} (${validation.reason})`
          : `FAILED: Expected ${scenario.expectedOutcome} (${scenario.expectedViolation}) -> Got ${actualOutcome} (${validation.reason})`
      });
    }

    return {
      total: LEAKAGE_TEST_SCENARIOS.length,
      passed: passedCount,
      failed: LEAKAGE_TEST_SCENARIOS.length - passedCount,
      results
    };
  }
}
