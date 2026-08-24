/**
 * 🌐 Pandora's Sovereign IPFS Stack — Comprehensive Test Suite
 * src/lib/pandoras/core/domains/hermes/knowledge/ipfs/__tests__/sovereign-ipfs.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'node:http';
import { 
  MockIpfsProvider,
  KuboRpcIpfsProvider,
  PinataIpfsProvider,
  SovereignIpfsOrchestrator,
  type IpfsProvider,
} from '../index';
import { SovereignIpfsAlerting } from '../ipfs-alerting';
import { TenantIpfsVaultService } from '../../ipfs-vault';
import { HermesIdentitySigner } from '../../../identity/identity-signer';
import { SafeHttpClient, EgressGuard } from '../../../runtime/egress-guard';
import { resolveIpfsUrl, sanitizeUrl, getIpfsGatewayFallbackUrls } from '@/lib/project-utils';

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
    const pinResult = await orchestrator.pinJson(payload, {
      name: 'agreement_v3',
      category: 'CLAIM_CONTRACT',
    });

    // Verify dual-pin produced distinct CIDs
    expect(pinResult.cid).toBe('bafybei_dagpb_unixfs_kubo_123');
    expect(pinResult.backupCid).toBe('bafyrei_dagjson_pinata_456');
    expect(pinResult.backupMirrored).toBe(true);
    expect(pinResult.replicationStatus).toBe('DURABLE');

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
    expect(pinned.replicationStatus).toBe('REPLICATING');
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
    expect(health.replication.primaryOnline).toBe(true);
    expect(health.replication.backupOnline).toBe(true);
    expect(health.durability.status).toBe('DURABLE');
  });

  it('IPFS-008: SovereignStoragePolicyEngine computes correct replicationStatus per artifact tier', async () => {
    const primaryMock = new MockIpfsProvider();
    const backupMock = new MockIpfsProvider();

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    // 1. Level 3 Claim Contract (Requires synchronous dual-pinning -> DURABLE)
    const claimResult = await orchestrator.pinJson(
      { claim: 'Aztecas SAPI' }, 
      { name: 'snarai_claim.json', category: 'CLAIM_CONTRACT' }
    );
    expect(claimResult.replicationStatus).toBe('DURABLE');
    expect(claimResult.storageCategory).toBe('CLAIM_CONTRACT');
    expect(claimResult.backupMirrored).toBe(true);

    // 2. Single provider only with PUBLIC_DOCUMENT -> LOCAL_ONLY (not degraded because external backup not required)
    const singleOrchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      enableDualPinning: false,
    });
    const publicResult = await singleOrchestrator.pinJson(
      { publicMemo: 'Hello World' },
      { name: 'public.json', category: 'PUBLIC_DOCUMENT' }
    );
    expect(publicResult.replicationStatus).toBe('LOCAL_ONLY');

    // 3. Single provider with CLAIM_CONTRACT -> DEGRADED (because external backup was required but not available)
    const degradedResult = await singleOrchestrator.pinJson(
      { claim: 'Unbacked Claim' },
      { name: 'claim.json', category: 'CLAIM_CONTRACT' }
    );
    expect(degradedResult.replicationStatus).toBe('DEGRADED');
  });

  it('IPFS-009: TenantIpfsVaultService.exportAuditSnapshotToIpfs attaches Level 3 AUDIT_SNAPSHOT policy and DURABLE status', async () => {
    const primaryMock = new MockIpfsProvider();
    const backupMock = new MockIpfsProvider();

    const vault = new TenantIpfsVaultService({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    const mockEvents = [
      {
        id: 'evt_1',
        sequenceNumber: 1,
        eventHash: 'hash_111',
        previousEventHash: null,
        contentHash: null,
        eventType: 'KEY_CREATED',
        severity: 'INFO',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'evt_2',
        sequenceNumber: 2,
        eventHash: 'hash_222',
        previousEventHash: 'hash_111',
        contentHash: null,
        eventType: 'POLICY_EVALUATED',
        severity: 'INFO',
        createdAt: new Date().toISOString(),
      },
    ];

    const snapshot = await vault.exportAuditSnapshotToIpfs('snarai', mockEvents, signer);
    expect(snapshot.ipfsCid.startsWith('bafkrei')).toBe(true);
    expect(snapshot.backupCid).toBeDefined();
    expect(snapshot.replicationStatus).toBe('DURABLE');
    expect(snapshot.merkleRoot).toBeDefined();
    expect(snapshot.agentSignature.startsWith('0x')).toBe(true);
  });

  it('IPFS-010: Comprehensive anti-SSRF regression suite blocks IPv4-mapped IPv6, CGNAT, TEST-NET, Multicast, and ULA', async () => {
    // 1. IPv4-mapped IPv6 to loopback
    const v6Loopback = await EgressGuard.validateUrl('http://[::ffff:127.0.0.1]:8080', { allowPrivateNetwork: false });
    expect(v6Loopback.allowed).toBe(false);

    // 2. IPv4-mapped IPv6 to private RFC1918
    const v6Private = await EgressGuard.validateUrl('http://[::ffff:10.0.0.1]:8080', { allowPrivateNetwork: false });
    expect(v6Private.allowed).toBe(false);

    // 3. IPv4-mapped IPv6 to cloud metadata MUST be blocked even with allowPrivateNetwork: true
    const v6CloudMeta = await EgressGuard.validateUrl('http://[::ffff:169.254.169.254]/latest/meta-data', { allowPrivateNetwork: true });
    expect(v6CloudMeta.allowed).toBe(false);

    // 4. CGNAT (100.64.0.0/10)
    const cgnat = await EgressGuard.validateUrl('http://100.64.1.1:8080', { allowPrivateNetwork: false });
    expect(cgnat.allowed).toBe(false);

    // 5. TEST-NET ranges (192.0.2.1, 198.51.100.1, 203.0.113.1)
    const testNet1 = await EgressGuard.validateUrl('http://192.0.2.1', { allowPrivateNetwork: false });
    expect(testNet1.allowed).toBe(false);
    const testNet2 = await EgressGuard.validateUrl('http://198.51.100.1', { allowPrivateNetwork: false });
    expect(testNet2.allowed).toBe(false);
    const testNet3 = await EgressGuard.validateUrl('http://203.0.113.1', { allowPrivateNetwork: false });
    expect(testNet3.allowed).toBe(false);

    // 6. Multicast & Reserved
    const multicast = await EgressGuard.validateUrl('http://224.0.0.1', { allowPrivateNetwork: false });
    expect(multicast.allowed).toBe(false);
    const reserved = await EgressGuard.validateUrl('http://240.0.0.1', { allowPrivateNetwork: false });
    expect(reserved.allowed).toBe(false);

    // 7. IPv6 Unique Local Address (ULA) & Link-Local
    const ula = await EgressGuard.validateUrl('http://[fc00::1]', { allowPrivateNetwork: false });
    expect(ula.allowed).toBe(false);
    const linkLocal = await EgressGuard.validateUrl('http://[fe80::1]', { allowPrivateNetwork: false });
    expect(linkLocal.allowed).toBe(false);
  });

  it('IPFS-011: Cold-start CID alias rehydration survives process reboot and succeeds on fail-over', async () => {
    // Simulate persistent storage in DB
    const persistedRecord = {
      tenantId: 'snarai',
      artifactId: 'sovereign_governance',
      version: 1,
      ipfsCid: 'bafybei_primary_kubo_cold_1',
      backupIpfsCid: 'bafyrei_backup_pinata_cold_2',
    };

    // Primary store (lost or offline)
    let kuboOnline = false;
    const backupStore = new Map<string, any>();
    backupStore.set('bafyrei_backup_pinata_cold_2', { message: 'Recovered from cold DR backup' });

    const primaryMock: IpfsProvider = {
      providerType: 'KUBO',
      async pinJson() { return 'bafybei_primary_kubo_cold_1'; },
      async fetchJson<T = unknown>(_cid: string): Promise<T> {
        if (!kuboOnline) throw new Error('Kubo daemon down (ECONNREFUSED)');
        return null as any;
      },
      async healthCheck() { return { ok: kuboOnline, providerType: 'KUBO', latencyMs: 5 }; }
    };

    const backupMock: IpfsProvider = {
      providerType: 'PINATA',
      async pinJson() { return 'bafyrei_backup_pinata_cold_2'; },
      async fetchJson(cid) {
        const data = backupStore.get(cid);
        if (!data) throw new Error('Not found in backup');
        return data;
      },
      async healthCheck() { return { ok: true, providerType: 'PINATA', latencyMs: 15 }; }
    };

    // Fresh instance (representing server restart / Railway redeploy)
    const rebootedVault = new TenantIpfsVaultService({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    // Rehydrate CID alias from persisted DB record
    rebootedVault.ipfsOrchestrator.registerCidAlias(persistedRecord.ipfsCid, persistedRecord.backupIpfsCid);

    // Primary fetch fails, but orchestrator uses rehydrated alias to fetch from backup transparently
    const recovered = await rebootedVault.ipfsOrchestrator.fetchJson<any>(persistedRecord.ipfsCid);
    expect(recovered.message).toBe('Recovered from cold DR backup');
  });

  it('IPFS-012: Global alias registry resolves fail-over on a BRAND-NEW instance (cold-start end-to-end)', async () => {
    // Production cold-start sequence: DB loader registers aliases into the
    // STATIC global registry (as claim-contract-engine.ts does) — no instance exists yet.
    SovereignIpfsOrchestrator.registerGlobalCidAlias(
      'bafybei_global_primary_cold',
      'bafyrei_global_backup_cold'
    );

    const backupStore = new Map<string, any>();
    backupStore.set('bafyrei_global_backup_cold', { status: 'recovered_via_global_registry' });

    let primaryUp = false;
    const primaryMock: IpfsProvider = {
      providerType: 'KUBO',
      async pinJson() { return 'bafybei_global_primary_cold'; },
      async fetchJson<T = unknown>(_cid: string): Promise<T> {
        if (!primaryUp) throw new Error('Kubo daemon down after redeploy (ECONNREFUSED)');
        return null as any;
      },
      async healthCheck() { return { ok: primaryUp, providerType: 'KUBO', latencyMs: 5 }; },
    };
    const backupMock: IpfsProvider = {
      providerType: 'PINATA',
      async pinJson() { return 'bafyrei_global_backup_cold'; },
      async fetchJson<T = unknown>(cid: string): Promise<T> {
        const data = backupStore.get(cid);
        if (!data) throw new Error(`Backup miss for '${cid}'`);
        return data as unknown as T;
      },
      async exists(cid: string) { return backupStore.has(cid); },
      async healthCheck() { return { ok: true, providerType: 'PINATA', latencyMs: 15 }; },
    };

    // BRAND-NEW orchestrator: empty instance map — must resolve via GLOBAL registry.
    const freshOrchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
    });
    expect(freshOrchestrator.getCidAlias('bafybei_global_primary_cold')).toBe('bafyrei_global_backup_cold');

    // Fail-over must translate the primary CID through the global registry.
    const recovered = await freshOrchestrator.fetchJson<{ status: string }>('bafybei_global_primary_cold');
    expect(recovered.status).toBe('recovered_via_global_registry');

    // exists() must also consult the global registry.
    await expect(freshOrchestrator.exists('bafybei_global_primary_cold')).resolves.toBe(true);

    primaryUp = true;
    primaryMock.fetchJson = async () => ({ status: 'primary_back_online' }) as any;
    const fromPrimary = await freshOrchestrator.fetchJson<{ status: string }>('bafybei_global_primary_cold');
    expect(fromPrimary.status).toBe('primary_back_online');
  });

  it('IPFS-013: Strict CID regex differentiates real CIDs from standard filenames/relative paths', () => {
    // Non-CID strings that start with 'ba' or 'Qm' but are regular filenames or relative paths
    const regularBanner = 'banner-hero-snarai-production-real-estate-project.png';
    const regularBase64 = 'basic-document-attachment-sample-v2-long-path-name.pdf';
    const relativePath = '/assets/images/badges/gold-status-verified.png';

    // Must NOT be treated as IPFS CIDs
    expect(sanitizeUrl(regularBanner)).toBe('https://dash.pandoras.finance/banner-hero-snarai-production-real-estate-project.png');
    expect(sanitizeUrl(regularBase64)).toBe('https://dash.pandoras.finance/basic-document-attachment-sample-v2-long-path-name.pdf');
    expect(sanitizeUrl(relativePath)).toBe('https://dash.pandoras.finance/assets/images/badges/gold-status-verified.png');

    // Real CIDs (CIDv0 and CIDv1)
    const validCidV0 = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
    const validCidV1 = 'bafybeicg2deb4pd2mgx35fvxd5257zskh7r45o66s2e663x37a';
    const ipfsUri = `ipfs://${validCidV0}`;

    expect(resolveIpfsUrl(validCidV0)).toContain(validCidV0);
    expect(resolveIpfsUrl(validCidV1)).toContain(validCidV1);
    expect(resolveIpfsUrl(ipfsUri)).toContain(validCidV0);

    // Multi-gateway fallback list
    const fallbacks = getIpfsGatewayFallbackUrls(validCidV0);
    expect(fallbacks.length).toBeGreaterThanOrEqual(3);
    expect(fallbacks[0]).toContain('pinata.cloud');
    expect(fallbacks[1]).toContain('ipfs.io');

    // Legacy gateway rewrite check
    expect(sanitizeUrl(`https://cloudflare-ipfs.com/ipfs/${validCidV0}`)).toContain(validCidV0);
    expect(sanitizeUrl(`https://ipfs.io/ipfs/${validCidV0}`)).toContain(validCidV0);
  });

  it('IPFS-014: Pinata DR failure during dual-pinning invokes notifyPinataDrDown', async () => {
    const alertSpy = vi.spyOn(SovereignIpfsAlerting, 'notifyPinataDrDown');

    const primaryMock: IpfsProvider = {
      providerType: 'KUBO',
      async pinJson() { return 'bafybei_primary_ok'; },
      async fetchJson<T = unknown>() { return {} as T; },
      async healthCheck() { return { ok: true, providerType: 'KUBO', latencyMs: 5 }; },
    };
    const backupMock: IpfsProvider = {
      providerType: 'PINATA',
      async pinJson() { throw new Error('Pinata 502 Bad Gateway'); },
      async fetchJson<T = unknown>() { throw new Error('Pinata 502 Bad Gateway'); },
      async healthCheck() { return { ok: false, providerType: 'PINATA', latencyMs: 50, error: '502 Bad Gateway' }; },
    };

    const orchestrator = new SovereignIpfsOrchestrator({
      customPrimary: primaryMock,
      customBackup: backupMock,
      enableDualPinning: true,
    });

    const pinResult = await orchestrator.pinJson({ test: 'legal_doc' }, {
      name: 'agreement.json',
      category: 'LEGAL_AGREEMENT',
    });

    expect(pinResult.replicationStatus).toBe('DEGRADED');
    expect(pinResult.backupMirrored).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('502 Bad Gateway'),
      affectedCategory: 'LEGAL_AGREEMENT',
    }));

    alertSpy.mockRestore();
  });
});
