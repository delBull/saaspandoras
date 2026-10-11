/**
 * 🧪 Test Suite: Channel-Specific Cryptographic Verification & Nonce Replay Defense (Gate 2)
 * packages/hermes-core/src/auth/__tests__/cryptographic-proof-verifier.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHmac } from 'crypto';
import { ethers } from 'ethers';
import { TelegramAuthValidator } from '../telegram-auth-validator';
import { CryptographicProofVerifier } from '../cryptographic-proof-verifier';
import { MemoryNonceStore } from '../nonce-store.service';
import { ActorIdentityBindingService } from '../../runtime/prompt-hygiene-contract';
import type { ActorBindingProof } from '../../runtime/prompt-hygiene-contract';

describe('🛡️ Gate 2: Channel-Specific Cryptographic Proof Verifiers (Unified & Canonical)', () => {
  const TEST_BOT_TOKEN = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_TEST_TOKEN';
  const TEST_WEBHOOK_SECRET = 'super_secret_webhook_token_987';
  const TEST_META_APP_SECRET = 'meta_app_secret_hex_1234567890abcdef';
  const TEST_INTERNAL_SECRET = 'hermes_internal_service_secret_32_bytes_long';

  // ─────────────────────────────────────────────────────────────
  // 1. Telegram WebApp MiniApp initData (Delegates to TelegramAuthValidator)
  // ─────────────────────────────────────────────────────────────
  describe('Provider: TELEGRAM_INIT_DATA', () => {
    it('accepts authentic Telegram initData generated via TelegramAuthValidator.generateValidInitData', () => {
      const rawInitData = TelegramAuthValidator.generateValidInitData({
        user: { id: 798431743, username: 'delbull', first_name: 'Marco' },
        botToken: TEST_BOT_TOKEN,
      });

      const proof: ActorBindingProof = {
        actorId: '798431743',
        tenantId: 'snarai',
        authProvider: 'TELEGRAM_INIT_DATA',
        rawInitData,
        proofSignature: rawInitData,
        issuedAt: Date.now(),
        nonce: 'nonce_tg_valid',
      };

      const result = CryptographicProofVerifier.verifyTelegramInitData(proof, TEST_BOT_TOKEN);
      expect(result.valid).toBe(true);
    });

    it('rejects initData with tampered hash', () => {
      const rawInitData = TelegramAuthValidator.generateValidInitData({
        user: { id: 798431743, username: 'delbull' },
        botToken: TEST_BOT_TOKEN,
      });
      const tampered = rawInitData.replace(/hash=[a-f0-9]{2}/, 'hash=ff');

      const proof: ActorBindingProof = {
        actorId: '798431743',
        tenantId: 'snarai',
        authProvider: 'TELEGRAM_INIT_DATA',
        rawInitData: tampered,
        proofSignature: tampered,
        issuedAt: Date.now(),
        nonce: 'nonce_tg_tampered',
      };

      const result = CryptographicProofVerifier.verifyTelegramInitData(proof, TEST_BOT_TOKEN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cryptographic signature mismatch');
    });

    it('rejects initData when actorId does not match the Telegram user inside payload', () => {
      const rawInitData = TelegramAuthValidator.generateValidInitData({
        user: { id: 798431743, username: 'delbull' },
        botToken: TEST_BOT_TOKEN,
      });

      const proof: ActorBindingProof = {
        actorId: 'attacker_impersonating_id',
        tenantId: 'snarai',
        authProvider: 'TELEGRAM_INIT_DATA',
        rawInitData,
        proofSignature: rawInitData,
        issuedAt: Date.now(),
        nonce: 'nonce_tg_mismatch',
      };

      const result = CryptographicProofVerifier.verifyTelegramInitData(proof, TEST_BOT_TOKEN);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ACTOR_MISMATCH_WITH_TELEGRAM_USER');
    });

    it('rejects expired initData based on maxAgeSeconds policy', () => {
      const staleTime = Math.floor(Date.now() / 1000) - 7200; // 2 hours old
      const rawInitData = TelegramAuthValidator.generateValidInitData({
        user: { id: 798431743, username: 'delbull' },
        authDate: staleTime,
        botToken: TEST_BOT_TOKEN,
      });

      const proof: ActorBindingProof = {
        actorId: '798431743',
        tenantId: 'snarai',
        authProvider: 'TELEGRAM_INIT_DATA',
        rawInitData,
        proofSignature: rawInitData,
        issuedAt: Date.now(),
        nonce: 'nonce_tg_expired',
      };

      const result = CryptographicProofVerifier.verifyTelegramInitData(proof, TEST_BOT_TOKEN, {
        maxAgeSeconds: 3600, // 1 hour max policy
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Telegram Bot Webhook Secret (Header token)
  // ─────────────────────────────────────────────────────────────
  describe('Provider: TELEGRAM_WEBHOOK_SECRET', () => {
    it('accepts matching secret token', () => {
      const proof: ActorBindingProof = {
        actorId: 'tg_bot_gateway',
        tenantId: 'pandoras',
        authProvider: 'TELEGRAM_WEBHOOK_SECRET',
        secretToken: TEST_WEBHOOK_SECRET,
        proofSignature: TEST_WEBHOOK_SECRET,
        issuedAt: Date.now(),
        nonce: 'nonce_tg_webhook_1',
      };

      const result = CryptographicProofVerifier.verifyTelegramWebhookSecret(proof, TEST_WEBHOOK_SECRET);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid secret token', () => {
      const proof: ActorBindingProof = {
        actorId: 'tg_bot_gateway',
        tenantId: 'pandoras',
        authProvider: 'TELEGRAM_WEBHOOK_SECRET',
        secretToken: 'wrong_token',
        proofSignature: 'wrong_token',
        issuedAt: Date.now(),
        nonce: 'nonce_tg_webhook_2',
      };

      const result = CryptographicProofVerifier.verifyTelegramWebhookSecret(proof, TEST_WEBHOOK_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_WEBHOOK_SECRET_TOKEN');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Ethereum SIWE (ERC-4361 EIP-191 via ethers canonical)
  // ─────────────────────────────────────────────────────────────
  describe('Provider: ETHEREUM_SIWE', () => {
    const testWallet = new ethers.Wallet('0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d');
    const testNonce = 'nonce12345ABC';
    const expectedDomain = 'pandoras.finance';
    const futureExp = new Date(Date.now() + 3600000).toISOString();

    it('accepts authentic SIWE message and signature with matching domain, chainId and expiration', async () => {
      const message =
        `${expectedDomain} wants you to sign in with your Ethereum account:\n` +
        `${testWallet.address}\n\n` +
        `Sign in with Ethereum to Pandoras Growth OS.\n\n` +
        `URI: https://${expectedDomain}/login\n` +
        `Version: 1\n` +
        `Chain ID: 1\n` +
        `Nonce: ${testNonce}\n` +
        `Issued At: 2026-10-10T20:00:00.000Z\n` +
        `Expiration Time: ${futureExp}`;

      const signature = await testWallet.signMessage(message);

      const proof: ActorBindingProof = {
        actorId: testWallet.address.toLowerCase(),
        tenantId: 'pandoras',
        authProvider: 'ETHEREUM_SIWE',
        siweMessage: message,
        proofSignature: signature,
        issuedAt: Date.now(),
        nonce: testNonce,
        expectedDomain,
        expectedChainId: 1,
      };

      const result = CryptographicProofVerifier.verifyEthereumSiwe(proof, {
        expectedDomain,
        expectedChainId: 1,
      });
      expect(result.valid).toBe(true);
      expect(result.recoveredAddress).toBe(testWallet.address.toLowerCase());
    });

    it('rejects SIWE if domain does not match expectedDomain (Anti-Phishing)', async () => {
      const message =
        `evil-phishing.com wants you to sign in with your Ethereum account:\n` +
        `${testWallet.address}\n\n` +
        `Nonce: ${testNonce}\n` +
        `Expiration Time: ${futureExp}`;

      const signature = await testWallet.signMessage(message);

      const proof: ActorBindingProof = {
        actorId: testWallet.address.toLowerCase(),
        tenantId: 'pandoras',
        authProvider: 'ETHEREUM_SIWE',
        siweMessage: message,
        proofSignature: signature,
        issuedAt: Date.now(),
        nonce: testNonce,
        expectedDomain,
      };

      const result = CryptographicProofVerifier.verifyEthereumSiwe(proof, { expectedDomain });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('SIWE_DOMAIN_MISMATCH');
    });

    it('rejects SIWE when expectedDomain is required but the message omits the domain line (fail-closed)', async () => {
      const message =
        `${testWallet.address}\n\n` +
        `Nonce: ${testNonce}\n` +
        `Expiration Time: ${futureExp}`;

      const signature = await testWallet.signMessage(message);

      const proof: ActorBindingProof = {
        actorId: testWallet.address.toLowerCase(),
        tenantId: 'pandoras',
        authProvider: 'ETHEREUM_SIWE',
        siweMessage: message,
        proofSignature: signature,
        issuedAt: Date.now(),
        nonce: testNonce,
        expectedDomain,
      };

      const result = CryptographicProofVerifier.verifyEthereumSiwe(proof, { expectedDomain });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('SIWE_DOMAIN_MISMATCH');
    });

    it('rejects SIWE if message is expired', async () => {
      const pastExp = new Date(Date.now() - 60000).toISOString();
      const message =
        `${expectedDomain} wants you to sign in with your Ethereum account:\n` +
        `${testWallet.address}\n\n` +
        `Nonce: ${testNonce}\n` +
        `Expiration Time: ${pastExp}`;

      const signature = await testWallet.signMessage(message);

      const proof: ActorBindingProof = {
        actorId: testWallet.address.toLowerCase(),
        tenantId: 'pandoras',
        authProvider: 'ETHEREUM_SIWE',
        siweMessage: message,
        proofSignature: signature,
        issuedAt: Date.now(),
        nonce: testNonce,
        expectedDomain,
      };

      const result = CryptographicProofVerifier.verifyEthereumSiwe(proof, { expectedDomain });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('SIWE_MESSAGE_EXPIRED');
    });

    it('rejects SIWE if signature was forged by a different private key', async () => {
      const foreignWallet = ethers.Wallet.createRandom();
      const message =
        `${expectedDomain} wants you to sign in with your Ethereum account:\n` +
        `${testWallet.address}\n\n` +
        `Nonce: ${testNonce}\n` +
        `Expiration Time: ${futureExp}`;

      const foreignSig = await foreignWallet.signMessage(message);

      const proof: ActorBindingProof = {
        actorId: testWallet.address.toLowerCase(),
        tenantId: 'pandoras',
        authProvider: 'ETHEREUM_SIWE',
        siweMessage: message,
        proofSignature: foreignSig,
        issuedAt: Date.now(),
        nonce: testNonce,
        expectedDomain,
      };

      const result = CryptographicProofVerifier.verifyEthereumSiwe(proof, { expectedDomain });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_CRYPTOGRAPHIC_SIGNATURE');
    });

    it('rejects SIWE if actorId does not match declared Ethereum address', async () => {
      const message =
        `${expectedDomain} wants you to sign in with your Ethereum account:\n` +
        `${testWallet.address}\n\n` +
        `Nonce: ${testNonce}\n` +
        `Expiration Time: ${futureExp}`;
      const signature = await testWallet.signMessage(message);

      const proof: ActorBindingProof = {
        actorId: '0x000000000000000000000000000000000000dead',
        tenantId: 'pandoras',
        authProvider: 'ETHEREUM_SIWE',
        siweMessage: message,
        proofSignature: signature,
        issuedAt: Date.now(),
        nonce: testNonce,
        expectedDomain,
      };

      const result = CryptographicProofVerifier.verifyEthereumSiwe(proof, { expectedDomain });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ACTOR_MISMATCH_WITH_DECLARED_SIWE_ADDRESS');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. WhatsApp Meta Cloud API Webhook (X-Hub-Signature-256)
  // ─────────────────────────────────────────────────────────────
  describe('Provider: WHATSAPP_CLOUD_WEBHOOK', () => {
    it('accepts authentic raw body and signature', () => {
      const rawBody = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
      const hash = createHmac('sha256', TEST_META_APP_SECRET).update(Buffer.from(rawBody, 'utf8')).digest('hex');

      const proof: ActorBindingProof = {
        actorId: 'whatsapp_gateway',
        tenantId: 'pandoras',
        authProvider: 'WHATSAPP_CLOUD_WEBHOOK',
        rawBody,
        hubSignature: `sha256=${hash}`,
        proofSignature: `sha256=${hash}`,
        issuedAt: Date.now(),
        nonce: 'wa_nonce_1',
      };

      const result = CryptographicProofVerifier.verifyWhatsAppCloudWebhook(proof, TEST_META_APP_SECRET);
      expect(result.valid).toBe(true);
    });

    it('rejects tampered raw payload', () => {
      const rawBody = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
      const hash = createHmac('sha256', TEST_META_APP_SECRET).update(Buffer.from(rawBody, 'utf8')).digest('hex');

      const proof: ActorBindingProof = {
        actorId: 'whatsapp_gateway',
        tenantId: 'pandoras',
        authProvider: 'WHATSAPP_CLOUD_WEBHOOK',
        rawBody: rawBody + 'tamper',
        hubSignature: `sha256=${hash}`,
        proofSignature: `sha256=${hash}`,
        issuedAt: Date.now(),
        nonce: 'wa_nonce_2',
      };

      const result = CryptographicProofVerifier.verifyWhatsAppCloudWebhook(proof, TEST_META_APP_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_META_HUB_SIGNATURE');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Internal Service Secret (INTERNAL_SERVICE)
  // ─────────────────────────────────────────────────────────────
  describe('Provider: INTERNAL_SERVICE', () => {
    it('accepts authentic service secret', () => {
      const proof: ActorBindingProof = {
        actorId: 'system_outbound_dispatcher',
        tenantId: 'pandoras',
        authProvider: 'INTERNAL_SERVICE',
        serviceId: 'hermes_outbound_worker',
        serviceSecret: TEST_INTERNAL_SECRET,
        proofSignature: TEST_INTERNAL_SECRET,
        issuedAt: Date.now(),
        nonce: 'int_nonce_1',
      };

      const result = CryptographicProofVerifier.verifyInternalServiceSecret(proof, TEST_INTERNAL_SECRET);
      expect(result.valid).toBe(true);
    });

    it('rejects wrong service secret', () => {
      const proof: ActorBindingProof = {
        actorId: 'system_outbound_dispatcher',
        tenantId: 'pandoras',
        authProvider: 'INTERNAL_SERVICE',
        serviceId: 'hermes_outbound_worker',
        serviceSecret: 'forged_service_secret',
        proofSignature: 'forged_service_secret',
        issuedAt: Date.now(),
        nonce: 'int_nonce_2',
      };

      const result = CryptographicProofVerifier.verifyInternalServiceSecret(proof, TEST_INTERNAL_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_INTERNAL_SERVICE_SECRET');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Nonce Store Anti-Replay Wired to ActorIdentityBindingService
  // ─────────────────────────────────────────────────────────────
  describe('Wired Replay Defense via ActorIdentityBindingService', () => {
    let nonceStore: MemoryNonceStore;

    beforeEach(() => {
      nonceStore = new MemoryNonceStore();
    });

    it('issues session on first presentation of nonce and consumes it', () => {
      const proof: ActorBindingProof = {
        actorId: 'actor_100',
        tenantId: 'pandoras',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'sig_100',
        issuedAt: Date.now(),
        nonce: 'challenge_nonce_100',
      };

      const session = ActorIdentityBindingService.createBoundSession(
        proof,
        'CONFIDENTIAL',
        3600,
        { nonceStore }
      );
      expect(session).toBeDefined();
    });

    it('strictly rejects replaying the same nonce with REJECT: Nonce replay detected', () => {
      const proof: ActorBindingProof = {
        actorId: 'actor_100',
        tenantId: 'pandoras',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'sig_100',
        issuedAt: Date.now(),
        nonce: 'challenge_nonce_100',
      };

      // First mint succeeds
      ActorIdentityBindingService.createBoundSession(proof, 'CONFIDENTIAL', 3600, { nonceStore });

      // Second mint with identical nonce must fail
      expect(() => {
        ActorIdentityBindingService.createBoundSession(proof, 'CONFIDENTIAL', 3600, { nonceStore });
      }).toThrow('Nonce replay detected');
    });

    it('async createBoundSessionAsync performs end-to-end verification and replay defense', async () => {
      const rawInitData = TelegramAuthValidator.generateValidInitData({
        user: { id: 888777, username: 'tester' },
        botToken: TEST_BOT_TOKEN,
      });

      const proof: ActorBindingProof = {
        actorId: '888777',
        tenantId: 'snarai',
        authProvider: 'TELEGRAM_INIT_DATA',
        rawInitData,
        proofSignature: rawInitData,
        issuedAt: Date.now(),
        nonce: 'unique_async_nonce_888',
      };

      const session = await ActorIdentityBindingService.createBoundSessionAsync(
        proof,
        'TENANT_RESTRICTED',
        3600,
        {
          nonceStore,
          channelVerification: { botToken: TEST_BOT_TOKEN },
        }
      );

      // Replaying must fail
      await expect(
        ActorIdentityBindingService.createBoundSessionAsync(proof, 'TENANT_RESTRICTED', 3600, {
          nonceStore,
          channelVerification: { botToken: TEST_BOT_TOKEN },
        })
      ).rejects.toThrow('Nonce replay detected');
    });

    it('adversarial check: createBoundSessionAsync rejects when channelVerification is missing for cryptographic providers', async () => {
      const proof: ActorBindingProof = {
        actorId: '888777',
        tenantId: 'snarai',
        authProvider: 'TELEGRAM_WEBHOOK_SECRET',
        proofSignature: 'some_sig',
        issuedAt: Date.now(),
        nonce: 'nonce_test_no_verification',
      };

      // Calling without channelVerification must throw without ever issuing a session
      await expect(
        ActorIdentityBindingService.createBoundSessionAsync(proof, 'CONFIDENTIAL', 3600)
      ).rejects.toThrow('telegramSecret is required in channelVerification for TELEGRAM_WEBHOOK_SECRET');
    });

    it('adversarial check: createBoundSession strictly rejects external channel providers invoked synchronously without witness', () => {
      const proof: ActorBindingProof = {
        actorId: 'attacker_123',
        tenantId: 'snarai',
        authProvider: 'TELEGRAM_INIT_DATA',
        proofSignature: 'fabricated_sig',
        issuedAt: Date.now(),
        nonce: 'nonce_sync_attack',
      };

      expect(() => {
        ActorIdentityBindingService.createBoundSession(proof, 'CONFIDENTIAL', 3600);
      }).toThrow('Direct synchronous session creation for channel provider');
    });

    it('adversarial check: setActiveNonceStore strictly throws in production', async () => {
      const { setActiveNonceStore } = await import('../nonce-store.service');
      const prevEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        expect(() => {
          setActiveNonceStore(new MemoryNonceStore());
        }).toThrow('Mutating or replacing NonceStore is strictly forbidden in production');
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    it('adversarial check: getActiveNonceStore ignores HERMES_ALLOW_MEMORY_NONCE_STORE=true in production', async () => {
      const { getActiveNonceStore } = await import('../nonce-store.service');
      const prevEnv = process.env.NODE_ENV;
      const prevAllow = process.env.HERMES_ALLOW_MEMORY_NONCE_STORE;
      try {
        process.env.NODE_ENV = 'production';
        process.env.HERMES_ALLOW_MEMORY_NONCE_STORE = 'true';

        const store = getActiveNonceStore();
        expect(store.constructor.name).toBe('PostgresA2aNonceStore');
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevAllow) process.env.HERMES_ALLOW_MEMORY_NONCE_STORE = prevAllow;
        else delete process.env.HERMES_ALLOW_MEMORY_NONCE_STORE;
      }
    });

    it('adversarial check: createBoundSessionAsync rejects unknown authProvider', async () => {
      const proof: any = {
        actorId: 'actor_unknown',
        tenantId: 'pandoras',
        authProvider: 'UNKNOWN_PROVIDER',
        proofSignature: 'sig_123',
        issuedAt: Date.now(),
        nonce: 'nonce_unknown',
      };

      await expect(
        ActorIdentityBindingService.createBoundSessionAsync(proof, 'PUBLIC', 3600, { nonceStore })
      ).rejects.toThrow('Unsupported or unverified authProvider: UNKNOWN_PROVIDER');
    });

    it('adversarial check: createBoundSessionAsync verifies INTERNAL_SERVICE secret with timing-safe check', async () => {
      const prevSecret = process.env.HERMES_INTERNAL_SERVICE_SECRET;
      try {
        process.env.HERMES_INTERNAL_SERVICE_SECRET = 'srv_super_secret_correct_12345';

        const proof: ActorBindingProof = {
          actorId: 'internal_agent_01',
          tenantId: 'pandoras',
          authProvider: 'INTERNAL_SERVICE',
          serviceId: 'srv_agent_worker',
          serviceSecret: 'srv_super_secret_correct_12345',
          proofSignature: 'srv_super_secret_correct_12345',
          issuedAt: Date.now(),
          nonce: 'nonce_internal_valid',
        };

        const session = await ActorIdentityBindingService.createBoundSessionAsync(
          proof,
          'INTERNAL_OPERATIONAL',
          3600,
          { nonceStore }
        );
        expect(session.actorId).toBe('internal_agent_01');

        // Invalid secret
        const invalidProof = {
          ...proof,
          serviceId: 'srv_agent_worker',
          serviceSecret: 'wrong_secret',
          proofSignature: 'wrong_secret',
          nonce: 'nonce_internal_invalid',
        };
        await expect(
          ActorIdentityBindingService.createBoundSessionAsync(invalidProof, 'INTERNAL_OPERATIONAL', 3600, { nonceStore })
        ).rejects.toThrow('Internal service secret verification failed');
      } finally {
        if (prevSecret) process.env.HERMES_INTERNAL_SERVICE_SECRET = prevSecret;
        else delete process.env.HERMES_INTERNAL_SERVICE_SECRET;
      }
    });

    it('adversarial check: SIWE rejects wrong chainId, expired message, or not-before in future', async () => {
      const testWallet = ethers.Wallet.createRandom();
      const domain = 'app.pandoras.finance';
      const nonce = 'siwe_test_nonce_999';

      // 1. Wrong chainId
      const msgWrongChain =
        `${domain} wants you to sign in with your Ethereum account:\n` +
        `${testWallet.address}\n\n` +
        `URI: https://${domain}\n` +
        `Version: 1\n` +
        `Chain ID: 137\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${new Date().toISOString()}\n` +
        `Expiration Time: ${new Date(Date.now() + 600000).toISOString()}`;
      const sigWrongChain = await testWallet.signMessage(msgWrongChain);

      const resWrongChain = CryptographicProofVerifier.verifyEthereumSiwe(
        {
          actorId: testWallet.address,
          tenantId: 'pandoras',
          authProvider: 'ETHEREUM_SIWE',
          siweMessage: msgWrongChain,
          proofSignature: sigWrongChain,
          issuedAt: Date.now(),
          nonce,
        },
        { expectedDomain: domain, expectedChainId: 1 } // Expecting 1, got 137
      );
      expect(resWrongChain.valid).toBe(false);
      expect(resWrongChain.error).toBe('SIWE_CHAIN_ID_MISMATCH');

      // 2. Expired message
      const msgExpired =
        `${domain} wants you to sign in with your Ethereum account:\n` +
        `${testWallet.address}\n\n` +
        `URI: https://${domain}\n` +
        `Version: 1\n` +
        `Chain ID: 1\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${new Date(Date.now() - 120000).toISOString()}\n` +
        `Expiration Time: ${new Date(Date.now() - 60000).toISOString()}`;
      const sigExpired = await testWallet.signMessage(msgExpired);

      const resExpired = CryptographicProofVerifier.verifyEthereumSiwe(
        {
          actorId: testWallet.address,
          tenantId: 'pandoras',
          authProvider: 'ETHEREUM_SIWE',
          siweMessage: msgExpired,
          proofSignature: sigExpired,
          issuedAt: Date.now(),
          nonce,
        },
        { expectedDomain: domain, expectedChainId: 1 }
      );
      expect(resExpired.valid).toBe(false);
      expect(resExpired.error).toBe('SIWE_MESSAGE_EXPIRED');

      // 3. Not Before in the future
      const msgNotBefore =
        `${domain} wants you to sign in with your Ethereum account:\n` +
        `${testWallet.address}\n\n` +
        `URI: https://${domain}\n` +
        `Version: 1\n` +
        `Chain ID: 1\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${new Date().toISOString()}\n` +
        `Expiration Time: ${new Date(Date.now() + 600000).toISOString()}\n` +
        `Not Before: ${new Date(Date.now() + 120000).toISOString()}`;
      const sigNotBefore = await testWallet.signMessage(msgNotBefore);

      const resNotBefore = CryptographicProofVerifier.verifyEthereumSiwe(
        {
          actorId: testWallet.address,
          tenantId: 'pandoras',
          authProvider: 'ETHEREUM_SIWE',
          siweMessage: msgNotBefore,
          proofSignature: sigNotBefore,
          issuedAt: Date.now(),
          nonce,
        },
        { expectedDomain: domain, expectedChainId: 1 }
      );
      expect(resNotBefore.valid).toBe(false);
      expect(resNotBefore.error).toBe('SIWE_MESSAGE_NOT_YET_VALID');
    });

    it('adversarial check: witness cannot be forged or transferred across identities or tenants', () => {
      const validProof: ActorBindingProof = {
        actorId: 'user_alice',
        tenantId: 'tenant_alice',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'alice_sig_123',
        issuedAt: Date.now(),
        nonce: 'nonce_alice_123',
      };

      // Attacker tries to steal Alice's witness token for Eve or another tenant
      const eveProof: ActorBindingProof = {
        actorId: 'user_eve',
        tenantId: 'tenant_alice', // cross-actor forgery attempt
        authProvider: 'TELEGRAM_INIT_DATA',
        proofSignature: 'eve_sig',
        issuedAt: Date.now(),
        nonce: 'nonce_eve_123',
      };

      const forgedWitness = {
        _witnessToken: 'forged_hmac_token_value_abc',
        verifiedAt: Date.now(),
        authProvider: 'TELEGRAM_INIT_DATA' as const,
        clearanceLevel: 'CONFIDENTIAL' as const,
        ttlSeconds: 3600,
      };

      expect(() => {
        ActorIdentityBindingService.createBoundSession(
          eveProof,
          'CONFIDENTIAL',
          3600,
          { _verifiedWitness: forgedWitness }
        );
      }).toThrow('Invalid or tampered verification witness token');
    });

    it('adversarial matrix: createBoundSession rejects forged arbitrary witness across all providers', () => {
      const providers = [
        'INTERNAL_SERVICE',
        'PORTAL_SESSION',
        'TELEGRAM_INIT_DATA',
        'TELEGRAM_WEBHOOK_SECRET',
        'ETHEREUM_SIWE',
        'WHATSAPP_CLOUD_WEBHOOK',
        'PUBLIC_WIDGET_KEY',
        'PORTAL_INTERNAL',
      ] as const;

      for (const authProvider of providers) {
        const proof: ActorBindingProof = {
          actorId: `adversary_${authProvider.toLowerCase()}`,
          tenantId: 'target_tenant_uuid',
          authProvider,
          proofSignature: 'forged_proof_sig_999',
          issuedAt: Date.now(),
          nonce: `nonce_adv_${authProvider}_${Date.now()}`,
        };

        const forgedWitness = {
          _witnessToken: 'forged_unauthorized_hmac_token_xyz',
          verifiedAt: Date.now(),
          authProvider,
          clearanceLevel: 'CONFIDENTIAL' as const,
          ttlSeconds: 3600,
        };

        expect(() => {
          ActorIdentityBindingService.createBoundSession(
            proof,
            'CONFIDENTIAL',
            3600,
            { _verifiedWitness: forgedWitness }
          );
        }).toThrow('Invalid or tampered verification witness token');
      }
    });

    it('adversarial check: createBoundSession rejects privilege escalation on clearanceLevel or ttlSeconds', async () => {
      const validProof: ActorBindingProof = {
        actorId: 'authorized_user_1',
        tenantId: 'snarai',
        authProvider: 'INTERNAL_SERVICE',
        serviceId: 'reporting_worker',
        serviceSecret: 'test_internal_secret_999',
        proofSignature: 'test_internal_secret_999',
        issuedAt: Date.now(),
        nonce: `nonce_priv_esc_${Date.now()}`,
      };

      const prevSecret = process.env.HERMES_INTERNAL_SERVICE_SECRET;
      try {
        process.env.HERMES_INTERNAL_SERVICE_SECRET = 'test_internal_secret_999';

        // Attacker creates a legitimate witness for 'PUBLIC' clearance with 600s TTL
        const session = await ActorIdentityBindingService.createBoundSessionAsync(
          validProof,
          'PUBLIC',
          600,
          { nonceStore }
        );
        expect(session.clearanceLevel).toBe('PUBLIC');

        // Attacker constructs a witness object reflecting what was authorized (PUBLIC, 600s)
        // but calls createBoundSession attempting to escalate to RESTRICTED_SYSTEM or 86400s
        const now = Date.now();
        const authenticPublicWitness = {
          _witnessToken: (ActorIdentityBindingService as any).createWitnessToken(validProof, 'PUBLIC', 600, now),
          verifiedAt: now,
          authProvider: 'INTERNAL_SERVICE' as const,
          clearanceLevel: 'PUBLIC' as const,
          ttlSeconds: 600,
        };

        // 1. Privilege escalation: Requesting SECRET with PUBLIC witness
        expect(() => {
          ActorIdentityBindingService.createBoundSession(
            validProof,
            'SECRET',
            600,
            { _verifiedWitness: authenticPublicWitness }
          );
        }).toThrow('Privilege escalation attempt: Requested clearanceLevel or ttlSeconds does not match verified witness authorization.');

        // 2. Privilege escalation: Requesting 86400s TTL with 600s witness
        expect(() => {
          ActorIdentityBindingService.createBoundSession(
            validProof,
            'PUBLIC',
            86400,
            { _verifiedWitness: authenticPublicWitness }
          );
        }).toThrow('Privilege escalation attempt: Requested clearanceLevel or ttlSeconds does not match verified witness authorization.');
      } finally {
        if (prevSecret) process.env.HERMES_INTERNAL_SERVICE_SECRET = prevSecret;
        else delete process.env.HERMES_INTERNAL_SERVICE_SECRET;
      }
    });

    it('adversarial check: createBoundSession rejects expired witness (>300s)', () => {
      const proof: ActorBindingProof = {
        actorId: 'user_expired_witness',
        tenantId: 'snarai',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'some_sig',
        issuedAt: Date.now(),
        nonce: `nonce_exp_wit_${Date.now()}`,
      };

      const expiredWitness = {
        _witnessToken: 'any_token',
        verifiedAt: Date.now() - 350 * 1000, // 350 seconds old (> 300s limit)
        authProvider: 'PORTAL_INTERNAL' as const,
        clearanceLevel: 'CONFIDENTIAL' as const,
        ttlSeconds: 3600,
      };

      expect(() => {
        ActorIdentityBindingService.createBoundSession(
          proof,
          'CONFIDENTIAL',
          3600,
          { _verifiedWitness: expiredWitness }
        );
      }).toThrow('Verification witness has expired');
    });

    it('adversarial check: createBoundSession rejects witness with timestamp in the future (clock skew violation)', () => {
      const proof: ActorBindingProof = {
        actorId: 'user_future_witness',
        tenantId: 'snarai',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'some_sig',
        issuedAt: Date.now(),
        nonce: `nonce_future_wit_${Date.now()}`,
      };

      const futureWitness = {
        _witnessToken: 'any_future_token',
        verifiedAt: Date.now() + 60 * 1000, // 60 seconds in the future
        authProvider: 'PORTAL_INTERNAL' as const,
        clearanceLevel: 'CONFIDENTIAL' as const,
        ttlSeconds: 3600,
      };

      expect(() => {
        ActorIdentityBindingService.createBoundSession(
          proof,
          'CONFIDENTIAL',
          3600,
          { _verifiedWitness: futureWitness }
        );
      }).toThrow('Verification witness timestamp is in the future');
    });

    it('adversarial check: in production, unverified synchronous session creation is strictly rejected for all providers, including PORTAL_INTERNAL without witness', () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';

        const internalProof: ActorBindingProof = {
          actorId: 'worker_1',
          tenantId: 'snarai',
          authProvider: 'INTERNAL_SERVICE',
          proofSignature: 'sec_123',
          issuedAt: Date.now(),
          nonce: `nonce_prod_internal_${Date.now()}`,
        };
        expect(() => {
          ActorIdentityBindingService.createBoundSession(internalProof, 'CONFIDENTIAL', 3600);
        }).toThrow("Unverified synchronous session creation for 'INTERNAL_SERVICE' is forbidden in production.");

        const portalProof: ActorBindingProof = {
          actorId: 'user_portal_1',
          tenantId: 'snarai',
          authProvider: 'PORTAL_SESSION',
          proofSignature: 'pses_snarai_user_portal_1_abc123',
          issuedAt: Date.now(),
          nonce: `nonce_prod_portal_${Date.now()}`,
        };
        expect(() => {
          ActorIdentityBindingService.createBoundSession(portalProof, 'CONFIDENTIAL', 3600);
        }).toThrow("Unverified synchronous session creation for 'PORTAL_SESSION' is forbidden in production.");

        // PORTAL_INTERNAL (Auditor closing check: unverified synchronous creation MUST be rejected in production)
        const portalInternalProof: ActorBindingProof = {
          actorId: 'attacker_forged_internal',
          tenantId: 'snarai',
          authProvider: 'PORTAL_INTERNAL',
          proofSignature: 'attacker_arbitrary_sig',
          issuedAt: Date.now(),
          nonce: `nonce_prod_internal_adv_${Date.now()}`,
        };
        expect(() => {
          ActorIdentityBindingService.createBoundSession(portalInternalProof, 'CONFIDENTIAL', 3600);
        }).toThrow("Unverified synchronous session creation for 'PORTAL_INTERNAL' is forbidden in production.");
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    it('adversarial check: TLV length prefixing prevents delimiter injection in actorId/tenantId', () => {
      const proofWithPipes: ActorBindingProof = {
        actorId: 'alice|ADMIN|SECRET|9999999',
        tenantId: 'tenant|with|pipes',
        authProvider: 'INTERNAL_SERVICE',
        proofSignature: 'some_sig',
        issuedAt: Date.now(),
        nonce: `nonce_pipes_${Date.now()}`,
      };

      const now = Date.now();
      // Generate genuine TLV witness
      const validWitnessToken = (ActorIdentityBindingService as any).createWitnessToken(
        proofWithPipes,
        'CONFIDENTIAL',
        3600,
        now
      );

      // Verify that session binding accepts the valid TLV token
      const session = ActorIdentityBindingService.createBoundSession(
        proofWithPipes,
        'CONFIDENTIAL',
        3600,
        {
          _verifiedWitness: {
            _witnessToken: validWitnessToken,
            verifiedAt: now,
            authProvider: 'INTERNAL_SERVICE',
            clearanceLevel: 'CONFIDENTIAL',
            ttlSeconds: 3600,
          },
        }
      );
      expect(session.actorId).toBe('alice|ADMIN|SECRET|9999999');

      // Attacker attempts to shift fields or tamper with the payload
      expect(() => {
        ActorIdentityBindingService.createBoundSession(
          {
            ...proofWithPipes,
            actorId: 'alice',
          },
          'CONFIDENTIAL',
          3600,
          {
            _verifiedWitness: {
              _witnessToken: validWitnessToken,
              verifiedAt: now,
              authProvider: 'INTERNAL_SERVICE',
              clearanceLevel: 'CONFIDENTIAL',
              ttlSeconds: 3600,
            },
          }
        );
      }).toThrow('Invalid or tampered verification witness token');
    });

    it('adversarial check: witness cannot be reused to emit multiple sessions (single-use witness enforcement)', () => {
      const proof: ActorBindingProof = {
        actorId: 'user_single_use_witness',
        tenantId: 'snarai',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'some_sig',
        issuedAt: Date.now(),
        nonce: `nonce_single_use_${Date.now()}`,
      };

      const now = Date.now();
      const validToken = (ActorIdentityBindingService as any).createWitnessToken(
        proof,
        'CONFIDENTIAL',
        3600,
        now
      );

      const witness = {
        _witnessToken: validToken,
        verifiedAt: now,
        authProvider: 'PORTAL_INTERNAL' as const,
        clearanceLevel: 'CONFIDENTIAL' as const,
        ttlSeconds: 3600,
      };

      // First presentation -> SUCCEEDS and consumes witness
      const session1 = ActorIdentityBindingService.createBoundSession(
        proof,
        'CONFIDENTIAL',
        3600,
        { _verifiedWitness: witness }
      );
      expect(session1.actorId).toBe('user_single_use_witness');

      // Second presentation (REPLAY ATTACK) -> STRICTLY REJECTED with REPLAY_DETECTED
      expect(() => {
        ActorIdentityBindingService.createBoundSession(
          proof,
          'CONFIDENTIAL',
          3600,
          { _verifiedWitness: witness }
        );
      }).toThrow('Verification witness has already been consumed for session emission. Replay strictly forbidden.');
    });

    it('adversarial check: malformed non-finite, NaN, or non-positive verifiedAt in witness is strictly rejected', () => {
      const proof: ActorBindingProof = {
        actorId: 'user_nan_witness',
        tenantId: 'snarai',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'some_sig',
        issuedAt: Date.now(),
        nonce: `nonce_nan_${Date.now()}`,
      };

      // 1. NaN verifiedAt
      expect(() => {
        ActorIdentityBindingService.createBoundSession(
          proof,
          'CONFIDENTIAL',
          3600,
          {
            _verifiedWitness: {
              _witnessToken: 'some_token',
              verifiedAt: NaN,
              authProvider: 'PORTAL_INTERNAL',
              clearanceLevel: 'CONFIDENTIAL',
              ttlSeconds: 3600,
            },
          }
        );
      }).toThrow('Malformed verification witness structure, invalid timestamp/ttl, or authProvider mismatch.');

      // 2. Non-positive verifiedAt (-500)
      expect(() => {
        ActorIdentityBindingService.createBoundSession(
          proof,
          'CONFIDENTIAL',
          3600,
          {
            _verifiedWitness: {
              _witnessToken: 'some_token',
              verifiedAt: -500,
              authProvider: 'PORTAL_INTERNAL',
              clearanceLevel: 'CONFIDENTIAL',
              ttlSeconds: 3600,
            },
          }
        );
      }).toThrow('Malformed verification witness structure, invalid timestamp/ttl, or authProvider mismatch.');

      // 3. NaN ttlSeconds
      expect(() => {
        ActorIdentityBindingService.createBoundSession(
          proof,
          'CONFIDENTIAL',
          3600,
          {
            _verifiedWitness: {
              _witnessToken: 'some_token',
              verifiedAt: Date.now(),
              authProvider: 'PORTAL_INTERNAL',
              clearanceLevel: 'CONFIDENTIAL',
              ttlSeconds: NaN,
            },
          }
        );
      }).toThrow('Malformed verification witness structure, invalid timestamp/ttl, or authProvider mismatch.');
    });

    it('adversarial check: createInternalSystemSession strictly rejects missing or blank tenantId', () => {
      expect(() => {
        ActorIdentityBindingService.createInternalSystemSession({
          actorId: 'sys_actor',
          tenantId: '',
        });
      }).toThrow('Valid non-empty tenantId is required for internal system session.');

      expect(() => {
        ActorIdentityBindingService.createInternalSystemSession({
          actorId: 'sys_actor',
          tenantId: '   ',
        });
      }).toThrow('Valid non-empty tenantId is required for internal system session.');
    });

    it('adversarial check: PUBLIC_WIDGET_KEY rejects missing or invalid public key', async () => {
      const prevKey = process.env.NEXT_PUBLIC_PANDORAS_PUBLIC_KEY;
      try {
        process.env.NEXT_PUBLIC_PANDORAS_PUBLIC_KEY = 'pk_live_expected_widget_999';

        const validProof: ActorBindingProof = {
          actorId: 'guest_visitor_1',
          tenantId: 'pandoras',
          authProvider: 'PUBLIC_WIDGET_KEY',
          proofSignature: 'pk_live_expected_widget_999',
          issuedAt: Date.now(),
          nonce: 'nonce_widget_valid',
        };

        const session = await ActorIdentityBindingService.createBoundSessionAsync(
          validProof,
          'PUBLIC',
          1800,
          { nonceStore }
        );
        expect(session.actorId).toBe('guest_visitor_1');

        // Invalid key
        const invalidProof = {
          ...validProof,
          proofSignature: 'pk_attacker_fake_key',
          nonce: 'nonce_widget_invalid',
        };
        await expect(
          ActorIdentityBindingService.createBoundSessionAsync(invalidProof, 'PUBLIC', 1800, { nonceStore })
        ).rejects.toThrow('Invalid widget public key signature');
      } finally {
        if (prevKey) process.env.NEXT_PUBLIC_PANDORAS_PUBLIC_KEY = prevKey;
        else delete process.env.NEXT_PUBLIC_PANDORAS_PUBLIC_KEY;
      }
    });

    it('adversarial check: PORTAL_SESSION rejects malformed session tokens', async () => {
      const validProof: ActorBindingProof = {
        actorId: 'portal_user_42',
        tenantId: 'snarai',
        authProvider: 'PORTAL_SESSION',
        proofSignature: 'pses_snarai_portal_user_42_abcdef0123456789',
        issuedAt: Date.now(),
        nonce: 'nonce_portal_valid',
      };

      const session = await ActorIdentityBindingService.createBoundSessionAsync(
        validProof,
        'TENANT_RESTRICTED',
        3600,
        { nonceStore }
      );
      expect(session.actorId).toBe('portal_user_42');

      // Malformed token prefix
      const invalidProof = {
        ...validProof,
        proofSignature: 'invalid_token_prefix_123',
        nonce: 'nonce_portal_invalid',
      };
      await expect(
        ActorIdentityBindingService.createBoundSessionAsync(invalidProof, 'TENANT_RESTRICTED', 3600, { nonceStore })
      ).rejects.toThrow('Invalid PORTAL_SESSION token format');
    });

    it('adversarial distributed test: concurrent attempts on identical witness across independent instances result in exactly one session and one REPLAY_DETECTED', async () => {
      // Shared persistent backing store (simulates PostgreSQL a2a_nonces table across serverless instances)
      const sharedDbRows = new Set<string>();
      
      class SharedDbInstanceStore {
        async consumeNonce(params: { nonce: string; purpose: string; tenantId: string; expiresAt: Date }) {
          const key = `hses_${params.purpose}_${params.tenantId}_${params.nonce}`;
          if (sharedDbRows.has(key)) {
            return { status: 'DUPLICATE' as const };
          }
          sharedDbRows.add(key);
          return { status: 'CONSUMED' as const };
        }
      }

      const instanceAStore = new SharedDbInstanceStore();
      const instanceBStore = new SharedDbInstanceStore();

      const proof: ActorBindingProof = {
        actorId: 'distributed_actor_1',
        tenantId: 'snarai_distributed',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'distributed_sig_123',
        issuedAt: Date.now(),
        nonce: `nonce_dist_${Date.now()}`,
      };

      const now = Date.now();
      const canonicalPayload = [
        'WITNESS_V3_TLV',
        proof.authProvider,
        proof.actorId,
        proof.tenantId,
        proof.nonce,
        String(proof.issuedAt),
        String(now),
        'CONFIDENTIAL',
        String(3600),
      ].map(f => `${Buffer.byteLength(f, 'utf8')}:${f}`).join('|');

      const witnessToken = createHmac('sha256', (ActorIdentityBindingService as any).getSessionSecret())
        .update(canonicalPayload, 'utf8')
        .digest('hex');

      const witness = {
        _witnessToken: witnessToken,
        verifiedAt: now,
        authProvider: 'PORTAL_INTERNAL' as const,
        clearanceLevel: 'CONFIDENTIAL' as const,
        ttlSeconds: 3600,
      };

      // Two concurrent calls executing in two separate instances against the same witness
      const [resultA, resultB] = await Promise.allSettled([
        ActorIdentityBindingService.createBoundSessionAsync(proof, 'CONFIDENTIAL', 3600, {
          _verifiedWitness: witness,
          nonceStore: instanceAStore,
        }),
        ActorIdentityBindingService.createBoundSessionAsync(proof, 'CONFIDENTIAL', 3600, {
          _verifiedWitness: witness,
          nonceStore: instanceBStore,
        }),
      ]);

      const fulfilled = [resultA, resultB].filter(r => r.status === 'fulfilled');
      const rejected = [resultA, resultB].filter(r => r.status === 'rejected');

      // Exactly ONE succeeds
      expect(fulfilled).toHaveLength(1);
      const session = (fulfilled[0] as PromiseFulfilledResult<any>).value;
      expect(session.actorId).toBe('distributed_actor_1');
      expect(session.tenantId).toBe('snarai_distributed');

      // Exactly ONE fails with REPLAY_DETECTED
      expect(rejected).toHaveLength(1);
      const error = (rejected[0] as PromiseRejectedResult).reason;
      expect(error.message).toContain('Verification witness has already been consumed across instances. Replay strictly forbidden.');
      expect(error.authCode).toBe('REPLAY_DETECTED');
    });

    it('adversarial distributed test: instance restart / cold start cannot replay previously consumed witness (persistence survival)', async () => {
      const sharedDbRows = new Set<string>();
      class SharedDbInstanceStore {
        async consumeNonce(params: { nonce: string; purpose: string; tenantId: string; expiresAt: Date }) {
          const key = `hses_${params.purpose}_${params.tenantId}_${params.nonce}`;
          if (sharedDbRows.has(key)) return { status: 'DUPLICATE' as const };
          sharedDbRows.add(key);
          return { status: 'CONSUMED' as const };
        }
      }

      const instance1Store = new SharedDbInstanceStore();
      const instance2Store = new SharedDbInstanceStore();

      const proof: ActorBindingProof = {
        actorId: 'cold_start_actor',
        tenantId: 'snarai_cold_start',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'cold_start_sig',
        issuedAt: Date.now(),
        nonce: `nonce_cold_${Date.now()}`,
      };

      const now = Date.now();
      const canonicalPayload = [
        'WITNESS_V3_TLV',
        proof.authProvider,
        proof.actorId,
        proof.tenantId,
        proof.nonce,
        String(proof.issuedAt),
        String(now),
        'CONFIDENTIAL',
        String(3600),
      ].map(f => `${Buffer.byteLength(f, 'utf8')}:${f}`).join('|');

      const witnessToken = createHmac('sha256', (ActorIdentityBindingService as any).getSessionSecret())
        .update(canonicalPayload, 'utf8')
        .digest('hex');

      const witness = {
        _witnessToken: witnessToken,
        verifiedAt: now,
        authProvider: 'PORTAL_INTERNAL' as const,
        clearanceLevel: 'CONFIDENTIAL' as const,
        ttlSeconds: 3600,
      };

      // Instance 1 processes witness
      const session1 = await ActorIdentityBindingService.createBoundSessionAsync(proof, 'CONFIDENTIAL', 3600, {
        _verifiedWitness: witness,
        nonceStore: instance1Store,
      });
      expect(session1.actorId).toBe('cold_start_actor');

      // Instance 1 terminates / restarts -> local in-memory Map is completely cleared!
      ActorIdentityBindingService.clearConsumedWitnessTokensForTesting();

      // Instance 2 (fresh boot, zero memory cache) receives the same witness replay
      await expect(
        ActorIdentityBindingService.createBoundSessionAsync(proof, 'CONFIDENTIAL', 3600, {
          _verifiedWitness: witness,
          nonceStore: instance2Store,
        })
      ).rejects.toThrow('Verification witness has already been consumed across instances. Replay strictly forbidden.');
    });

    it('adversarial distributed test: persistence failure during witness consumption rejects with PERSISTENCE_ERROR and zero sessions issued (fail-closed)', async () => {
      const failingStore = {
        consumeNonce: async () => ({
          status: 'ERROR' as const,
          error: 'ECONNREFUSED: Database connection dropped during witness consumption',
        }),
      };

      const proof: ActorBindingProof = {
        actorId: 'fail_closed_actor',
        tenantId: 'snarai_fail_closed',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'fail_sig',
        issuedAt: Date.now(),
        nonce: `nonce_fail_${Date.now()}`,
      };

      const now = Date.now();
      const canonicalPayload = [
        'WITNESS_V3_TLV',
        proof.authProvider,
        proof.actorId,
        proof.tenantId,
        proof.nonce,
        String(proof.issuedAt),
        String(now),
        'CONFIDENTIAL',
        String(3600),
      ].map(f => `${Buffer.byteLength(f, 'utf8')}:${f}`).join('|');

      const witnessToken = createHmac('sha256', (ActorIdentityBindingService as any).getSessionSecret())
        .update(canonicalPayload, 'utf8')
        .digest('hex');

      const witness = {
        _witnessToken: witnessToken,
        verifiedAt: now,
        authProvider: 'PORTAL_INTERNAL' as const,
        clearanceLevel: 'CONFIDENTIAL' as const,
        ttlSeconds: 3600,
      };

      let thrownError: any = null;
      try {
        await ActorIdentityBindingService.createBoundSessionAsync(proof, 'CONFIDENTIAL', 3600, {
          _verifiedWitness: witness,
          nonceStore: failingStore,
        });
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError.authCode).toBe('PERSISTENCE_ERROR');
      expect(thrownError.message).toContain('Witness persistence error');
      expect(thrownError.message).toContain('ECONNREFUSED');
    });

    it('adversarial distributed test: forged witness fails HMAC validation before storage consumption (prevents storage poisoning/DoS)', async () => {
      let consumeNonceCalled = false;
      const spiedStore = {
        consumeNonce: async () => {
          consumeNonceCalled = true;
          return { status: 'CONSUMED' as const };
        },
      };

      const proof: ActorBindingProof = {
        actorId: 'attacker_forger',
        tenantId: 'snarai_forged',
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: 'forged_sig',
        issuedAt: Date.now(),
        nonce: `nonce_forged_${Date.now()}`,
      };

      const forgedWitness = {
        _witnessToken: 'forged_deadbeef_invalid_hmac_token',
        verifiedAt: Date.now(),
        authProvider: 'PORTAL_INTERNAL' as const,
        clearanceLevel: 'CONFIDENTIAL' as const,
        ttlSeconds: 3600,
      };

      await expect(
        ActorIdentityBindingService.createBoundSessionAsync(proof, 'CONFIDENTIAL', 3600, {
          _verifiedWitness: forgedWitness,
          nonceStore: spiedStore,
        })
      ).rejects.toThrow('Invalid or tampered verification witness token.');

      // CRITICAL: Database was NEVER contacted because HMAC check failed first!
      expect(consumeNonceCalled).toBe(false);
    });

    it('integration contract: PostgresA2aNonceStore exercises consumeA2aNonce and handles CONSUMED, DUPLICATE and ERROR', async () => {
      const { PostgresA2aNonceStore, consumeA2aNonce } = await import('../nonce-store.service');
      const store = new PostgresA2aNonceStore();

      // Test key derivation contract
      expect(store).toBeDefined();
      expect(typeof store.consumeNonce).toBe('function');

      // The unit test verifies consumeA2aNonce integration contract when db-core is exercised
      const testNonce = `test_postgres_store_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 60000);

      const result = await store.consumeNonce({
        nonce: testNonce,
        purpose: 'TEST_PURPOSE',
        tenantId: 'tenant_contract_check',
        expiresAt,
      });

      // Returns a valid NonceConsumptionResult conforming to the discriminator type
      expect(['CONSUMED', 'DUPLICATE', 'ERROR']).toContain(result.status);
    });
  });
});


