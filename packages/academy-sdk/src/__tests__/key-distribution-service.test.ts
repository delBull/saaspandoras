/**
 * 🧪 Test Suite: Key Distribution Service (Phase 2 Gate)
 * packages/academy-sdk/src/__tests__/key-distribution-service.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ethers } from 'ethers';
import {
  EncryptedCourseResourceVault,
  DefaultAcademyKekProvider,
} from '../security/encrypted-resource-vault';
import {
  KeyDistributionService,
  KeyAccessPolicy,
  InMemoryNonceStore,
} from '../security/key-distribution-service';
import { EncryptedCourseResourceManifest } from '../types';

describe('Pandora\'s Academy — Key Distribution Service (Phase 2)', () => {
  let vault: EncryptedCourseResourceVault;
  let keyService: KeyDistributionService;
  let allowedWallets: Set<string>;
  let mockPolicy: KeyAccessPolicy;
  let manifest: EncryptedCourseResourceManifest;

  // Test wallet generator
  const authorizedWallet = ethers.Wallet.createRandom();
  const unauthorizedWallet = ethers.Wallet.createRandom();

  beforeEach(async () => {
    const kekProvider = new DefaultAcademyKekProvider('kek_test_v2', 'kek_secret_key_32_bytes_stable!');
    vault = new EncryptedCourseResourceVault(kekProvider);

    allowedWallets = new Set([authorizedWallet.address.toLowerCase()]);
    mockPolicy = {
      async isAllowed({ walletAddress }) {
        return allowedWallets.has(walletAddress.toLowerCase());
      },
    };

    const nonceStore = new InMemoryNonceStore(5000); // 5 sec max age for test
    keyService = new KeyDistributionService(vault, mockPolicy, nonceStore);

    // Encrypt sample lesson
    const payload = Buffer.from('Privileged curriculum material for Phase 2');
    const bundle = await vault.encryptResource(payload, {
      resourceId: 'res_lesson_coo_02',
      tenantId: 'pandoras',
      programId: 'coo_program_v1',
      moduleId: 'mod_ops',
      title: 'Operations Lesson',
      mediaType: 'text/markdown',
    });
    manifest = bundle.manifest;
  });

  it('SEC-10: Successfully authorizes valid wallet signature and releases unwrapped DEK', async () => {
    const timestamp = Date.now();
    const nonce = 'nonce_valid_123';

    const message = KeyDistributionService.buildChallengeMessage({
      walletAddress: authorizedWallet.address,
      resourceId: manifest.resourceId,
      tenantId: manifest.tenantId,
      programId: manifest.programId,
      nonce,
      timestamp,
    });

    const signature = await authorizedWallet.signMessage(message);

    const result = await keyService.authorizeAndDeliverKey(
      {
        walletAddress: authorizedWallet.address,
        resourceId: manifest.resourceId,
        tenantId: manifest.tenantId,
        programId: manifest.programId,
        nonce,
        timestamp,
        signature,
      },
      manifest
    );

    expect(result.allowed).toBe(true);
    expect(result.unwrappedDekBase64).toBeDefined();

    // Verify unwrap matches real DEK
    const expectedDek = await vault.unwrapDek(manifest);
    expect(result.unwrappedDekBase64).toBe(expectedDek.toString('base64'));
  });

  it('SEC-11: Anti-Replay Gate — Replaying the exact same signature and nonce fails immediately', async () => {
    const timestamp = Date.now();
    const nonce = 'nonce_replay_test';

    const message = KeyDistributionService.buildChallengeMessage({
      walletAddress: authorizedWallet.address,
      resourceId: manifest.resourceId,
      tenantId: manifest.tenantId,
      programId: manifest.programId,
      nonce,
      timestamp,
    });
    const signature = await authorizedWallet.signMessage(message);

    const challenge = {
      walletAddress: authorizedWallet.address,
      resourceId: manifest.resourceId,
      tenantId: manifest.tenantId,
      programId: manifest.programId,
      nonce,
      timestamp,
      signature,
    };

    // First attempt succeeds
    const firstResult = await keyService.authorizeAndDeliverKey(challenge, manifest);
    expect(firstResult.allowed).toBe(true);

    // Second attempt with reused nonce/signature fails
    const secondResult = await keyService.authorizeAndDeliverKey(challenge, manifest);
    expect(secondResult.allowed).toBe(false);
    expect(secondResult.reason).toContain('replay protection');
  });

  it('SEC-12: Policy Gate — Unauthorized wallet with valid signature is denied', async () => {
    const timestamp = Date.now();
    const nonce = 'nonce_unauth_wallet';

    const message = KeyDistributionService.buildChallengeMessage({
      walletAddress: unauthorizedWallet.address,
      resourceId: manifest.resourceId,
      tenantId: manifest.tenantId,
      programId: manifest.programId,
      nonce,
      timestamp,
    });
    const signature = await unauthorizedWallet.signMessage(message);

    const result = await keyService.authorizeAndDeliverKey(
      {
        walletAddress: unauthorizedWallet.address,
        resourceId: manifest.resourceId,
        tenantId: manifest.tenantId,
        programId: manifest.programId,
        nonce,
        timestamp,
        signature,
      },
      manifest
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Access policy denied');
    expect(result.unwrappedDekBase64).toBeUndefined();
  });

  it('SEC-13: Parameter Tampering — Forged resourceId in challenge is rejected', async () => {
    const timestamp = Date.now();
    const nonce = 'nonce_mismatch_res';

    const message = KeyDistributionService.buildChallengeMessage({
      walletAddress: authorizedWallet.address,
      resourceId: 'res_other_resource',
      tenantId: manifest.tenantId,
      programId: manifest.programId,
      nonce,
      timestamp,
    });
    const signature = await authorizedWallet.signMessage(message);

    const result = await keyService.authorizeAndDeliverKey(
      {
        walletAddress: authorizedWallet.address,
        resourceId: 'res_other_resource',
        tenantId: manifest.tenantId,
        programId: manifest.programId,
        nonce,
        timestamp,
        signature,
      },
      manifest
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('do not match resource manifest');
  });
});
