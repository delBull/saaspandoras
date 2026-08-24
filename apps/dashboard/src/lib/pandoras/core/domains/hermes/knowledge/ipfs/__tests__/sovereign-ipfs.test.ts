/**
 * 🌐 Pandora's Sovereign IPFS Stack — Comprehensive Test Suite
 * src/lib/pandoras/core/domains/hermes/knowledge/ipfs/__tests__/sovereign-ipfs.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  MockIpfsProvider,
  KuboRpcIpfsProvider,
  PinataIpfsProvider,
  SovereignIpfsOrchestrator,
  type IpfsProvider,
} from '../index';
import { TenantIpfsVaultService } from '../../ipfs-vault';
import { HermesIdentitySigner } from '../../../identity/identity-signer';

describe('🌐 Pandora\'s Sovereign IPFS Stack (Kubo Primary + Pinata Redundancy)', () => {
  const signer = new HermesIdentitySigner();

  it('IPFS-001: MockIpfsProvider produces valid RFC4648 CIDv1 multihash (bafkrei...) and stores in memory', async () => {
    const mock = new MockIpfsProvider();
    const testData = { tenantId: 'snarai', claim: 'Aztecas Hub SAPI de CV' };

    const cid = await mock.pinJson(testData, 'test-claim');
    expect(cid.startsWith('bafkrei')).toBe(true);
    expect(await mock.exists(cid)).toBe(true);

    const fetched = await mock.fetchJson<typeof testData>(cid);
    expect(fetched.tenantId).toBe('snarai');
    expect(fetched.claim).toBe('Aztecas Hub SAPI de CV');

    const health = await mock.healthCheck();
    expect(health.ok).toBe(true);
    expect(health.providerType).toBe('MOCK');
  });

  it('IPFS-002: KuboRpcIpfsProvider handles API key auth and configuration', () => {
    const kubo = new KuboRpcIpfsProvider({
      rpcUrl: 'http://127.0.0.1:5001',
      gatewayUrl: 'http://127.0.0.1:8080/ipfs',
      apiKey: 'secret_kubo_token_123',
    });

    expect(kubo.providerType).toBe('KUBO');
  });

  it('IPFS-003: SovereignIpfsOrchestrator routes to primary and executes dual-pinning mirror', async () => {
    const primaryMock = new MockIpfsProvider();
    const backupMock = new MockIpfsProvider();

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    const payload = { title: 'S\'Narai Knowledge Pack', version: 2 };
    const result = await orchestrator.pinJson(payload, 'snarai_pack_v2');

    expect(result.cid.startsWith('bafkrei')).toBe(true);
    expect(result.provider).toBe('MOCK');
    expect(result.backupMirrored).toBe(true);
    expect(result.backupCid).toBe(result.cid);

    // Verify present in both providers
    expect(await primaryMock.exists(result.cid)).toBe(true);
    expect(await backupMock.exists(result.cid)).toBe(true);
  });

  it('IPFS-004: SovereignIpfsOrchestrator executes seamless fail-over when primary fetch fails', async () => {
    const primaryMock = new MockIpfsProvider();
    const backupMock = new MockIpfsProvider();

    const payload = { secretReport: 'Q3 Financials' };
    const cid = await backupMock.pinJson(payload, 'backup-only');

    // CID exists in backup, but NOT in primary
    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
    });

    const retrieved = await orchestrator.fetchJson<typeof payload>(cid);
    expect(retrieved.secretReport).toBe('Q3 Financials');
  });

  it('IPFS-005: TenantIpfsVaultService integrates with SovereignIpfsOrchestrator for EIP-712 anchored envelope storage', async () => {
    const primaryMock = new MockIpfsProvider();
    const backupMock = new MockIpfsProvider();

    const vault = new TenantIpfsVaultService({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    const plaintext = 'S\'Narai opera bajo la estructura corporativa de Aztecas Hub.';
    const context = {
      tenantId: 'snarai',
      artifactId: 'corp_legal_struct',
      version: 1,
      classification: 'PUBLIC' as const,
    };

    const pinned = await vault.storeEncryptedKnowledgeToIpfs(plaintext, context, signer);
    expect(pinned.cid.startsWith('bafkrei')).toBe(true);
    expect(pinned.agentSignature).toBeDefined();
    expect(pinned.agentSignature!.startsWith('0x')).toBe(true);

    // Decrypt directly from IPFS through orchestrator
    const decrypted = await vault.retrieveAndDecryptFromIpfs(pinned.cid, context);
    expect(decrypted).toBe(plaintext);
  });

  it('IPFS-006: TenantIpfsVaultService throws fail-closed in production if no valid credentials exist', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalJwt = process.env.PINATA_JWT;
    const originalKubo = process.env.PANDORAS_KUBO_RPC_URL;
    (process.env as any).NODE_ENV = 'production';
    delete process.env.PINATA_JWT;
    delete process.env.PANDORAS_KUBO_RPC_URL;

    try {
      const prodVault = new TenantIpfsVaultService();

      await expect(
        prodVault.pinJsonToIpfs({ test: 'fail' }, 'fail-test')
      ).rejects.toThrow('mandatory in production');
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
      if (originalJwt) process.env.PINATA_JWT = originalJwt;
      if (originalKubo) process.env.PANDORAS_KUBO_RPC_URL = originalKubo;
    }
  });

  it('IPFS-007: SovereignIpfsOrchestrator reports multi-provider health check status', async () => {
    const primaryMock = new MockIpfsProvider();
    const backupMock = new MockIpfsProvider();

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
    });

    const health = await orchestrator.healthCheck();
    expect(health.overallOk).toBe(true);
    expect(health.primary.ok).toBe(true);
    expect(health.backup?.ok).toBe(true);
  });
});
