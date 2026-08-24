/**
 * 🌐 Pandora's Hermes OS — Sovereign Tenant IPFS Knowledge Vault & Web3 Anchor
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs-vault.ts
 *
 * Implements Decentralized Sovereign Storage for Hermes Tenants:
 * 1. Envelope Encryption (AES-256-GCM + AAD) of sensitive knowledge artifacts.
 * 2. Immutable IPFS Pinning (Pinata / Fleek / IPFS Gateway) for zero-knowledge decentralized retention.
 * 3. Cryptographic Agent Wallet Attestation (EIP-712) binding the IPFS CID to the tenant identity.
 * 4. Verifiable Audit Spine Snapshots: Packaging append-only security event chains to IPFS for trustless compliance.
 */

import crypto from 'crypto';
import { 
  KnowledgeEnvelopeVault, 
  type EncryptedKnowledgeArtifact, 
  type EncryptionContextAAD 
} from './envelope-vault';
import { EphemeralMemoryScrubber } from '../runtime/sandbox/memory-scrubber';
import { HermesIdentitySigner } from '../identity/identity-signer';
import { SafeHttpClient } from '../runtime/egress-guard';
import { VaultAuthorizationGate, type VaultAccessContext } from './vault-authorization-gate';
import { 
  SovereignIpfsOrchestrator, 
  MockIpfsProvider,
  type SovereignIpfsConfig,
  type IpfsProvider,
} from './ipfs';

export type { EncryptedKnowledgeArtifact, EncryptionContextAAD };

export interface IpfsPinnedArtifact {
  cid: string;
  ipfsUri: string;
  contentHash: string;
  tenantId: string;
  artifactId: string;
  version: number;
  encryptedMetadata: EncryptedKnowledgeArtifact;
  agentSignature?: string;
  pinnedAt: string;
}

export interface IpfsAuditSnapshot {
  snapshotId: string;
  tenantId: string;
  merkleRoot: string;
  totalEvents: number;
  startSequence: number;
  endSequence: number;
  ipfsCid: string;
  ipfsUri: string;
  signedByAddress: string;
  agentSignature: string;
  timestamp: string;
}

export interface TenantIpfsVaultOptions extends SovereignIpfsConfig {
  kekProvider?: any;
}

export class TenantIpfsVaultService {
  private envelopeVault: KnowledgeEnvelopeVault;
  private pinataJwt?: string;
  private pinataGateway: string;
  private authGate: VaultAuthorizationGate;
  private orchestrator: SovereignIpfsOrchestrator;

  constructor(options?: TenantIpfsVaultOptions) {
    this.envelopeVault = new KnowledgeEnvelopeVault(options?.kekProvider);
    this.pinataJwt = options?.pinataJwt || process.env.PINATA_JWT;
    this.pinataGateway = options?.pinataGateway || process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
    this.authGate = new VaultAuthorizationGate();
    this.orchestrator = new SovereignIpfsOrchestrator(options);
  }

  public get authorizationGate(): VaultAuthorizationGate {
    return this.authGate;
  }

  public get ipfsOrchestrator(): SovereignIpfsOrchestrator {
    return this.orchestrator;
  }

  /**
   * Encrypts a knowledge document, pins the encrypted artifact to IPFS,
   * and cryptographically signs the IPFS anchor with the Tenant's Hermes Agent Wallet (EIP-712).
   */
  public async storeEncryptedKnowledgeToIpfs(
    plaintext: string,
    context: EncryptionContextAAD,
    agentSigner: HermesIdentitySigner
  ): Promise<IpfsPinnedArtifact> {
    if (!agentSigner) {
      throw new Error('[TenantIpfsVault] HermesIdentitySigner is mandatory to anchor knowledge to IPFS.');
    }

    // 1. Envelope Encryption with AAD & Multi-Pass Zeroization
    const encryptedArtifact = await this.envelopeVault.encryptArtifact(plaintext, context);

    // 2. Prepare Canonical JSON Payload for IPFS Pinning
    const payloadString = JSON.stringify(encryptedArtifact);
    const contentHash = crypto.createHash('sha256').update(payloadString, 'utf8').digest('hex');

    // 3. Pin to IPFS (via Pinata API or Deterministic Mock Gateway in dev/test)
    const cid = await this.pinJsonToIpfs(encryptedArtifact, `hermes_${context.tenantId}_${context.artifactId}_v${context.version}`);

    // 4. Mandatory: Cryptographically sign the IPFS Anchor with Tenant Agent Wallet (EIP-712)
    const signedIntent = await agentSigner.signIntent({
      tenantId: context.tenantId,
      actorId: `agent_wallet_${context.tenantId}`,
      actionName: 'knowledge.ipfs_pin',
      resourceId: cid,
      policyHash: contentHash,
    });

    return {
      cid,
      ipfsUri: `ipfs://${cid}`,
      contentHash,
      tenantId: context.tenantId,
      artifactId: context.artifactId,
      version: context.version,
      encryptedMetadata: encryptedArtifact,
      agentSignature: signedIntent.signature,
      pinnedAt: new Date().toISOString(),
    };
  }

