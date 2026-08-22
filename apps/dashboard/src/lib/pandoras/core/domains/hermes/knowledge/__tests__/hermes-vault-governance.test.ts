/**
 * 🏛️ Pandora's Hermes OS — Milestone 8.0: K25 Sovereign Vault Governance & Identity Certification
 * src/lib/pandoras/core/domains/hermes/knowledge/__tests__/hermes-vault-governance.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VaultAuthorizationGate } from '../vault-authorization-gate';
import { KnowledgeRegistryManifestBuilder, type KnowledgeRegistryItem } from '../registry-manifest';
import { ShadowVerificationEngine } from '../shadow-verifier';
import { TenantIpfsVaultService } from '../ipfs-vault';
import { HermesIdentitySigner } from '../../identity/identity-signer';

describe('Hermes OS Milestone 8.0 — K25 Sovereign Vault Governance & Knowledge Identity', () => {
  let gate: VaultAuthorizationGate;
  let signer: HermesIdentitySigner;
  let vaultService: TenantIpfsVaultService;
  let shadowVerifier: ShadowVerificationEngine;

  beforeEach(() => {
    gate = new VaultAuthorizationGate();
    signer = new HermesIdentitySigner();
    vaultService = new TenantIpfsVaultService();
    shadowVerifier = new ShadowVerificationEngine(vaultService);
  });

  describe('K25.3: Vault Authorization Gate & Contextual Boundary Defense', () => {
    it('ALLOWS retrieval when tenant, clearance, channel, and purpose are fully aligned', () => {
      const decision = gate.evaluate(
        {
          sessionTenantId: 'pandoras',
          actorId: 'founder_01',
          actorClearance: 'SECRET',
          channelType: 'INTERNAL_WORKBENCH',
          purpose: 'Corporate restructuring audit',
        },
        {
          targetTenantId: 'pandoras',
          artifactId: 'libro_0_constitution',
          classification: 'CONFIDENTIAL',
          ipfsCid: 'mock_bafkreiconstitution',
          domain: 'corporate_constitution',
        }
      );

      expect(decision.allowed).toBe(true);
      expect(decision.decisionCode).toBe('VAULT_ALLOW');
    });

    it('DENIES cross-tenant retrieval attempt (Cross-Tenant Boundary Invariant)', () => {
      const decision = gate.evaluate(
        {
          sessionTenantId: 'snarai',
          actorId: 'snarai_admin',
          actorClearance: 'CONFIDENTIAL',
          channelType: 'AUTHENTICATED_WEB',
          purpose: 'Market analysis',
        },
        {
          targetTenantId: 'pandoras',
          artifactId: 'libro_iii_treasury',
          classification: 'CONFIDENTIAL',
          ipfsCid: 'mock_bafkreitreasury',
          domain: 'corporate_constitution',
        }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.decisionCode).toBe('CROSS_TENANT_VAULT_DENIED');
      expect(decision.reason).toContain('session tenant [snarai] cannot access vault artifact of [pandoras]');
    });

    it('DENIES retrieval when actor clearance is lower than artifact classification', () => {
      const decision = gate.evaluate(
        {
          sessionTenantId: 'pandoras',
          actorId: 'intern_user',
          actorClearance: 'PUBLIC',
          channelType: 'INTERNAL_WORKBENCH',
          purpose: 'Curiosity read',
        },
        {
          targetTenantId: 'pandoras',
          artifactId: 'estructura_empresarial_llc',
          classification: 'SECRET',
          ipfsCid: 'mock_bafkreillc',
          domain: 'legal_holding',
        }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.decisionCode).toBe('INSUFFICIENT_CLEARANCE');
      expect(decision.reason).toContain('Actor clearance [PUBLIC] is lower than artifact classification [SECRET]');
    });

    it('DENIES disclosure when channel maximum clearance ceiling is exceeded', () => {
      const decision = gate.evaluate(
        {
          sessionTenantId: 'snarai',
          actorId: 'buyer_lead',
          actorClearance: 'CONFIDENTIAL',
          channelType: 'TELEGRAM', // Telegram max tier is TENANT_RESTRICTED
          purpose: 'Client inquiry',
        },
        {
          targetTenantId: 'snarai',
          artifactId: 'founder_cap_table',
          classification: 'CONFIDENTIAL',
          ipfsCid: 'mock_bafkreicaptable',
          domain: 'patrimonial_admin',
        }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.decisionCode).toBe('CHANNEL_CEILING_EXCEEDED');
      expect(decision.reason).toContain('Channel [TELEGRAM] max tier is [TENANT_RESTRICTED], cannot expose [CONFIDENTIAL]');
    });
  });

  describe('K25.2 & K25.4: Knowledge Registry Manifest & Merkle Roots', () => {
    it('computes deterministic Merkle root and signs EIP-712 manifest with Agent Wallet', async () => {
      const items: KnowledgeRegistryItem[] = [
        {
          id: 'kr_1',
          tenantId: 'pandoras',
          domain: 'corporate_constitution',
          artifactId: 'libro_0',
          classification: 'CONFIDENTIAL',
          version: 1,
          contentHash: '1111111111111111111111111111111111111111111111111111111111111111',
          ipfsCid: 'mock_bafkreilibro0',
          ipfsUri: 'ipfs://mock_bafkreilibro0',
        },
        {
          id: 'kr_2',
          tenantId: 'pandoras',
          domain: 'corporate_constitution',
          artifactId: 'libro_i',
          classification: 'CONFIDENTIAL',
          version: 1,
          contentHash: '2222222222222222222222222222222222222222222222222222222222222222',
          ipfsCid: 'mock_bafkreilibro1',
          ipfsUri: 'ipfs://mock_bafkreilibro1',
        },
      ];

      const builder = new KnowledgeRegistryManifestBuilder();
      const manifest = await builder.buildAndSignManifest('pandoras', 'corporate_constitution', items, signer);

      expect(manifest.manifestId).toBeDefined();
      expect(manifest.tenantId).toBe('pandoras');
      expect(manifest.merkleRoot).toBeDefined();
      expect(manifest.merkleRoot.length).toBe(64);
      expect(manifest.totalArtifacts).toBe(2);
      expect(manifest.signedByAddress).toBe(signer.getPublicAddress());
      expect(manifest.agentSignature.startsWith('0x')).toBe(true);
    });
  });

  describe('K25.4: Phase B Shadow Verification & Decryption Equivalence', () => {
    it('certifies 100% SHA-256 match between decrypted IPFS payload and raw DB plaintext', async () => {
      const rawText = '# S\'Narai Luxury Beachfront Penthouse Terms\nUnit 401 pricing: 1.2M USD.';

      const encrypted = await vaultService.storeEncryptedKnowledgeToIpfs(
        rawText,
        {
          tenantId: 'snarai',
          artifactId: 'penthouse_terms',
          version: 1,
          classification: 'TENANT_RESTRICTED',
        },
        signer
      );

      const verification = await shadowVerifier.verifyArtifact(
        'snarai',
        'penthouse_terms',
        rawText,
        encrypted.encryptedMetadata,
        1
      );

      expect(verification.match).toBe(true);
      expect(verification.aadValidated).toBe(true);
      expect(verification.dbContentHash).toBe(verification.ipfsContentHash);
      expect(verification.decryptionLatencyMs).toBeLessThan(100);
    });
  });
});
