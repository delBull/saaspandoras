/**
 * 🏛️ Hermes OS — Milestone 6.0: K23 Cryptographic Identity Certification Suite
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/identity/__tests__/hermes-identity-certification.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { HermesIdentitySigner } from '../identity-signer';
import { HermesIdentityVerifier } from '../identity-verifier';
import { HermesToolExecutor } from '../../runtime/tool-executor';
import { db } from '../../../../../../../db';
import { hermesIdentities } from '../../../../../../../db/schema';
import { eq } from 'drizzle-orm';

describe('Hermes OS Milestone 6.0 — K23 Cryptographic Identity Certification', () => {
  const testPrivateKey = '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f360fe2';
  let signer: HermesIdentitySigner;
  let hermesAddress: string;

  beforeAll(async () => {
    signer = new HermesIdentitySigner(testPrivateKey);
    hermesAddress = signer.getPublicAddress();

    // Register active test identity in hermes_identities
    await db
      .insert(hermesIdentities)
      .values({
        id: 'ident_snarai_test_v1',
        publicAddress: hermesAddress,
        tenantId: 'snarai',
        instanceId: 'hermes_snarai_node_01',
        capabilities: ['leads', 'analytics', 'portfolio'],
        policyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 86400 * 1000 * 30), // 30 days
      })
      .onConflictDoUpdate({
        target: hermesIdentities.id,
        set: {
          publicAddress: hermesAddress,
          status: 'ACTIVE',
          capabilities: ['leads', 'analytics', 'portfolio'],
          expiresAt: new Date(Date.now() + 86400 * 1000 * 30),
        }
      });
  });

  afterAll(async () => {
    await db.delete(hermesIdentities).where(eq(hermesIdentities.id, 'ident_snarai_test_v1'));
  });

  // ── K23-IDENT-01: Intent Signing & EIP-712 Verification ────────────────────
  describe('K23-IDENT-01: EIP-712 Intent Signing & Verification', () => {
    it('generates valid EIP-712 signature and successfully verifies signer address', async () => {
      const signedIntent = await signer.signIntent({
        tenantId: 'snarai',
        actorId: 'user_investor_01',
        actionName: 'leads.capture_contact',
        resourceId: 'lead_res_123',
        policyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      expect(signedIntent.intent.hermesAddress).toBe(hermesAddress);
      expect(signedIntent.signature.startsWith('0x')).toBe(true);

      const verification = await HermesIdentityVerifier.verifyIntent(signedIntent, {
        requiredCapability: 'leads',
      });

      expect(verification.valid).toBe(true);
      expect(verification.signerAddress?.toLowerCase()).toBe(hermesAddress.toLowerCase());
    });
  });

  // ── K23-ANTI-TAMPER: Cryptographic Tampering Rejection ─────────────────────
  describe('K23-ANTI-TAMPER: Cryptographic Tampering Rejection', () => {
    it('rejects tampered actionName with signature mismatch', async () => {
      const signedIntent = await signer.signIntent({
        tenantId: 'snarai',
        actorId: 'user_investor_01',
        actionName: 'leads.capture_contact',
        resourceId: 'lead_res_123',
        policyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      // Adversary tampers with the action payload post-signing
      const tampered = {
        ...signedIntent,
        intent: {
          ...signedIntent.intent,
          actionName: 'treasury.drain_funds',
        }
      };

      const verification = await HermesIdentityVerifier.verifyIntent(tampered);
      expect(verification.valid).toBe(false);
      expect(verification.errorCode).toBe('ADDRESS_MISMATCH');
    });

    it('rejects tampered tenantId with cross-tenant spoofing rejection', async () => {
      const signedIntent = await signer.signIntent({
        tenantId: 'snarai',
        actorId: 'user_investor_01',
        actionName: 'leads.capture_contact',
        resourceId: 'lead_res_123',
        policyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      const tampered = {
        ...signedIntent,
        intent: {
          ...signedIntent.intent,
          tenantId: 'victim_tenant_beta',
        }
      };

      const verification = await HermesIdentityVerifier.verifyIntent(tampered);
      expect(verification.valid).toBe(false);
      expect(verification.errorCode).toBe('ADDRESS_MISMATCH');
    });

    it('rejects expired intent timestamp', async () => {
      const signedIntent = await signer.signIntent({
        tenantId: 'snarai',
        actorId: 'user_investor_01',
        actionName: 'leads.capture_contact',
        resourceId: 'lead_res_123',
        policyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        timestamp: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago
      });

      const verification = await HermesIdentityVerifier.verifyIntent(signedIntent, {
        maxAgeSeconds: 300,
      });

      expect(verification.valid).toBe(false);
      expect(verification.errorCode).toBe('TIMESTAMP_EXPIRED');
    });
  });

  // ── K23-REGISTRY: Identity Capabilities & Revocation ───────────────────────
  describe('K23-REGISTRY: Identity Capabilities & Revocation', () => {
    it('blocks execution when Hermes identity lacks required capability', async () => {
      const signedIntent = await signer.signIntent({
        tenantId: 'snarai',
        actorId: 'user_investor_01',
        actionName: 'governance.cast_vote',
        resourceId: 'prop_01',
        policyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      const verification = await HermesIdentityVerifier.verifyIntent(signedIntent, {
        requiredCapability: 'governance', // Not granted in registration
      });

      expect(verification.valid).toBe(false);
      expect(verification.errorCode).toBe('CAPABILITY_MISSING');
    });
  });

  // ── K23-TOOL-GATE: ToolExecutor Intent Enforcement ─────────────────────────
  describe('K23-TOOL-GATE: HermesToolExecutor Cryptographic Intent Enforcement', () => {
    it('executes tool successfully when valid signed intent is presented in context', async () => {
      const executor = new HermesToolExecutor();
      const signedIntent = await signer.signIntent({
        tenantId: 'snarai',
        actorId: 'user_investor_01',
        actionName: 'leads.capture_contact',
        resourceId: 'contact_abc',
        policyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      const response = await executor.executeTool(
        {
          toolName: 'leads.capture_contact',
          organizationId: 'snarai',
          actorId: 'user_investor_01',
          capabilityId: 'leads',
          parameters: { email: 'investor@snarai.com' },
        },
        [{ id: 'leads' }],
        { signedIntent }
      );

      expect(response.success).toBe(true);
      expect(response.unauthorized).toBeUndefined();
    });

    it('rejects tool execution when forged intent is presented to ToolExecutor', async () => {
      const executor = new HermesToolExecutor();
      const signedIntent = await signer.signIntent({
        tenantId: 'snarai',
        actorId: 'user_investor_01',
        actionName: 'leads.capture_contact',
        resourceId: 'contact_abc',
        policyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      // Tamper action
      const forged = {
        ...signedIntent,
        intent: {
          ...signedIntent.intent,
          actionName: 'unauthorized_action',
        }
      };

      const response = await executor.executeTool(
        {
          toolName: 'leads.capture_contact',
          organizationId: 'snarai',
          actorId: 'user_investor_01',
          capabilityId: 'leads',
          parameters: { email: 'investor@snarai.com' },
        },
        [{ id: 'leads' }],
        { signedIntent: forged }
      );

      expect(response.success).toBe(false);
      expect(response.unauthorized).toBe(true);
      expect(response.violationCode).toBe('UNAUTHORIZED_CAPABILITY');
      expect(response.reason).toContain('[K23_IDENTITY_REJECTED]');
    });

    it('MANDATORY ENFORCEMENT: blocks execution of sensitive/restricted tools when signedIntent is omitted', async () => {
      const executor = new HermesToolExecutor();
      const response = await executor.executeTool(
        {
          toolName: 'admin.export_user_data',
          organizationId: 'snarai',
          actorId: 'user_investor_01',
          capabilityId: 'admin',
          parameters: { target: 'all' },
        },
        [{ id: 'admin' }],
        {} // No signedIntent provided
      );

      expect(response.success).toBe(false);
      expect(response.unauthorized).toBe(true);
      expect(response.violationCode).toBe('UNAUTHORIZED_CAPABILITY');
      expect(response.reason).toContain('[K23_INTENT_REQUIRED]');
    });
  });
});