  /**
   * Directly decrypts an encrypted artifact metadata object using Envelope Vault.
   */
  public async decryptArtifact(
    encryptedArtifact: EncryptedKnowledgeArtifact,
    expectedContext: EncryptionContextAAD,
    authContext?: VaultAccessContext
  ): Promise<string> {
    if (authContext) {
      const decision = this.authGate.evaluate(authContext, {
        targetTenantId: expectedContext.tenantId,
        artifactId: expectedContext.artifactId,
        classification: expectedContext.classification,
        ipfsCid: encryptedArtifact.contentHash,
        domain: 'knowledge_vault',
      });
      if (!decision.allowed) {
        throw new Error(`[VaultAuthorizationGate] ${decision.decisionCode}: ${decision.reason}`);
      }
    }
    return await this.envelopeVault.decryptArtifact(encryptedArtifact, expectedContext);
  }

  /**
   * Retrieves an encrypted artifact from IPFS and decrypts it strictly in RAM.
   * Gated by VaultAuthorizationGate contextual policy.
   */
  public async retrieveAndDecryptFromIpfs(
    cid: string,
    expectedContext: EncryptionContextAAD,
    authContext?: VaultAccessContext
  ): Promise<string> {
    if (authContext) {
      const decision = this.authGate.evaluate(authContext, {
        targetTenantId: expectedContext.tenantId,
        artifactId: expectedContext.artifactId,
        classification: expectedContext.classification,
        ipfsCid: cid,
        domain: 'knowledge_vault',
      });
      if (!decision.allowed) {
        throw new Error(`[VaultAuthorizationGate] ${decision.decisionCode}: ${decision.reason}`);
      }
    }

    // 1. Fetch ciphertext JSON from IPFS Gateway
    const encryptedArtifact = await this.fetchJsonFromIpfs<EncryptedKnowledgeArtifact>(cid);

    // 2. Decrypt Payload using Envelope Vault (with AAD verification and key zeroization)
    return await this.envelopeVault.decryptArtifact(encryptedArtifact, expectedContext);
  }

  /**
   * Packages and exports an append-only security hash chain to IPFS as a verifiable compliance snapshot.
   */
  public async exportAuditSnapshotToIpfs(
    tenantId: string,
    events: Array<{ sequenceNumber: number; eventHash: string; previousEventHash: string; eventType: string; createdAt: string }>,
    agentSigner: HermesIdentitySigner
  ): Promise<IpfsAuditSnapshot> {
    if (!agentSigner) {
      throw new Error('[TenantIpfsVault] HermesIdentitySigner is mandatory to sign audit snapshots.');
    }
    if (!events || events.length === 0) {
      throw new Error('[TenantIpfsVault] Cannot export empty security events to IPFS.');
    }

    // 1. Calculate Merkle Root of event hashes
    const sortedHashes = events.map(e => e.eventHash);
    const merkleRoot = this.computeMerkleRoot(sortedHashes);

    const snapshotPayload = {
      tenantId,
      merkleRoot,
      totalEvents: events.length,
      startSequence: events[0]!.sequenceNumber,
      endSequence: events[events.length - 1]!.sequenceNumber,
      events,
      exportedAt: new Date().toISOString(),
    };

    // 2. Pin Audit Snapshot to IPFS
    const cid = await this.pinJsonToIpfs(snapshotPayload, `hermes_audit_${tenantId}_seq_${snapshotPayload.startSequence}_${snapshotPayload.endSequence}`);

    // 3. Cryptographically Sign the Audit Root with Agent Wallet
    const signedIntent = await agentSigner.signIntent({
      tenantId,
      actorId: `agent_wallet_${tenantId}`,
      actionName: 'audit.ipfs_snapshot',
      resourceId: cid,
      policyHash: merkleRoot,
    });

    return {
      snapshotId: `snap_${Date.now()}_${merkleRoot.substring(0, 8)}`,
      tenantId,
      merkleRoot,
      totalEvents: events.length,
      startSequence: snapshotPayload.startSequence,
      endSequence: snapshotPayload.endSequence,
      ipfsCid: cid,
      ipfsUri: `ipfs://${cid}`,
      signedByAddress: agentSigner.getPublicAddress(),
      agentSignature: signedIntent.signature,
      timestamp: snapshotPayload.exportedAt,
    };
  }

  /**
   * IPFS Pinning Handler.
   * Delegates to SovereignIpfsOrchestrator (Kubo Primary / Pinata Backup / Mock Dev).
   * Fail-Closed in Production if neither Kubo nor Pinata is configured/reachable.
   */
  public async pinJsonToIpfs(data: unknown, name: string): Promise<string> {
    const isProduction = process.env.NODE_ENV === 'production';

    if (
      isProduction &&
      !this.pinataJwt &&
      !process.env.PANDORAS_KUBO_RPC_URL
    ) {
      throw new Error('[TenantIpfsVault] PINATA_JWT is mandatory in production for verifiable IPFS pinning.');
    }

    const pinResult = await this.orchestrator.pinJson(data, name);
    return pinResult.cid;
  }

  /**
   * Computes a canonical RFC4648 CIDv1 base32 multihash (bafkrei...) for arbitrary JSON or buffer
   */
  public static computeCanonicalCidV1(data: unknown): string {
    return MockIpfsProvider.computeCanonicalCidV1(data);
  }

  /**
   * Internal IPFS Retrieval Handler.
   * Delegates to SovereignIpfsOrchestrator with automatic fail-over.
   */
  private async fetchJsonFromIpfs<T>(cid: string): Promise<T> {
    return await this.orchestrator.fetchJson<T>(cid);
  }

  /**
   * Merkle Root computation helper for cryptographic verification
   */
  private computeMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return '0000000000000000000000000000000000000000000000000000000000000000';
    let currentLevel = [...hashes];

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i]!;
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1]! : left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0]!;
  }
}
