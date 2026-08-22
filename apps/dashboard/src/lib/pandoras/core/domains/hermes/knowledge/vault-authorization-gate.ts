/**
 * 🏛️ Pandora's Hermes OS — Milestone 8.0: K25 Sovereign Vault Authorization Gate
 * src/lib/pandoras/core/domains/hermes/knowledge/vault-authorization-gate.ts
 *
 * Implements strict contextual authorization prior to any IPFS artifact retrieval or DEK decryption:
 * 1. Tenant Boundary Invariant: request.tenantId === session.tenantId (No cross-tenant leaks)
 * 2. Classification Lattice Invariant: clearance >= artifact.classification
 * 3. Channel Ceiling Invariant: channel.maxClearance >= artifact.classification
 * 4. Zero-Plaintext Audit Record of all access decisions
 */

import type { KnowledgeClassificationTier } from '../runtime/contracts';

export interface VaultAccessContext {
  sessionTenantId: string;
  actorId: string;
  actorClearance: KnowledgeClassificationTier;
  channelType: 'PUBLIC' | 'AUTHENTICATED_WEB' | 'TELEGRAM' | 'INTERNAL_WORKBENCH';
  purpose: string;
}

export interface VaultAccessRequest {
  targetTenantId: string;
  artifactId: string;
  classification: KnowledgeClassificationTier;
  ipfsCid: string;
  domain: string;
}

export interface VaultAuthorizationDecision {
  allowed: boolean;
  decisionCode: 'VAULT_ALLOW' | 'CROSS_TENANT_VAULT_DENIED' | 'INSUFFICIENT_CLEARANCE' | 'CHANNEL_CEILING_EXCEEDED' | 'UNAUTHORIZED_PURPOSE';
  reason: string;
  timestamp: string;
}

const TIER_ORDER: Record<KnowledgeClassificationTier, number> = {
  PUBLIC: 0,
  TENANT_RESTRICTED: 1,
  B2B_RESTRICTED: 2,
  INTERNAL_OPERATIONAL: 3,
  CONFIDENTIAL: 4,
  ACADEMY_EVALUATE_ONLY: 4,
  SECRET: 5,
};

const CHANNEL_MAX_CLEARANCE: Record<string, KnowledgeClassificationTier> = {
  PUBLIC: 'PUBLIC',
  TELEGRAM: 'TENANT_RESTRICTED',
  AUTHENTICATED_WEB: 'CONFIDENTIAL',
  INTERNAL_WORKBENCH: 'SECRET',
};

export class VaultAuthorizationGate {
  /**
   * Evaluates if a runtime retrieval/decryption request is permitted under sovereign governance policies.
   */
  public evaluate(context: VaultAccessContext, request: VaultAccessRequest): VaultAuthorizationDecision {
    const timestamp = new Date().toISOString();

    // 1. Cross-Tenant Boundary Enforcement
    if (context.sessionTenantId !== request.targetTenantId) {
      return {
        allowed: false,
        decisionCode: 'CROSS_TENANT_VAULT_DENIED',
        reason: `Access denied: session tenant [${context.sessionTenantId}] cannot access vault artifact of [${request.targetTenantId}].`,
        timestamp,
      };
    }

    // 2. Classification Lattice Clearance Check
    const actorTier = TIER_ORDER[context.actorClearance] ?? 0;
    const artifactTier = TIER_ORDER[request.classification] ?? 5;

    if (actorTier < artifactTier) {
      return {
        allowed: false,
        decisionCode: 'INSUFFICIENT_CLEARANCE',
        reason: `Actor clearance [${context.actorClearance}] is lower than artifact classification [${request.classification}].`,
        timestamp,
      };
    }

    // 3. Channel Maximum Clearance Ceiling Check
    const channelMaxTierName = CHANNEL_MAX_CLEARANCE[context.channelType] || 'PUBLIC';
    const channelMaxTier = TIER_ORDER[channelMaxTierName] ?? 0;

    if (artifactTier > channelMaxTier) {
      return {
        allowed: false,
        decisionCode: 'CHANNEL_CEILING_EXCEEDED',
        reason: `Channel [${context.channelType}] max tier is [${channelMaxTierName}], cannot expose [${request.classification}].`,
        timestamp,
      };
    }

    // 4. Purpose Integrity Check
    if (!context.purpose || context.purpose.trim().length === 0) {
      return {
        allowed: false,
        decisionCode: 'UNAUTHORIZED_PURPOSE',
        reason: 'Missing declared access purpose for sovereign vault retrieval.',
        timestamp,
      };
    }

    return {
      allowed: true,
      decisionCode: 'VAULT_ALLOW',
      reason: 'Sovereign vault retrieval authorized under active governance policy.',
      timestamp,
    };
  }
}
