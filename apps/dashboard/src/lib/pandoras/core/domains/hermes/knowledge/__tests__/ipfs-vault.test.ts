/**
 * 🌐 Pandora's Hermes OS — Sovereign Tenant IPFS Knowledge Vault Tests
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/__tests__/ipfs-vault.test.ts
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { TenantIpfsVaultService } from '../ipfs-vault';
import { HermesIdentitySigner } from '../../identity/identity-signer';
import type { EncryptionContextAAD } from '../envelope-vault';

describe('Hermes OS — Sovereign Tenant IPFS Knowledge Vault & Web3 Anchor', () => {
  let vaultService: TenantIpfsVaultService;
  let tenantSigner: HermesIdentitySigner;

  const testPrivateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
  const testContext: EncryptionContextAAD = {
    tenantId: 'snarai_real_estate',
    artifactId: 'doc_investor_terms_2026',
    version: 1,
    classification: 'CONFIDENTIAL',
  };

  beforeAll(() => {
    vaultService = new TenantIpfsVaultService();
    tenantSigner = new HermesIdentitySigner(testPrivateKey);
  });

  it('encrypts sensitive tenant knowledge and pins ciphertext to IPFS with Agent Wallet signature', async () => {
    const sensitiveDoc = 'CONFIDENTIAL: S\'Narai tokenized property appraisal and equity distribution cap table.';

    const result = await vaultService.storeEncryptedKnowledgeToIpfs(
      sensitiveDoc,
      testContext,
      tenantSigner
    );

    // Verify IPFS CID format
    expect(result.cid).toBeDefined();
    expect(result.cid.includes('bafkrei')).toBe(true);
    expect(result.agentSignature).toBeDefined();
    expect(result.agentSignature?.startsWith('0x')).toBe(true);
    expect(result.encryptedMetadata.ciphertext).toBeDefined();
    expect(result.encryptedMetadata.ciphertext).not.toContain('appraisal');
    expect(result.encryptedMetadata.contentHash).toBeDefined();
  });

  it('exports append-only security hash chains as signed Merkle audit snapshots to IPFS', async () => {
    const mockSecurityEvents = [
      {
        sequenceNumber: 1,
        eventHash: '0000000000000000000000000000000000000000000000000000000000000001',
        previousEventHash: '0000000000000000000000000000000000000000000000000000000000000000',
        eventType: 'IDENTITY_REGISTERED',
        createdAt: new Date().toISOString(),
      },
      {
        sequenceNumber: 2,
        eventHash: '0000000000000000000000000000000000000000000000000000000000000002',
        previousEventHash: '0000000000000000000000000000000000000000000000000000000000000001',
        eventType: 'TOOL_AUTHORIZED',
        createdAt: new Date().toISOString(),
      },
    ];

    const snapshot = await vaultService.exportAuditSnapshotToIpfs(
      'snarai_real_estate',
      mockSecurityEvents,
      tenantSigner
    );

    expect(snapshot.snapshotId).toBeDefined();
    expect(snapshot.tenantId).toBe('snarai_real_estate');
    expect(snapshot.merkleRoot).toBeDefined();
    expect(snapshot.merkleRoot.length).toBe(64);
    expect(snapshot.totalEvents).toBe(2);
    expect(snapshot.ipfsCid.includes('bafkrei')).toBe(true);
    expect(snapshot.signedByAddress).toBe(tenantSigner.getPublicAddress());
    expect(snapshot.agentSignature.startsWith('0x')).toBe(true);
  });

  it('FAIL-CLOSED: throws in production mode if PINATA_JWT is missing', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalJwt = process.env.PINATA_JWT;
    const originalKek = process.env.HERMES_KMS_KEK;
    try {
      (process.env as any).NODE_ENV = 'production';
      process.env.HERMES_KMS_KEK = '0123456789012345678901234567890123456789012345678901234567890123';
      delete process.env.PINATA_JWT;

      const prodVault = new TenantIpfsVaultService({ pinataJwt: undefined });
      await expect(
        prodVault.storeEncryptedKnowledgeToIpfs(
          'Confidential memo',
          testContext,
          tenantSigner
        )
      ).rejects.toThrow('[TenantIpfsVault] PINATA_JWT is mandatory in production');
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
      if (originalJwt) process.env.PINATA_JWT = originalJwt;
      if (originalKek) process.env.HERMES_KMS_KEK = originalKek;
      else delete process.env.HERMES_KMS_KEK;
    }
  });

  it('GATED: rejects decryptArtifact when VaultAuthorizationGate denies access', async () => {
    const rawText = 'S\'Narai private term sheet';
    const encrypted = await vaultService.storeEncryptedKnowledgeToIpfs(
      rawText,
      testContext,
      tenantSigner
    );

    // Cross-tenant access attempt: actor from different tenant
    const unauthorizedContext = {
      sessionTenantId: 'unauthorized_hacker_tenant',
      actorId: 'bad_actor',
      actorClearance: 'SECRET' as const,
      channelType: 'INTERNAL_WORKBENCH' as const,
      purpose: 'Exfiltration attempt',
    };

    await expect(
      vaultService.decryptArtifact(
        encrypted.encryptedMetadata,
        testContext,
        unauthorizedContext
      )
    ).rejects.toThrow('[VaultAuthorizationGate] CROSS_TENANT_VAULT_DENIED');
  });
});
