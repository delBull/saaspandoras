/**
 * 🌐 Pandora's Sovereign IPFS Stack — Storage Policy Engine
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/storage-policy.ts
 *
 * Enforces institutional durability, replication requirements, and DR guarantees
 * according to artifact sensitivity and legal/epistemic weight.
 */

import crypto from 'crypto';
import { 
  ArtifactStorageCategory, 
  StorageDurabilityPolicy,
  DurabilityProof,
  IpfsReplicationStatus,
} from './contracts';

export class SovereignStoragePolicyEngine {
  private static readonly DEFAULT_POLICIES: Record<ArtifactStorageCategory, StorageDurabilityPolicy> = {
    PUBLIC_DOCUMENT: {
      minReplicationCopies: 1,
      requireExternalBackup: false,
      synchronousMirror: false,
      description: 'Public marketing & general docs (Level 1: Sovereign Kubo primary)',
    },
    KNOWLEDGE_VAULT: {
      minReplicationCopies: 2,
      requireExternalBackup: true,
      synchronousMirror: false,
      description: 'Encrypted tenant knowledge (Level 2: Kubo + async Pinata redundancy)',
    },
    CLAIM_CONTRACT: {
      minReplicationCopies: 2,
      requireExternalBackup: true,
      synchronousMirror: true,
      description: 'Institutional Epistemic Claims (Level 3: Synchronous dual-pin + EIP-712 proof)',
    },
    AUDIT_SNAPSHOT: {
      minReplicationCopies: 2,
      requireExternalBackup: true,
      synchronousMirror: true,
      description: 'Append-only Merkle audit chain (Level 3: Synchronous dual-pin for compliance)',
    },
    AGENT_SOUL: {
      minReplicationCopies: 2,
      requireExternalBackup: true,
      synchronousMirror: true,
      description: 'Tenant Agent Identity & Policy manifest (Level 3: High durability)',
    },
    ACADEMY_RUBRIC: {
      minReplicationCopies: 2,
      requireExternalBackup: true,
      synchronousMirror: false,
      description: 'Evaluator rubrics and benchmark standards (Level 2: Dual-pinned)',
    },
  };

  /**
   * Computes the deterministic SHA-256 content hash of any payload.
   */
  public static computeCanonicalContentHash(data: unknown): string {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(serialized, 'utf8').digest('hex');
  }

  /**
   * Resolves the effective durability policy for a given storage category,
   * applying any caller-provided overrides.
   */
  public static resolvePolicy(
    category?: ArtifactStorageCategory,
    override?: Partial<StorageDurabilityPolicy>
  ): StorageDurabilityPolicy {
    const defaultCategory: ArtifactStorageCategory = category || 'KNOWLEDGE_VAULT';
    const basePolicy = this.DEFAULT_POLICIES[defaultCategory] || this.DEFAULT_POLICIES.KNOWLEDGE_VAULT;

    if (!override) {
      return basePolicy;
    }

    return {
      minReplicationCopies: override.minReplicationCopies ?? basePolicy.minReplicationCopies,
      requireExternalBackup: override.requireExternalBackup ?? basePolicy.requireExternalBackup,
      synchronousMirror: override.synchronousMirror ?? basePolicy.synchronousMirror,
      description: override.description ?? basePolicy.description,
    };
  }

  /**
   * Evaluates if a given pinning outcome satisfies the required durability policy.
   */
  public static evaluateReplicationStatus(
    primarySuccess: boolean,
    backupSuccess: boolean,
    policy: StorageDurabilityPolicy
  ): IpfsReplicationStatus {
    if (!primarySuccess && !backupSuccess) {
      return 'FAILED';
    }

    if (primarySuccess && backupSuccess) {
      return 'DURABLE';
    }

    if (primarySuccess && !backupSuccess) {
      if (!policy.requireExternalBackup) {
        return 'LOCAL_ONLY';
      }
      return 'DEGRADED';
    }

    // Primary failed, but backup succeeded
    return 'DEGRADED';
  }

  /**
   * Constructs a verifiable DurabilityProof binding the canonical content hash
   * to verified physical storage locations.
   */
  public static buildDurabilityProof(params: {
    data: unknown;
    primaryCid: string;
    backupCid?: string;
    tenantId?: string;
    category: ArtifactStorageCategory;
    policy: StorageDurabilityPolicy;
    primarySuccess: boolean;
    backupSuccess: boolean;
  }): DurabilityProof {
    const verifiedReplicas: string[] = [];
    if (params.primarySuccess && params.primaryCid) {
      verifiedReplicas.push(`primary:${params.primaryCid}`);
    }
    if (params.backupSuccess && params.backupCid) {
      verifiedReplicas.push(`backup:${params.backupCid}`);
    }

    const replicationStatus = this.evaluateReplicationStatus(
      params.primarySuccess,
      params.backupSuccess,
      params.policy
    );

    return {
      canonicalContentHash: this.computeCanonicalContentHash(params.data),
      primaryCid: params.primaryCid,
      backupCid: params.backupCid,
      tenantId: params.tenantId,
      category: params.category,
      requiredCopies: params.policy.minReplicationCopies,
      verifiedReplicas,
      replicationStatus,
      verifiedAt: new Date().toISOString(),
    };
  }
}
