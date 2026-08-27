import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentHasher } from '../document-hasher';
import { EIP712Builder } from '../eip712-builder';
import { EvidencePackager } from '../evidence-packager';
import { StandaloneVerifierGenerator } from '../standalone-verifier';
import { privateKeyToAccount } from 'viem/accounts';

describe('📜 Sovereign Sign / Evidence Layer — Domain Core Tests', () => {
  // Deterministic test private key
  const TEST_PRIV_KEY = '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f36fe30' as const;
  const account = privateKeyToAccount(TEST_PRIV_KEY);

  describe('1. DocumentHasher', () => {
    it('computes exact SHA-256 digest for raw buffers', () => {
      const buffer = Buffer.from('%PDF-1.4 Mock Contract Content For Testing', 'utf8');
      const hash = DocumentHasher.hashBuffer(buffer);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('computes deterministic root evidence hash from components', () => {
      const docHash = '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';
      const sigsHash = '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b';
      const manifestHash = '112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00';

      const root1 = DocumentHasher.computeRootEvidenceHash(docHash, sigsHash, manifestHash);
      const root2 = DocumentHasher.computeRootEvidenceHash(docHash, sigsHash, manifestHash);

      expect(root1).toBe(root2);
      expect(root1.length).toBe(64);
    });
  });

  describe('2. EIP-712 Typed Data & Verification', () => {
    it('constructs canonical EIP-712 payload and verifies valid cryptographic signature', async () => {
      const envelopeId = 'env-uuid-1234';
      const orgId = 'snarai';
      const docTitle = 'Acuerdo de Confidencialidad y Trato Directo';
      const docHash = '0x4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';
      const signerEmail = 'inversionista@snarai.com';
      const signerRole = 'SIGNER';
      const signedAt = 1787700000;

      const typedData = EIP712Builder.buildTypedData({
        envelopeId,
        organizationId: orgId,
        documentTitle: docTitle,
        documentHash: docHash,
        signerEmail,
        signerRole,
        signedAt,
        chainId: 8453,
      });

      // Sign with viem account
      const signature = await account.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      expect(signature).toBeDefined();
      expect(signature.startsWith('0x')).toBe(true);

      // Verify with EIP712Builder
      const result = await EIP712Builder.verifySignature({
        signerAddress: account.address,
        signature,
        envelopeId,
        organizationId: orgId,
        documentTitle: docTitle,
        documentHash: docHash,
        signerEmail,
        signerRole,
        signedAt,
        chainId: 8453,
      });

      expect(result.isValid).toBe(true);
    });

    it('rejects signature if signer address does not match', async () => {
      const envelopeId = 'env-uuid-1234';
      const orgId = 'snarai';
      const docTitle = 'Acuerdo de Confidencialidad';
      const docHash = '0x4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';
      const signerEmail = 'inversionista@snarai.com';
      const signerRole = 'SIGNER';
      const signedAt = 1787700000;

      const typedData = EIP712Builder.buildTypedData({
        envelopeId,
        organizationId: orgId,
        documentTitle: docTitle,
        documentHash: docHash,
        signerEmail,
        signerRole,
        signedAt,
        chainId: 8453,
      });

      const signature = await account.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      // Verification with an impostor address
      const impostorAddress = '0x0000000000000000000000000000000000000001';
      const result = await EIP712Builder.verifySignature({
        signerAddress: impostorAddress,
        signature,
        envelopeId,
        organizationId: orgId,
        documentTitle: docTitle,
        documentHash: docHash,
        signerEmail,
        signerRole,
        signedAt,
        chainId: 8453,
      });

      expect(result.isValid).toBe(false);
    });
  });

  describe('3. EvidencePackager & Standalone Verifier', () => {
    it('generates complete Evidence Package v1 with manifest and standalone HTML', () => {
      const mockEnvelope: any = {
        envelopeId: 'env-uuid-999',
        organizationId: 'snarai',
        title: 'Contrato Marco de Inversión Inmobiliaria',
        documentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        canonicalDocumentCid: 'mock_bafkrei_pdf_doc',
        backupDocumentCid: 'mock_bafkrei_backup_pinata',
        documentVersion: 1,
        documentSize: 204800,
        mimeType: 'application/pdf',
        signingPolicy: 'PARALLEL',
        signers: [
          {
            signerId: 'signer-1',
            email: 'founder@snarai.com',
            name: 'Founder S\'Narai',
            role: 'SIGNER',
            orderIndex: 0,
            status: 'SIGNED',
            signatureProof: {
              signingMethod: 'WALLET_EIP712',
              signerAddress: '0x1111111111111111111111111111111111111111',
              signature: '0xmock_sig_1',
              signedDocumentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              typedDataPayload: {},
              signedAt: '2026-08-26T20:00:00.000Z',
            },
          },
        ],
        status: 'COMPLETED',
        createdAt: '2026-08-26T19:00:00.000Z',
        completedAt: '2026-08-26T20:00:00.000Z',
      };

      const auditTrail = [
        { at: mockEnvelope.createdAt, actor: 'SYSTEM', action: 'EnvelopeCreated' },
        { at: '2026-08-26T20:00:00.000Z', actor: 'founder@snarai.com', action: 'DocumentSigned' },
        { at: mockEnvelope.completedAt, actor: 'SYSTEM', action: 'EnvelopeCompleted' },
      ];

      const pkg = EvidencePackager.assemble(mockEnvelope, auditTrail);

      expect(pkg.envelopeId).toBe('env-uuid-999');
      expect(pkg.manifest.manifestVersion).toBe('1.0');
      expect(pkg.manifest.totalSigners).toBe(1);
      expect(pkg.manifest.status).toBe('COMPLETED');
      expect(pkg.rootEvidenceHash).toBeDefined();
      expect(pkg.rootEvidenceHash.length).toBe(64);

      // Verify standalone HTML is generated with embedded Web Crypto API
      expect(pkg.verifyHtml).toContain('<!DOCTYPE html>');
      expect(pkg.verifyHtml).toContain('Sovereign Evidence Verifier');
      expect(pkg.verifyHtml).toContain('crypto.subtle.digest');
    });
  });

  describe('4. SovereignRelayerService & Gas Options', () => {
    it('gracefully handles missing relayer keys without crashing (Option A fallback)', async () => {
      const { SovereignRelayerService } = await import('../relayer-service');
      const result = await SovereignRelayerService.autoAnchorEnvelope({
        envelopeId: 'env-no-key-001',
        documentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        rootEvidenceHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        evidencePackageCid: 'mock_bafkrei_cid',
        organizationId: 'snarai',
        signersCount: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
