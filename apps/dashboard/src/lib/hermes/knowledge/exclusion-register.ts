export type KnowledgeStatus = 'CANONICAL' | 'VERIFIED' | 'INTERNAL' | 'PUBLIC' | 'SUPERSEDED' | 'UNKNOWN' | 'MISSING' | 'DISCOVERED' | 'ACTIVE';

export interface KnowledgeDocument {
  id: string;
  organizationId: string;
  status: KnowledgeStatus;
  visibility: 'PUBLIC' | 'RESTRICTED' | 'INTERNAL';
  authority: string;
  content: string;
  metadata?: Record<string, any>;
}

export const EXCLUSION_REGISTER = {
  blockedStatuses: ['SUPERSEDED', 'UNKNOWN', 'MISSING'] as KnowledgeStatus[],
  blockedDataTypes: [
    'CONTACT_MEMORY', 
    'CONVERSATION_HISTORY', 
    'PII', 
    'SECRETS', 
    'TOKENS',
    'PRIVATE_DECISIONS',
    'FINANCIAL_UNAUTHORIZED',
    'GOVERNANCE_EXECUTABLE_RULES'
  ],
  allowedPublicStatuses: ['CANONICAL', 'VERIFIED', 'PUBLIC'] as KnowledgeStatus[]
};

export class ScopeValidator {
  /**
   * Validates whether a knowledge document is allowed to be injected into the prompt context.
   */
  static isAllowedInContext(
    doc: KnowledgeDocument,
    targetOrganizationId: string,
    isPublicChannel: boolean
  ): { allowed: boolean; reason?: string } {
    
    // 1. Tenant boundary check
    if (doc.organizationId !== targetOrganizationId) {
      return { allowed: false, reason: 'TENANT_BOUNDARY_VIOLATION' };
    }

    // 2. Status exclusion check
    if (EXCLUSION_REGISTER.blockedStatuses.includes(doc.status)) {
      return { allowed: false, reason: `BLOCKED_STATUS_${doc.status}` };
    }

    // 3. Channel visibility check
    if (isPublicChannel) {
      if (!EXCLUSION_REGISTER.allowedPublicStatuses.includes(doc.status)) {
         return { allowed: false, reason: 'RESTRICTED_STATUS_ON_PUBLIC_CHANNEL' };
      }
      if (doc.visibility === 'INTERNAL' || doc.visibility === 'RESTRICTED') {
         // Even if status is CANONICAL, if marked INTERNAL visibility, block on public channel
         return { allowed: false, reason: 'RESTRICTED_VISIBILITY_ON_PUBLIC_CHANNEL' };
      }
    }

    // 4. Governance executable rules boundary
    // Knowledge documents should never contain executable governance logic.
    // If the metadata indicates it's an executable rule, block it.
    if (doc.metadata?.dataType === 'GOVERNANCE_EXECUTABLE_RULES') {
      return { allowed: false, reason: 'GOVERNANCE_EXECUTABLE_RULE_IN_KNOWLEDGE' };
    }
    
    // 5. Memory/PII exclusion check
    if (doc.metadata?.dataType && EXCLUSION_REGISTER.blockedDataTypes.includes(doc.metadata.dataType)) {
      return { allowed: false, reason: `BLOCKED_DATA_TYPE_${doc.metadata.dataType}` };
    }

    return { allowed: true };
  }
}

export type DisclosureClassification = 'PUBLIC' | 'B2B_CONFIDENTIAL_NDA' | 'INTERNAL_RESTRICTED' | 'PROHIBITED_SECRET';

export class DisclosurePolicyGuard {
  /**
   * 🛡️ DISCLOSURE BOUNDARY VALIDATOR
   * Enforces the Tri-Fold Principle: Having access to know/use != Permission to disclose.
   */
  static evaluateDisclosure(
    classification: DisclosureClassification,
    isNdaActive: boolean,
    isInternalControlPlane: boolean
  ): { allowed: boolean; requirement?: string } {
    if (classification === 'PROHIBITED_SECRET') {
      return { allowed: false, requirement: 'ABSOLUTE_DISCLOSURE_BAN' };
    }

    if (classification === 'INTERNAL_RESTRICTED' && !isInternalControlPlane) {
      return { allowed: false, requirement: 'INTERNAL_CONTROL_PLANE_ONLY' };
    }

    if (classification === 'B2B_CONFIDENTIAL_NDA' && !isNdaActive && !isInternalControlPlane) {
      return { allowed: false, requirement: 'REQUIRES_MUTUAL_NDA_LEVEL_2_IN_NEXUS' };
    }

    return { allowed: true };
  }

  /**
   * 🛡️ EGRESS SANITIZER
   * Redacts any accidental leakage of private keys, DB URLs, or internal secrets
   */
  static sanitizeEgress(rawOutput: string): string {
    return rawOutput
      .replace(/0x[a-fA-F0-9]{64}/g, '[REDACTED_PRIVATE_KEY]')
      .replace(/npg_[a-zA-Z0-9_-]+/g, '[REDACTED_DB_CREDENTIAL]')
      .replace(/sk_live_[a-zA-Z0-9]+/g, '[REDACTED_API_SECRET]');
  }
}
