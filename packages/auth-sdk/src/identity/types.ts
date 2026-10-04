/**
 * 🏛️ Canonical Identity Graph Types (F1 Core)
 * apps/dashboard/src/lib/identity/types.ts
 *
 * Inviolable Boundary:
 * Canonical Identity ≠ Tenant Membership ≠ Role ≠ Capability ≠ Execution Authority
 *
 * This contract ONLY represents physical/digital actor identity verification across channels.
 * It strictly returns 0 roles, 0 tenant memberships, and 0 execution capabilities.
 */

export type CanonicalIdentifierType = 'wallet' | 'email' | 'phone' | 'telegram';

export type VerificationStatus = 'VERIFIED' | 'SELF_DECLARED' | 'IMPORTED' | 'UNVERIFIED';

export interface CanonicalIdentifierInput {
  type: CanonicalIdentifierType;
  value: string;
  verificationMethod?: string;
  confidence?: VerificationStatus;
}

export interface IdentifierVerificationInfo {
  status: VerificationStatus;
  method?: string;
  verifiedAt?: string; // ISO 8601 string
}

export interface CanonicalIdentityRecord {
  identityId: string;
  userId?: string | null;
  identifiers: {
    wallet?: string | null;
    email?: string | null;
    phone?: string | null;
    telegramId?: string | null;
  };
  verification: Partial<Record<CanonicalIdentifierType, IdentifierVerificationInfo>>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResolveIdentityOptions {
  autoCreate?: boolean;
  organizationId?: string;
  actorId?: string;
}

export interface AttachIdentifierParams {
  identityId: string;
  identifier: CanonicalIdentifierInput;
  organizationId?: string;
  actorId?: string;
  proof?: {
    signature?: string;
    message?: string;
    nonce?: string;
    sourceIp?: string;
    [key: string]: unknown;
  };
}

export interface AttachIdentifierResult {
  success: boolean;
  identity: CanonicalIdentityRecord;
  collision?: {
    existingIdentityId: string;
    conflictIdentifier: string;
    conflictType: CanonicalIdentifierType;
  };
  reason?: string;
}
