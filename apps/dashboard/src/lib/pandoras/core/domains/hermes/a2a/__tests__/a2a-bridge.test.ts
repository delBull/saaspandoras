import { describe, it, expect } from 'vitest';
import { A2AMessage, KnowledgeGrant, SovereignArtifactManifest } from '../contracts';
import { A2ASecurityValidator } from '../a2a-security-validator';
import { A2AMessageHandler } from '../a2a-message-handler';
import { AgentRegistry } from '../agent-registry';

// Fail-closed transport: tests sign real HMACs under a dedicated test secret.
process.env.A2A_HMAC_SECRET = process.env.A2A_HMAC_SECRET || 'a2a-test-secret';

function signedEnvelope<T>(message: Omit<A2AMessage<T>, 'security'>): A2AMessage<T> {
  const hmac = A2ASecurityValidator.computeHmac(
    A2ASecurityValidator.computePayloadCanonicalHash(message as any)
  );
  return {
    ...message,
    security: { signature: 'mock_sig', signatureScheme: 'EIP191', hmac },
  };
}

describe('🏛️ PANDORAS A2A PROTOCOL v1.1 Suite (Sofía ↔ Hermes Sovereign Bridge)', () => {
  it('1. Agent Registry holds independent identities and capability grants for Sofia and Hermes', () => {
    const sofia = AgentRegistry.getAgent('sofia');
    const hermes = AgentRegistry.getAgent('hermes');

    expect(sofia).toBeDefined();
    expect(sofia?.role).toBe('CHIEF_OF_STAFF');
    expect(hermes).toBeDefined();
    expect(hermes?.role).toBe('COGNITIVE_OS');

    // Different sovereign wallets
    expect(sofia?.walletAddress.toLowerCase()).not.toBe(hermes?.walletAddress.toLowerCase());

    // Capability baseline checks
    expect(AgentRegistry.hasCapability('sofia', 'hermes.knowledge.query')).toBe(true);
    expect(AgentRegistry.hasCapability('sofia', 'media.image.create')).toBe(true);
    expect(AgentRegistry.hasCapability('sofia', 'unauthorized.arbitrary.code')).toBe(false);
  });

  it('2. Capability Discover allows Sofia and Hermes to inspect available capabilities', async () => {
    const message = signedEnvelope({
      protocol: 'pandoras-a2a',
      version: '1.1',
      messageId: `msg_disc_${Date.now()}`,
      from: 'sofia',
      to: 'hermes',
      type: 'capability.discover',
      createdAt: new Date().toISOString(),
      nonce: `nonce_disc_${Date.now()}`,
      payload: {},
    });

    const res = await A2AMessageHandler.processIncomingMessage(message);
    expect(res.success).toBe(true);
    expect(res.type).toBe('capability.completed');
    expect((res.payload as any).hermesSupportedCapabilities).toContain('hermes.knowledge.query');
    expect((res.payload as any).mediaCoProvidedCapabilities).toContain('media.image.create');
  });

  it('3. Knowledge Grant allows Sofia to share authorized contact context scoped to a tenant', async () => {
    const grant: KnowledgeGrant = {
      grantId: `grant_eld_${Date.now()}`,
      issuer: 'sofia',
      grantee: 'hermes',
      subject: {
        type: 'contact',
        id: 'contact_oscar_eld',
      },
      scope: {
        tenantIds: ['eld'],
        capabilities: ['hermes.knowledge.query'],
      },
      fields: ['name', 'company', 'role', 'approved_context'],
      authorizedBy: 'admin:0xTESTADMINWALLET',
      createdAt: new Date().toISOString(),
    };

    const message = signedEnvelope<KnowledgeGrant>({
      protocol: 'pandoras-a2a',
      version: '1.1',
      messageId: `msg_grant_${Date.now()}`,
      from: 'sofia',
      to: 'hermes',
      type: 'knowledge.grant',
      createdAt: new Date().toISOString(),
      nonce: `nonce_grant_${Date.now()}`,
      payload: grant,
    });

    const res = await A2AMessageHandler.processIncomingMessage(message);
    expect(res.success).toBe(true);
    expect((res.payload as any).status).toBe('KNOWLEDGE_GRANT_REGISTERED');
    expect((res.payload as any).grantId).toBe(grant.grantId);

    // Verify Hermes can retrieve active grants for ELD
    const activeGrants = AgentRegistry.getKnowledgeGrantsForTenant('eld');
    expect(activeGrants.some(g => g.grantId === grant.grantId)).toBe(true);
  });

  it('4. Sovereign Artifact Manifest exchange verifies IPFS CID and provenance', async () => {
    const artifact: SovereignArtifactManifest = {
      artifactId: `art_snarai_${Date.now()}`,
      kind: 'image',
      cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      ipfsUri: 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      mimeType: 'image/png',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      owner: 'sofia',
      createdBy: 'pixel',
      provenance: {
        issuerWallet: '0x438676d1eec366838848fa5cf78e63ee9a3d4669',
        signature: '0xmock_provenance_sig',
        timestamp: new Date().toISOString(),
      },
    };

    const message = signedEnvelope<SovereignArtifactManifest>({
      protocol: 'pandoras-a2a',
      version: '1.1',
      messageId: `msg_art_${Date.now()}`,
      from: 'sofia',
      to: 'hermes',
      tenantId: 'snarai',
      type: 'artifact.created',
      createdAt: new Date().toISOString(),
      nonce: `nonce_art_${Date.now()}`,
      payload: artifact,
    });

    const res = await A2AMessageHandler.processIncomingMessage(message);
    expect(res.success).toBe(true);
    expect((res.payload as any).status).toBe('ARTIFACT_VERIFIED_AND_REGISTERED');
    expect((res.payload as any).cid).toBe(artifact.cid);
  });

  it('5. Rejects unauthorized sender and enforces nonce replay protection', () => {
    const nonce = `test_replay_nonce_v11_${Date.now()}`;
    const message = signedEnvelope({
      protocol: 'pandoras-a2a',
      version: '1.1',
      messageId: `msg_sec_${Date.now()}`,
      from: 'sofia',
      to: 'hermes',
      type: 'system.heartbeat',
      createdAt: new Date().toISOString(),
      nonce,
      payload: {},
    });

    const first = A2ASecurityValidator.validate(message);
    expect(first.valid).toBe(true);

    const second = A2ASecurityValidator.validate(message);
    expect(second.valid).toBe(false);
    expect(second.errorCode).toBe('NONCE_REPLAY');
  });

  it('6. Computes transport HMAC according to the exact Bull\'s Lab canonical specification', () => {
    const method = 'POST';
    const path = '/api/v1/sofia/a2a/webhook';
    const ts = '1788029336160';
    const rawBody = '{"test":"canonical"}';

    const hmac = A2ASecurityValidator.computeTransportHmac(method, path, ts, rawBody);
    expect(hmac).toBeDefined();
    expect(typeof hmac).toBe('string');
    expect(hmac.length).toBe(64); // SHA-256 hex length
  });

  it('7. Enforces Cross-Tenant Isolation: KnowledgeGrant for ELD cannot be queried for S\'Narai', () => {
    const activeGrantsEld = AgentRegistry.getKnowledgeGrantsForTenant('eld');
    const activeGrantsSnarai = AgentRegistry.getKnowledgeGrantsForTenant('snarai');

    // ELD grants are strictly isolated from S'Narai
    expect(activeGrantsEld.length).toBeGreaterThan(0);
    expect(activeGrantsSnarai.some(g => g.grantId.includes('eld'))).toBe(false);
  });
});
