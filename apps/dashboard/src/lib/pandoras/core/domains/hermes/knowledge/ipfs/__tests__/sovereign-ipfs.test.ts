/**
 * 🌐 Pandora's Sovereign IPFS Stack — Comprehensive Test Suite
 * src/lib/pandoras/core/domains/hermes/knowledge/ipfs/__tests__/sovereign-ipfs.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { 
  MockIpfsProvider,
  KuboRpcIpfsProvider,
  PinataIpfsProvider,
  SovereignIpfsOrchestrator,
  type IpfsProvider,
} from '../index';
import { TenantIpfsVaultService } from '../../ipfs-vault';
import { HermesIdentitySigner } from '../../../identity/identity-signer';
import { SafeHttpClient, EgressGuard } from '../../../runtime/egress-guard';

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

  it('IPFS-002: KuboRpcIpfsProvider handles HTTP RPC /api/v0/add, auth headers, and loopback communication', async () => {
    let capturedAuthHeader = '';
    let capturedApiKeyHeader = '';
    let capturedBody = '';
    const mockKuboCid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
    const samplePayload = { title: 'Sovereign Knowledge', status: 'ACTIVE' };

    // Setup local HTTP mock server for Kubo RPC
    const server = http.createServer((req, res) => {
      capturedAuthHeader = req.headers['authorization'] || '';
      capturedApiKeyHeader = (req.headers['x-api-key'] as string) || '';

      if (req.url?.startsWith('/api/v0/add')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          capturedBody = body;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ Hash: mockKuboCid, Size: '128' }));
        });
      } else if (req.url?.startsWith('/api/v0/cat')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(samplePayload));
      } else if (req.url?.startsWith('/api/v0/version')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ Version: '0.26.0', Commit: 'e2b3c4d' }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as any).port;
    const rpcUrl = `http://127.0.0.1:${port}`;

    try {
      const kubo = new KuboRpcIpfsProvider({
        rpcUrl,
        gatewayUrl: `${rpcUrl}/ipfs`,
        apiKey: 'secret_sovereign_token_777',
      });

      // 1. Health check
      const health = await kubo.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.version).toBe('0.26.0');

      // 2. Pin JSON to Kubo RPC
      const pinnedCid = await kubo.pinJson(samplePayload, 'sovereign_claim.json');
      expect(pinnedCid).toBe(mockKuboCid);
      expect(capturedAuthHeader).toBe('Bearer secret_sovereign_token_777');
      expect(capturedApiKeyHeader).toBe('secret_sovereign_token_777');
      expect(capturedBody.includes('Sovereign Knowledge')).toBe(true);

      // 3. Fetch JSON from Kubo RPC
      const fetched = await kubo.fetchJson<typeof samplePayload>(mockKuboCid);
      expect(fetched.title).toBe('Sovereign Knowledge');
      expect(fetched.status).toBe('ACTIVE');
    } finally {
      server.close();
    }
  });

  it('IPFS-003: EgressGuard allows trusted private network when allowPrivateNetwork is enabled while blocking Cloud Metadata', async () => {
    // 1. Default without allowPrivateNetwork -> blocks loopback
    const blockedLoopback = await EgressGuard.validateUrl('http://127.0.0.1:5001', { allowPrivateNetwork: false });
    expect(blockedLoopback.allowed).toBe(false);
    expect(blockedLoopback.reason).toContain('RESTRICTED_IP_DESTINATION');

    // 2. With allowPrivateNetwork -> allows loopback
    const allowedLoopback = await EgressGuard.validateUrl('http://127.0.0.1:5001', { allowPrivateNetwork: true });
    expect(allowedLoopback.allowed).toBe(true);

    // 3. Cloud instance metadata is ALWAYS blocked even if allowPrivateNetwork is true
    const blockedMeta = await EgressGuard.validateUrl('http://169.254.169.254/latest/meta-data', { allowPrivateNetwork: true });
    expect(blockedMeta.allowed).toBe(false);
    expect(blockedMeta.reason).toContain('RESTRICTED_IP_DESTINATION');
  });

  it('IPFS-004: SovereignIpfsOrchestrator resolves differing CIDs between Kubo & Pinata via CID alias mapping during fail-over', async () => {
    // Mock Provider A (Kubo UnixFS simulation)
    const kuboMemory = new Map<string, any>();
    let kuboIsOnline = true;
    const kuboMock: IpfsProvider = {
      providerType: 'KUBO',
      async pinJson(data) {
        const cid = 'bafybei_dagpb_unixfs_kubo_123';
        kuboMemory.set(cid, data);
        return cid;
      },
      async fetchJson(cid) {
        if (!kuboIsOnline) throw new Error('Kubo daemon unreachable (Connection Refused)');
        const data = kuboMemory.get(cid);
        if (!data) throw new Error('Kubo CID not found');
        return data;
      },
      async healthCheck() {
        return { ok: kuboIsOnline, providerType: 'KUBO', latencyMs: 5 };
      }
    };

    // Mock Provider B (Pinata dag-json simulation)
    const pinataMemory = new Map<string, any>();
    const pinataMock: IpfsProvider = {
      providerType: 'PINATA',
      async pinJson(data) {
        const cid = 'bafyrei_dagjson_pinata_456';
        pinataMemory.set(cid, data);
        return cid;
      },
      async fetchJson(cid) {
        const data = pinataMemory.get(cid);
        if (!data) throw new Error(`Pinata 404 for CID: ${cid}`);
        return data;
      },
      async healthCheck() {
        return { ok: true, providerType: 'PINATA', latencyMs: 12 };
      }
    };

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: kuboMock,
      customBackup: pinataMock,
      enableDualPinning: true,
    });

    const payload = { document: 'Sovereign Agreement', version: 3 };
    const pinResult = await orchestrator.pinJson(payload, 'agreement_v3');

    // Verify dual-pin produced distinct CIDs
    expect(pinResult.cid).toBe('bafybei_dagpb_unixfs_kubo_123');
    expect(pinResult.backupCid).toBe('bafyrei_dagjson_pinata_456');
    expect(pinResult.backupMirrored).toBe(true);

    // Verify CID alias mapping was automatically registered
    expect(orchestrator.getCidAlias('bafybei_dagpb_unixfs_kubo_123')).toBe('bafyrei_dagjson_pinata_456');

    // 1. Normal fetch via Primary (Kubo)
    const normalFetch = await orchestrator.fetchJson<typeof payload>(pinResult.cid);
    expect(normalFetch.document).toBe('Sovereign Agreement');

    // 2. Outage simulation: Kubo goes down!
    kuboIsOnline = false;

    // 3. Fail-over fetch: Requesting the Kubo CID automatically looks up the Pinata alias CID and succeeds!
    const failoverFetch = await orchestrator.fetchJson<typeof payload>(pinResult.cid);
    expect(failoverFetch.document).toBe('Sovereign Agreement');
    expect(failoverFetch.version).toBe(3);
  });

  it('IPFS-005: SovereignIpfsOrchestrator throws fail-closed immediately in production if no credentials exist', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalJwt = process.env.PINATA_JWT;
    const originalKubo = process.env.PANDORAS_KUBO_RPC_URL;
    (process.env as any).NODE_ENV = 'production';
    delete process.env.PINATA_JWT;
    delete process.env.PANDORAS_KUBO_RPC_URL;

    try {
      const orchestrator = new SovereignIpfsOrchestrator();
      await expect(
        orchestrator.pinJson({ test: 'fail' }, 'test.json')
      ).rejects.toThrow('mandatory in production');
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
      if (originalJwt) process.env.PINATA_JWT = originalJwt;
      if (originalKubo) process.env.PANDORAS_KUBO_RPC_URL = originalKubo;
    }
  });

  it('IPFS-006: TenantIpfsVaultService integrates with SovereignIpfsOrchestrator for EIP-712 anchored envelope storage', async () => {
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
    expect(pinned.backupCid).toBeDefined();
    expect(pinned.agentSignature).toBeDefined();
    expect(pinned.agentSignature!.startsWith('0x')).toBe(true);

    // Decrypt directly from IPFS through orchestrator
    const decrypted = await vault.retrieveAndDecryptFromIpfs(pinned.cid, context);
    expect(decrypted).toBe(plaintext);
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
