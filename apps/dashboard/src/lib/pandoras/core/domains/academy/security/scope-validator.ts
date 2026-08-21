/**
 * 🛡️ Pandora's Academy — Executive Scope Validator Engine
 * apps/dashboard/src/lib/pandoras/core/domains/academy/security/scope-validator.ts
 *
 * Core Principle: Model ≠ Knowledge Base.
 * The knowledge available to an agent runtime is deterministically filtered by the authorized context.
 */

import {
  RuntimeExecutionContext,
  ClassifiedKnowledgeDocument,
  ScopeValidationResult,
  ExecutiveRoleClearance
} from './types';

const CLEARANCE_WEIGHTS: Record<ExecutiveRoleClearance, number> = {
  TIER_1_COO: 4,
  TIER_2_OPERATIONS: 3,
  TIER_3_MARKETING: 2,
  TIER_4_OPERATOR: 1,
};

export class ExecutiveScopeValidator {
  /**
   * Evaluates if a given execution context is strictly authorized to access a classified document.
   */
  static validateAccess(
    context: RuntimeExecutionContext,
    doc: ClassifiedKnowledgeDocument
  ): ScopeValidationResult {
    // 0. RESTRICTED: Never injected into LLM runtime contexts
    if (doc.classification === 'RESTRICTED') {
      return {
        isAuthorized: false,
        reason: 'Restricted system secrets are permanently blocked from LLM reasoning contexts.',
        violationType: 'CLASSIFICATION_QUARANTINE'
      };
    }

    // 1. ALLOWED CLASSIFICATIONS FILTER
    if (context.allowedClassifications && context.allowedClassifications.length > 0) {
      if (!context.allowedClassifications.includes(doc.classification)) {
        return {
          isAuthorized: false,
          reason: `Classification [${doc.classification}] is not in context allowedClassifications [${context.allowedClassifications.join(', ')}].`,
          violationType: 'CLASSIFICATION_QUARANTINE'
        };
      }
    }

    // 2. TENANT ISOLATION: TENANT_SCOPED documents are strictly isolated to their owner organization
    if (doc.classification === 'TENANT_SCOPED') {
      if (context.organizationType !== 'TENANT' || context.organizationId !== doc.ownerOrganizationId) {
        return {
          isAuthorized: false,
          reason: `Cross-tenant violation: Context org (${context.organizationId}) cannot access tenant data of (${doc.ownerOrganizationId}).`,
          violationType: 'CROSS_TENANT_LEAK'
        };
      }
    }

    // 3. ACADEMY QUARANTINE: ACADEMY_ONLY documents only accessible within Academy assessment applications
    if (doc.classification === 'ACADEMY_ONLY') {
      if (context.application !== 'ACADEMY') {
        return {
          isAuthorized: false,
          reason: `Academy quarantine: Document (${doc.docId}) is restricted exclusively to Academy applications.`,
          violationType: 'CLASSIFICATION_QUARANTINE'
        };
      }
    }

    // 4. CONFIDENTIAL & INTERNAL QUARANTINE: Non-internal contexts cannot access Holding or internal doctrine
    if (doc.classification === 'CONFIDENTIAL' || doc.classification === 'INTERNAL') {
      if (context.organizationType !== 'INTERNAL' && context.application !== 'ACADEMY') {
        return {
          isAuthorized: false,
          reason: `Confidentiality breach: External tenant cannot access internal Holding doctrine (${doc.docId}).`,
          violationType: 'CLASSIFICATION_QUARANTINE'
        };
      }
    }

    // 5. ROLE CLEARANCE HIERARCHY EVALUATION
    const contextClearanceWeight = CLEARANCE_WEIGHTS[context.roleClearance] ?? 0;
    const requiredClearanceWeight = CLEARANCE_WEIGHTS[doc.minClearance] ?? 0;

    if (contextClearanceWeight < requiredClearanceWeight) {
      return {
        isAuthorized: false,
        reason: `Insufficient role clearance: Required [${doc.minClearance}], but context has [${context.roleClearance}].`,
        violationType: 'INSUFFICIENT_CLEARANCE'
      };
    }

    // 6. TARGET ROLE SCOPE MATCH
    if (doc.targetRoleScope !== 'ALL' && context.targetRole && doc.targetRoleScope !== context.targetRole) {
      return {
        isAuthorized: false,
        reason: `Target role mismatch: Document is scoped for [${doc.targetRoleScope}], but context target role is [${context.targetRole}].`,
        violationType: 'PURPOSE_MISMATCH'
      };
    }

    return {
      isAuthorized: true,
      reason: 'Authorized by Executive Scope Validator.'
    };
  }

  /**
   * Filters a full corpus of documents, returning only the strictly authorized subset.
   */
  static filterAuthorizedDocuments(
    context: RuntimeExecutionContext,
    corpus: ClassifiedKnowledgeDocument[]
  ): ClassifiedKnowledgeDocument[] {
    return corpus.filter(doc => this.validateAccess(context, doc).isAuthorized);
  }
}
