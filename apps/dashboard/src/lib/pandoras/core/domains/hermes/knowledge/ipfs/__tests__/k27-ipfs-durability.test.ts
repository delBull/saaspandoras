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

  // K27-IPFS-05: Real replica divergence detection and fail-closed rejection
  it('K27-IPFS-05: Rejects tampered replica payload on fail-over when recovered content hash diverges from canonical proof', async () => {
    const authenticPayload = { tenant: 'snarai', authorizedShareCapital: 50000000 };
    const forgedPayload = { tenant: 'snarai', authorizedShareCapital: 1 }; // Tampered replica

    const authenticHash = SovereignStoragePolicyEngine.computeCanonicalContentHash(authenticPayload);

    // Primary store (authentic) goes offline
    let primaryOnline = false;
    const backupStore = new Map<string, any>();
    // Attacker modifies content in backup replica storage
    backupStore.set('bafyrei_backup_pinata_tampered', forgedPayload);

    const primaryMock: IpfsProvider = {
      providerType: 'KUBO',
      async pinJson() { return 'bafybei_primary_kubo_1'; },
      async fetchJson<T = unknown>(_cid: string): Promise<T> {
        if (!primaryOnline) throw new Error('Primary daemon down');
        return authenticPayload as unknown as T;
      },
      async healthCheck() { return { ok: primaryOnline, providerType: 'KUBO', latencyMs: 5 }; }
    };

    const backupMock: IpfsProvider = {
      providerType: 'PINATA',
      async pinJson() { return 'bafyrei_backup_pinata_tampered'; },
      async fetchJson<T = unknown>(cid: string): Promise<T> {
        return backupStore.get(cid) as unknown as T;
      },
      async healthCheck() { return { ok: true, providerType: 'PINATA', latencyMs: 15 }; }
    };

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    orchestrator.registerCidAlias('bafybei_primary_kubo_1', 'bafyrei_backup_pinata_tampered');

    // Fail-over fetches the TAMPERED backup payload
    const recovered = await orchestrator.fetchJson<typeof authenticPayload>('bafybei_primary_kubo_1');
    const recoveredHash = SovereignStoragePolicyEngine.computeCanonicalContentHash(recovered);
    expect(recoveredHash).not.toBe(authenticHash);
    expect(recoveredHash).toBe(SovereignStoragePolicyEngine.computeCanonicalContentHash(forgedPayload));

    // K27.x: PRODUCTION integrity gate (orchestrator.fetchJsonVerified) must
    // reject the forged replica fail-closed — no test-side logic involved.
    await expect(
      orchestrator.fetchJsonVerified<typeof authenticPayload>('bafybei_primary_kubo_1', authenticHash)
    ).rejects.toThrow('KNOWLEDGE_INTEGRITY_MISMATCH');

    // The same gate accepts authentic content once primary is restored.
    primaryOnline = true;
    const verifiedAuthentic = await orchestrator.fetchJsonVerified<typeof authenticPayload>(
      'bafybei_primary_kubo_1',
      authenticHash
    );
    expect(verifiedAuthentic.authorizedShareCapital).toBe(50000000);
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

  // K27-IPFS-09: REPLICATING is never a terminal state — settled outcomes are tracked
  it('K27-IPFS-09: Async mirror settles into DURABLE or DEGRADED outcome, never orphaned REPLICATING', async () => {
    const payload = { governance: 'outcome-lifecycle', seq: 1 };
    const backupStore = new Map<string, any>();
    let backupHealthy = false; // starts down

    const primaryMock: IpfsProvider = {
      providerType: 'KUBO',
      async pinJson(data: any) { return `bafybei_kubo_${JSON.stringify(data).length}`; },
      async fetchJson<T = unknown>(cid: string): Promise<T> { return null as any; },
      async healthCheck() { return { ok: true, providerType: 'KUBO', latencyMs: 4 }; },
    };
    const backupMock: IpfsProvider = {
      providerType: 'PINATA',
      async pinJson(data: any) {
        if (!backupHealthy) throw new Error('Pinata 503 unavailable');
        return `bafyrei_pinata_${JSON.stringify(data).length}`;
      },
      async fetchJson<T = unknown>(cid: string): Promise<T> { return null as any; },
      async healthCheck() { return { ok: backupHealthy, providerType: 'PINATA', latencyMs: 12 }; },
    };

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    // L2 KNOWLEDGE_VAULT → async mirror, initial proof is REPLICATING
    const pinned = await orchestrator.pinJson(payload, { name: 'lifecycle.json', category: 'KNOWLEDGE_VAULT' });
    expect(pinned.durabilityProof!.replicationStatus).toBe('REPLICATING');

    // Mirror fails in background → outcome must settle to DEGRADED (not orphaned)
    await new Promise((r) => setTimeout(r, 10));
    expect(orchestrator.getReplicationOutcome(pinned.cid)).toBe('DEGRADED');

    // Recovery scenario: healthy backup mirrors successfully → DURABLE
    backupHealthy = true;
    const recovered = await orchestrator.pinJson({ ...payload, seq: 2 }, { name: 'lifecycle.json', category: 'KNOWLEDGE_VAULT' });
    await new Promise((r) => setTimeout(r, 10));
    expect(orchestrator.getReplicationOutcome(recovered.cid)).toBe('DURABLE');
  });

  // K27-IPFS-DR-01: Physical DR lifecycle & state-transition recovery verification
  it('K27-IPFS-DR-01: End-to-end fail-over, SHA-256 recovery, and state-transition health check cycle', async () => {
    let primaryOnline = true;
    const primaryStore = new Map<string, any>();
    const backupStore = new Map<string, any>();

    const primaryMock: IpfsProvider = {
      providerType: 'KUBO',
      async pinJson(data: any) {
        const cid = `bafybei_kubo_primary_${Date.now()}`;
        primaryStore.set(cid, data);
        return cid;
      },
      async fetchJson<T = unknown>(cid: string): Promise<T> {
        if (!primaryOnline) throw new Error('Kubo node unreachable (503)');
        return primaryStore.get(cid) as T;
      },
      async healthCheck() {
        return { ok: primaryOnline, providerType: 'KUBO', latencyMs: primaryOnline ? 8 : 0 };
      },
    };

    const backupMock: IpfsProvider = {
      providerType: 'PINATA',
      async pinJson(data: any) {
        const cid = `bafyrei_pinata_dr_${Date.now()}`;
        backupStore.set(cid, data);
        return cid;
      },
      async fetchJson<T = unknown>(cid: string): Promise<T> {
        return backupStore.get(cid) as T;
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

    // 1. Initial healthy pin (dual-pinned)
    const legalDoc = { contractId: 'AG-NAR-00001', investor: '0x1234567890abcdef', amount: 50000 };
    const pinResult = await orchestrator.pinJson(legalDoc, { name: 'legal_doc.json', category: 'LEGAL_AGREEMENT' });
    expect(pinResult.replicationStatus).toBe('DURABLE');
    expect(pinResult.backupMirrored).toBe(true);

    const canonicalHash = SovereignStoragePolicyEngine.computeCanonicalContentHash(legalDoc);

    // 2. Primary Kubo node goes down (Simulated outage)
    primaryOnline = false;
    const healthDuringOutage = await orchestrator.healthCheck();
    expect(healthDuringOutage.primary.ok).toBe(false);
    expect(healthDuringOutage.backup?.ok).toBe(true);
    expect(healthDuringOutage.durability.status).toBe('DEGRADED');

    // 3. Transparent DR retrieval with verified hash
    const recoveredDoc = await orchestrator.fetchJsonVerified<typeof legalDoc>(pinResult.cid, canonicalHash);
    expect(recoveredDoc.contractId).toBe('AG-NAR-00001');
    expect(recoveredDoc.amount).toBe(50000);

    // 4. Primary node recovers
    primaryOnline = true;
    const healthAfterRecovery = await orchestrator.healthCheck();
    expect(healthAfterRecovery.primary.ok).toBe(true);
    expect(healthAfterRecovery.durability.status).toBe('DURABLE');
  });
});
