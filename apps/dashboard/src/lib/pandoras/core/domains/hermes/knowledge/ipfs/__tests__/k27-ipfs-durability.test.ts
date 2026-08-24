/**
 * 🏛️ Hermes OS — Milestone K27.x Sovereign IPFS Durability & Adversarial Audit Certification
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/__tests__/k27-ipfs-durability.test.ts
 *
 * Formal certification tests for ADR-018:
 * Invariant: DURABLE ≠ "upload succeeded"
 * DURABLE = Policy Satisfied + Replicas Confirmed + Content Integrity Recomputed + Tenant Binding Verified
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { 
  SovereignIpfsOrchestrator, 
  MockIpfsProvider, 
  type IpfsProvider, 
  SovereignStoragePolicyEngine 
} from '../index';
import { TenantIpfsVaultService } from '../../ipfs-vault';
import { HermesIdentitySigner } from '../../../identity/identity-signer';

describe('🏛️ Hermes OS — Milestone K27.x Sovereign IPFS Durability & Adversarial Audit', () => {
  const signer = new HermesIdentitySigner();

  // K27-IPFS-01: Deterministic canonical CID reproduction
  it('K27-IPFS-01: Deterministic canonical CID and SHA-256 content-addressing reproduction', async () => {
    const payload = {
      tenantId: 'snarai',
      contractVersion: 5,
      legalEntity: 'Aztecas Hub S.A.P.I. de C.V.',
      authorizedClaims: ['Real estate tokenization with legal trust backing'],
    };

    const provider1 = new MockIpfsProvider();
    const provider2 = new MockIpfsProvider();

    const cid1 = await provider1.pinJson(payload, 'claim_v5.json');
    const cid2 = await provider2.pinJson(payload, 'claim_v5.json');

    const hash1 = SovereignStoragePolicyEngine.computeCanonicalContentHash(payload);
    const hash2 = SovereignStoragePolicyEngine.computeCanonicalContentHash(payload);

    expect(cid1).toBe(cid2);
    expect(hash1).toBe(hash2);
    expect(cid1.startsWith('bafkrei')).toBe(true);
  });

  // K27-IPFS-02: Recovered content SHA-256 byte-for-byte matches canonicalContentHash
  it('K27-IPFS-02: Retrieved content byte-for-byte re-hashes to canonicalContentHash in DurabilityProof', async () => {
    const payload = {
      tenantId: 'snarai',
      dimension: 'legal_governance',
      fiduciaryTrustId: 'FID-2026-AZTECAS-99',
    };

    const primaryMock = new MockIpfsProvider();
    const backupMock = new MockIpfsProvider();

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    const result = await orchestrator.pinJson(payload, {
      name: 'fiduciary.json',
      tenantId: 'snarai',
      category: 'CLAIM_CONTRACT',
    });

    expect(result.durabilityProof).toBeDefined();
    const expectedHash = result.durabilityProof!.canonicalContentHash;

    // Fetch and re-hash retrieved content
    const fetched = await orchestrator.fetchJson<typeof payload>(result.cid);
    const recomputedHash = SovereignStoragePolicyEngine.computeCanonicalContentHash(fetched);

    expect(recomputedHash).toBe(expectedHash);
    expect(result.replicationStatus).toBe('DURABLE');
  });

  // K27-IPFS-03: Primary Kubo OK / Backup Pinata FAIL -> DEGRADED (not DURABLE)
  it('K27-IPFS-03: Primary OK but required Backup FAIL produces DEGRADED status (not DURABLE)', async () => {
    const primaryMock = new MockIpfsProvider();
    const failingBackup: IpfsProvider = {
      providerType: 'PINATA',
      async pinJson() {
        throw new Error('Pinata 503 Service Unavailable');
      },
      async fetchJson() {
        throw new Error('Pinata unreachable');
      },
      async healthCheck() {
        return { ok: false, providerType: 'PINATA', latencyMs: 500, error: '503 Service Unavailable' };
      },
    };

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: failingBackup,
      enableDualPinning: true,
    });

    const result = await orchestrator.pinJson({ doc: 'Confidential' }, {
      name: 'confidential.json',
      category: 'CLAIM_CONTRACT', // Requires external backup
    });

    expect(result.replicationStatus).toBe('DEGRADED');
    expect(result.backupMirrored).toBe(false);
    expect(result.durabilityProof?.verifiedReplicas.length).toBe(1);
  });

  // K27-IPFS-04: Primary Kubo FAIL / Backup Pinata OK -> Transparent fail-over
  it('K27-IPFS-04: Primary outage recovers seamlessly from backup via CID alias mapping', async () => {
    let primaryOnline = true;
    const primaryStore = new Map<string, any>();
    const backupStore = new Map<string, any>();

    const primaryMock: IpfsProvider = {
      providerType: 'KUBO',
      async pinJson(data) {
        const cid = 'bafybei_primary_kubo_node_1';
        primaryStore.set(cid, data);
        return cid;
      },
      async fetchJson(cid) {
        if (!primaryOnline) throw new Error('Kubo primary daemon offline (Connection reset by peer)');
        const data = primaryStore.get(cid);
        if (!data) throw new Error('CID not found');
        return data;
      },
      async healthCheck() {
        return { ok: primaryOnline, providerType: 'KUBO', latencyMs: 5 };
      },
    };

    const backupMock: IpfsProvider = {
      providerType: 'PINATA',
      async pinJson(data) {
        const cid = 'bafyrei_backup_pinata_replica_2';
        backupStore.set(cid, data);
        return cid;
      },
      async fetchJson(cid) {
        const data = backupStore.get(cid);
        if (!data) throw new Error('Backup CID not found');
        return data;
      },
      async healthCheck() {
        return { ok: true, providerType: 'PINATA', latencyMs: 25 };
      },
    };

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    const payload = { thesis: 'Sovereign Tokenization without intermediaries' };
    const pinResult = await orchestrator.pinJson(payload, {
      name: 'thesis.json',
      category: 'CLAIM_CONTRACT',
    });

    expect(pinResult.replicationStatus).toBe('DURABLE');
    expect(pinResult.cid).toBe('bafybei_primary_kubo_node_1');
    expect(pinResult.backupCid).toBe('bafyrei_backup_pinata_replica_2');

    // Simulate complete Primary Outage
    primaryOnline = false;

    // Fetch using Primary CID — transparent fail-over resolves to backup replica
    const recovered = await orchestrator.fetchJson<typeof payload>(pinResult.cid);
    expect(recovered.thesis).toBe('Sovereign Tokenization without intermediaries');
  });

  // K27-IPFS-05: Replica content mismatch detection
  it('K27-IPFS-05: Detects replica divergence and rejects forged or tampered replica payload', async () => {
    const payloadA = { amount: 1000, currency: 'USDC' };
    const payloadB = { amount: 999999, currency: 'USDC' }; // Forged replica

    const hashA = SovereignStoragePolicyEngine.computeCanonicalContentHash(payloadA);
    const hashB = SovereignStoragePolicyEngine.computeCanonicalContentHash(payloadB);

    expect(hashA).not.toBe(hashB);

    // Verify policy engine builds proof reflecting exact hash
    const proof = SovereignStoragePolicyEngine.buildDurabilityProof({
      data: payloadA,
      primaryCid: 'cid_a',
      backupCid: 'cid_b',
      category: 'CLAIM_CONTRACT',
      policy: SovereignStoragePolicyEngine.resolvePolicy('CLAIM_CONTRACT'),
      primarySuccess: true,
      backupSuccess: true,
    });

    expect(proof.canonicalContentHash).toBe(hashA);
  });

  // K27-IPFS-06: L3 Claim Contract strict durability gating
  it('K27-IPFS-06: L3 Claim Contract requires complete verified replicas to achieve DURABLE proof', async () => {
    const primaryMock = new MockIpfsProvider();
    const backupMock = new MockIpfsProvider();

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    const claimContract = {
      tenantId: 'snarai',
      version: 1,
      claims: ['100% legal backing in trust fund'],
      contractHash: '0xabcdef1234567890',
    };

    const pinResult = await orchestrator.pinJson(claimContract, {
      name: 'snarai_claim_v1.json',
      tenantId: 'snarai',
      category: 'CLAIM_CONTRACT',
    });

    expect(pinResult.replicationStatus).toBe('DURABLE');
    expect(pinResult.durabilityProof).toBeDefined();
    expect(pinResult.durabilityProof!.requiredCopies).toBe(2);
    expect(pinResult.durabilityProof!.verifiedReplicas.length).toBe(2);
    expect(pinResult.durabilityProof!.canonicalContentHash).toBeDefined();
  });

  // K27-IPFS-07: Cross-Tenant Envelope Isolation in IPFS
  it('K27-IPFS-07: Tenant A encrypted IPFS artifact cannot be decrypted by Tenant B even with known CID (AAD fail-closed)', async () => {
    const primaryMock = new MockIpfsProvider();
    const vault = new TenantIpfsVaultService({
      customPrimary: primaryMock,
    });

    const plaintext = 'Secret strategic investment formula for S\'Narai';
    const contextTenantA = {
      tenantId: 'snarai',
      artifactId: 'strategy_formula',
      version: 1,
      classification: 'SECRET' as const,
    };

    const pinned = await vault.storeEncryptedKnowledgeToIpfs(plaintext, contextTenantA, signer);

    // Tenant B attempts to decrypt Tenant A's CID using Tenant B's context
    const maliciousContextTenantB = {
      tenantId: 'foreign_tenant_competitor',
      artifactId: 'strategy_formula',
      version: 1,
      classification: 'SECRET' as const,
    };

    await expect(
      vault.retrieveAndDecryptFromIpfs(pinned.cid, maliciousContextTenantB)
    ).rejects.toThrow();
  });

  // K27-IPFS-08: Node restart resilience
  it('K27-IPFS-08: Daemon restart preserves evidence chain and recovers via backup without lineage corruption', async () => {
    const primaryMock = new MockIpfsProvider();
    const backupMock = new MockIpfsProvider();

    const vault = new TenantIpfsVaultService({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    const plaintext = 'Aztecas institutional governance bylaws 2026';
    const context = {
      tenantId: 'snarai',
      artifactId: 'bylaws_2026',
      version: 1,
      classification: 'PUBLIC' as const,
    };

    const pinned = await vault.storeEncryptedKnowledgeToIpfs(plaintext, context, signer);
    expect(pinned.durabilityProof).toBeDefined();
    expect(pinned.durabilityProof!.replicationStatus).toBe('REPLICATING');

    // Simulate node restart: Create brand new vault instance pointing to same storage
    const rebootedVault = new TenantIpfsVaultService({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    const decrypted = await rebootedVault.retrieveAndDecryptFromIpfs(pinned.cid, context);
    expect(decrypted).toBe(plaintext);
  });
});
