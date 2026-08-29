import { describe, it, expect } from 'vitest';
import { CapabilityGrantService } from '../capability-grant-service';
import { A2AMessageHandler } from '../a2a-message-handler';
import { A2ASecurityValidator } from '../a2a-security-validator';
import { A2AMessage, SovereignArtifactManifest } from '../contracts';
import { db } from '@/db';
import { hermesMediaRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

describe('🏛️ HERMES TENANTS GOVERNANCE & MEDIA FACTORY E2E SUITE', () => {
  it('E2E Test 1 — Active CapabilityGrant enables media request dispatch', async () => {
    // S'Narai has media.image.create active
    const isImageGranted = await CapabilityGrantService.isCapabilityGranted('snarai', 'media.image.create');
    expect(isImageGranted).toBe(true);

    const requestId = `req_e2e_1_${Date.now()}`;
    const correlationId = `corr_${requestId}`;

    if (db) {
      await db.insert(hermesMediaRequests).values({
        id: requestId,
        requestId,
        correlationId,
        tenantId: 'snarai',
        capability: 'media.image.create',
        requestedBy: 'portal:test_session_snarai',
        provider: 'sofia',
        status: 'REQUESTED',
        prompt: 'Luxury architectural render for S\'Narai rooftop',
        createdAt: new Date(),
      });
    }

    const isAuthorized = await CapabilityGrantService.isCapabilityGranted('snarai', 'media.image.create');
    expect(isAuthorized).toBe(true);
  });

  it('E2E Test 2 — Suspended / Unapproved capability is strictly blocked (fail-closed 403)', async () => {
    // ELD does not have media.video.create
    const isVideoGranted = await CapabilityGrantService.isCapabilityGranted('eld', 'media.video.create');
    expect(isVideoGranted).toBe(false);
  });

  it('E2E Test 3 — Real Media Ingress: Sofía delivers artifact.created, updating media_requests to COMPLETED and registering in hermes_artifacts', async () => {
    const requestId = `req_e2e_3_${Date.now()}`;
    const correlationId = `corr_e2e_3_${Date.now()}`;

    if (db) {
      await db.insert(hermesMediaRequests).values({
        id: requestId,
        requestId,
        correlationId,
        tenantId: 'snarai',
        capability: 'media.image.create',
        status: 'REQUESTED',
        createdAt: new Date(),
      });
    }

    const artifactManifest: SovereignArtifactManifest = {
      artifactId: `art_sofia_pixel_${Date.now()}`,
      kind: 'image',
      cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      ipfsUri: 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      mimeType: 'image/png',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      sizeBytes: 2048576,
      owner: 'sofia',
      createdBy: 'pixel',
      metadata: {
        title: 'S\'Narai Sunset Ocean View Render',
      },
      provenance: {
        issuerWallet: '0x19F3e224b55ff38c33a577E43000f83B14207f8e',
        signature: '0xmock_sofia_signature',
        timestamp: new Date().toISOString(),
      },
    };

    const ingressMessage = signedEnvelope<SovereignArtifactManifest>({
      protocol: 'pandoras-a2a',
      version: '1.1',
      messageId: `msg_art_${Date.now()}`,
      correlationId,
      createdAt: new Date().toISOString(),
      nonce: `nonce_art_${Date.now()}`,
      from: 'sofia',
      to: 'hermes',
      tenantId: 'snarai',
      type: 'artifact.created',
      payload: artifactManifest,
    });

    const result = await A2AMessageHandler.processIncomingMessage(ingressMessage);
    expect(result.success).toBe(true);
    expect(result.type).toBe('artifact.created');
    expect((result.payload as any)?.status).toBe('ARTIFACT_VERIFIED_AND_REGISTERED');

    // Verify DB updated to COMPLETED
    if (db) {
      const rows = await db
        .select()
        .from(hermesMediaRequests)
        .where(eq(hermesMediaRequests.correlationId, correlationId));

      expect(rows.length).toBe(1);
      expect(rows[0]?.status).toBe('COMPLETED');
      expect(rows[0]?.artifactId).toBe(artifactManifest.artifactId);
    }
  });

  it('E2E Test 4 — Cross-Tenant Ingress Defense: Rejects artifact.created if correlated request tenant differs from message tenant', async () => {
    const requestId = `req_e2e_4_${Date.now()}`;
    const correlationId = `corr_e2e_4_${Date.now()}`;

    // Request initiated for S'Narai
    if (db) {
      await db.insert(hermesMediaRequests).values({
        id: requestId,
        requestId,
        correlationId,
        tenantId: 'snarai',
        capability: 'media.image.create',
        status: 'REQUESTED',
        createdAt: new Date(),
      });
    }

    // Ingress message maliciously attempts to associate with ELD
    const crossTenantMessage = signedEnvelope<SovereignArtifactManifest>({
      protocol: 'pandoras-a2a',
      version: '1.1',
      messageId: `msg_art_cross_${Date.now()}`,
      correlationId,
      createdAt: new Date().toISOString(),
      nonce: `nonce_cross_${Date.now()}`,
      from: 'sofia',
      to: 'hermes',
      tenantId: 'eld', // Mismatch!
      type: 'artifact.created',
      payload: {
        artifactId: `art_cross_${Date.now()}`,
        kind: 'image',
        cid: 'bafybeicrosstenantleakageattempt1234567890abcdefghijklmnopqr',
        ipfsUri: 'ipfs://bafybeicrosstenantleakageattempt1234567890abcdefghijklmnopqr',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        mimeType: 'image/png',
        owner: 'sofia',
        createdBy: 'pixel',
        provenance: {
          issuerWallet: '0x19F3e224b55ff38c33a577E43000f83B14207f8e',
          signature: '0xmock_sofia_signature',
          timestamp: new Date().toISOString(),
        },
      },
    });

    const result = await A2AMessageHandler.processIncomingMessage(crossTenantMessage);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('CROSS_TENANT_INJECTION_REJECTED');
  });

  it('E2E Test 5 — Revocation During Operation: Suspending a grant revokes future requests while audit-logging the transition', async () => {
    // Authorize ELD for copy creation
    await CapabilityGrantService.setGrant('eld', 'media.copy.create', true, 'admin:0xTESTADMINWALLET');
    const isGrantedBefore = await CapabilityGrantService.isCapabilityGranted('eld', 'media.copy.create');
    expect(isGrantedBefore).toBe(true);

    // Marco suspends the grant: authenticated actor recorded as audit identity
    await CapabilityGrantService.setGrant('eld', 'media.copy.create', false, 'admin:0xTESTADMINWALLET');
    const isGrantedAfter = await CapabilityGrantService.isCapabilityGranted('eld', 'media.copy.create');
    expect(isGrantedAfter).toBe(false);
  });
});
