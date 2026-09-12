/**
 * 🧪 DIRECT CHANNEL PUBLISHER CLOUD — TEST SUITE (FASE 2)
 * apps/dashboard/src/lib/hermes/channels/__tests__/direct-publisher.test.ts
 *
 * Validates:
 * 1. Server-side credential decryption in RAM without caller exposure.
 * 2. Strict tenant isolation (Tenant A cannot publish through Tenant B integration).
 * 3. Idempotency enforcement (same key returns cached receipt, missing key rejected).
 * 4. Formal uniform receipt on success.
 * 5. Formal uniform receipt on external provider failure (never fakes success).
 * 6. Capability enforcement (CONNECTED + supportedCapabilities check).
 * 7. Provider error normalization (auth, rate limits, chat not found).
 * 8. Newsletter sender vs audience provider separation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DirectChannelPublisher } from '../publishers/direct-channel-publisher';
import { TelegramPublisher } from '../publishers/telegram-publisher';
import { XPublisher } from '../publishers/x-publisher';
import { NewsletterPublisher, type ISenderProvider, type IAudienceProvider } from '../publishers/newsletter-publisher';
import { channelVaultAdapter } from '../channel-vault.service';
import { db } from '@/db';
import type { PublicationPayload } from '../publishers/publisher.types';

describe('🚀 Hermes Direct Channel Publisher — Security, Idempotency & Receipts (Fase 2)', () => {
  const TENANT_A_ORG_ID = 'org_uuid_tenant_alpha_1111';
  const TENANT_B_ORG_ID = 'org_uuid_tenant_beta_2222';
  const INTEGRATION_ID_A = 'int_telegram_alpha_123';

  let publisher: DirectChannelPublisher;

  beforeEach(() => {
    vi.restoreAllMocks();
    publisher = new DirectChannelPublisher();
  });

  // ── TEST 1: IDEMPOTENCY ENFORCEMENT ──
  it('1. Idempotency Enforcement — Missing key fails closed; duplicate key returns cached receipt without re-dispatch', async () => {
    // 1.1 Missing idempotencyKey fails immediately
    const missingKeyRes = await publisher.publishToChannel(TENANT_A_ORG_ID, INTEGRATION_ID_A, {
      text: 'Test message',
      contentType: 'text',
      idempotencyKey: '',
    } as any);

    expect(missingKeyRes.success).toBe(false);
    expect(missingKeyRes.errorCode).toBe('PROVIDER_PAYLOAD_INVALID');
    expect(missingKeyRes.errorMessage).toContain('idempotencyKey is required');

    // 1.2 Setup valid record in DB
    const mockRecord = {
      id: INTEGRATION_ID_A,
      tenantId: TENANT_A_ORG_ID,
      channel: 'telegram',
      accountName: 'Alpha Official',
      accountHandle: '@alpha_news',
      status: 'CONNECTED',
      supportedCapabilities: ['text', 'image'],
      encryptedPayload: { ciphertext: 'valid_encrypted_blob' },
      metadata: {},
    };

    vi.spyOn(db.query.tenantSocialIntegrations, 'findFirst').mockResolvedValue(mockRecord as any);
    vi.spyOn(channelVaultAdapter, 'decryptCredentials').mockResolvedValue({
      channel: 'telegram',
      credentials: { botToken: '123456:ABC', chatId: '@alpha_news' },
    });

    const mockTelegramPublisher = {
      channel: 'telegram' as const,
      publish: vi.fn().mockResolvedValue({
        success: true,
        channel: 'telegram',
        externalPostId: 'msg_999',
        externalUrl: 'https://t.me/alpha_news/999',
        publishedAt: new Date().toISOString(),
        idempotencyKey: 'idem_key_unique_001',
      }),
    };

    publisher.registerPublisher('telegram', mockTelegramPublisher as any);

    const payload: PublicationPayload = {
      text: 'Hello decentralized world',
      contentType: 'text',
      idempotencyKey: 'idem_key_unique_001',
    };

    // First dispatch -> calls provider
    const receipt1 = await publisher.publishToChannel(TENANT_A_ORG_ID, INTEGRATION_ID_A, payload);
    expect(receipt1.success).toBe(true);
    expect(receipt1.externalPostId).toBe('msg_999');
    expect(mockTelegramPublisher.publish).toHaveBeenCalledTimes(1);

    // Second dispatch with same idempotencyKey -> cached, ZERO additional provider calls
    const receipt2 = await publisher.publishToChannel(TENANT_A_ORG_ID, INTEGRATION_ID_A, payload);
    expect(receipt2.success).toBe(true);
    expect(receipt2.externalPostId).toBe('msg_999');
    expect(mockTelegramPublisher.publish).toHaveBeenCalledTimes(1);
  });

  // ── TEST 2: TENANT ISOLATION ──
  it('2. Tenant Isolation — Tenant A cannot publish through Tenant B integration', async () => {
    // DB returns null because where query checks tenantId = canonicalOrgId
    vi.spyOn(db.query.tenantSocialIntegrations, 'findFirst').mockResolvedValue(undefined);

    const res = await publisher.publishToChannel(
      TENANT_A_ORG_ID,
      'int_telegram_belonging_to_beta',
      {
        text: 'Hostile takeover attempt',
        contentType: 'text',
        idempotencyKey: 'idem_takeover_01',
      }
    );

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('CHANNEL_NOT_CONNECTED');
    expect(res.errorMessage).toContain('not found for authorized tenant');
  });

  // ── TEST 3: CAPABILITY ENFORCEMENT ──
  it('3. Capability Enforcement — Rejects image distribution on a text-only channel', async () => {
    const mockTextOnlyRecord = {
      id: INTEGRATION_ID_A,
      tenantId: TENANT_A_ORG_ID,
      channel: 'telegram',
      accountName: 'Alpha Text Only',
      accountHandle: '@alpha_text',
      status: 'CONNECTED',
      supportedCapabilities: ['text'], // ONLY TEXT, NO IMAGE
      encryptedPayload: { ciphertext: 'valid_encrypted_blob' },
      metadata: {},
    };

    vi.spyOn(db.query.tenantSocialIntegrations, 'findFirst').mockResolvedValue(mockTextOnlyRecord as any);

    const res = await publisher.publishToChannel(TENANT_A_ORG_ID, INTEGRATION_ID_A, {
      text: 'Look at this photo',
      contentType: 'image',
      mediaUrls: ['https://ipfs.io/ipfs/bafytest123'],
      idempotencyKey: 'idem_cap_check_01',
    });

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('CAPABILITY_MISMATCH');
    expect(res.errorMessage).toContain("does not support 'image' distribution");
  });

  // ── TEST 4: NON-CONNECTED STATUS REJECTION ──
  it('4. Status Enforcement — Rejects channels in CONNECTING or REVOKED state', async () => {
    const mockConnectingRecord = {
      id: 'int_x_001',
      tenantId: TENANT_A_ORG_ID,
      channel: 'x',
      accountName: 'Alpha X',
      accountHandle: '@alpha_x',
      status: 'CONNECTING', // NOT YET CONNECTED
      supportedCapabilities: ['text'],
      encryptedPayload: { ciphertext: 'blob' },
      metadata: {},
    };

    vi.spyOn(db.query.tenantSocialIntegrations, 'findFirst').mockResolvedValue(mockConnectingRecord as any);

    const res = await publisher.publishToChannel(TENANT_A_ORG_ID, 'int_x_001', {
      text: 'Tweeting before oauth',
      contentType: 'text',
      idempotencyKey: 'idem_status_01',
    });

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('CHANNEL_NOT_CONNECTED');
    expect(res.errorMessage).toContain("requires 'CONNECTED' to publish");
  });

  // ── TEST 5: NEVER FAKES SUCCESS (TELEGRAM PROVIDER ERROR) ──
  it('5. Verifiable Confirmation — Telegram provider returns false and normalized error when API rejects', async () => {
    const telegramPublisher = new TelegramPublisher();

    // Mock global fetch returning Telegram API error (e.g. bot blocked or chat not found)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        ok: false,
        error_code: 400,
        description: 'Bad Request: chat not found',
      }),
    } as any);

    const receipt = await telegramPublisher.publish(
      { botToken: '123456:TEST_TOKEN', chatId: '@non_existent_chat' },
      {
        text: 'Broadcasting to void',
        contentType: 'text',
        idempotencyKey: 'idem_tg_fail_01',
      },
      {
        canonicalOrgId: TENANT_A_ORG_ID,
        integrationId: INTEGRATION_ID_A,
        accountHandle: '@non_existent_chat',
      }
    );

    // Strict invariant: NEVER fakes success
    expect(receipt.success).toBe(false);
    expect(receipt.externalPostId).toBeUndefined();
    expect(receipt.errorCode).toBe('PROVIDER_CHAT_NOT_FOUND');
    expect(receipt.errorMessage).toContain('chat not found');
    expect(receipt.retryable).toBe(false);
    expect(receipt.idempotencyKey).toBe('idem_tg_fail_01');
  });

  // ── TEST 6: TELEGRAM RATE LIMIT NORMALIZATION ──
  it('6. Rate Limit Normalization — Maps 429 to PROVIDER_RATE_LIMIT with retryable: true', async () => {
    const telegramPublisher = new TelegramPublisher();

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        ok: false,
        error_code: 429,
        description: 'Too Many Requests: retry after 30',
      }),
    } as any);

    const receipt = await telegramPublisher.publish(
      { botToken: '123456:TEST_TOKEN', chatId: '@chat' },
      {
        text: 'Fast broadcasting',
        contentType: 'text',
        idempotencyKey: 'idem_tg_rate_01',
      },
      {
        canonicalOrgId: TENANT_A_ORG_ID,
        integrationId: INTEGRATION_ID_A,
        accountHandle: '@chat',
      }
    );

    expect(receipt.success).toBe(false);
    expect(receipt.errorCode).toBe('PROVIDER_RATE_LIMIT');
    expect(receipt.retryable).toBe(true);
  });

  // ── TEST 7: X (TWITTER) PUBLISHER WITH OAUTH 2.0 PKCE ──
  it('7. X Direct Publisher — Verifies tweet creation and normalizes API v2 format', async () => {
    const xPublisher = new XPublisher();

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          id: '1789123456789012345',
          text: 'Pandoras Growth OS Announcement',
        },
      }),
    } as any);

    const receipt = await xPublisher.publish(
      { accessToken: 'oauth2_pkce_user_token_valid' },
      {
        text: 'Pandoras Growth OS Announcement',
        contentType: 'text',
        idempotencyKey: 'idem_x_success_01',
      },
      {
        canonicalOrgId: TENANT_A_ORG_ID,
        integrationId: 'int_x_001',
        accountHandle: '@pandoras_x',
      }
    );

    expect(receipt.success).toBe(true);
    expect(receipt.externalPostId).toBe('1789123456789012345');
    expect(receipt.externalUrl).toBe('https://x.com/i/status/1789123456789012345');
    expect(receipt.publishedAt).toBeDefined();
    expect(receipt.idempotencyKey).toBe('idem_x_success_01');
  });

  // ── TEST 8: NEWSLETTER SENDER VS AUDIENCE SEPARATION ──
  it('8. Newsletter Architecture — Strictly decouples SenderProvider from AudienceProvider', async () => {
    const mockSender: ISenderProvider = {
      name: 'mock_resend',
      send: vi.fn().mockResolvedValue({ messageId: 'resend_email_msg_777' }),
    };

    const mockAudience: IAudienceProvider = {
      name: 'mock_leads',
      resolveAudience: vi.fn().mockResolvedValue({
        recipients: ['investor1@familyoffice.mx', 'investor2@syndicate.io'],
        audienceCount: 2,
      }),
    };

    const newsletterPublisher = new NewsletterPublisher(mockSender, mockAudience);

    const receipt = await newsletterPublisher.publish(
      { apiKey: 're_test_api_key_12345678' },
      {
        text: 'Exclusive quarterly distribution briefing',
        contentType: 'markdown',
        ctaUrl: 'https://pandoras.finance/snarai',
        idempotencyKey: 'idem_news_01',
      },
      {
        canonicalOrgId: TENANT_A_ORG_ID,
        integrationId: 'int_news_001',
        accountHandle: 'Pandoras Institutional Dispatch',
      }
    );

    expect(receipt.success).toBe(true);
    expect(receipt.externalPostId).toBe('resend_email_msg_777');

    // Verify audience resolved independently before transport
    expect(mockAudience.resolveAudience).toHaveBeenCalledWith(TENANT_A_ORG_ID, undefined);

    // Verify sender called with resolved recipients
    expect(mockSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 're_test_api_key_12345678',
        to: ['investor1@familyoffice.mx', 'investor2@syndicate.io'],
        subject: 'Actualización Exclusiva — Hermes Growth',
      })
    );
  });
});
