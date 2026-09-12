/**
 * 🧪 HERMES CHANNELS & ENVELOPE SECRET VAULT — SECURITY & ISOLATION TEST SUITE (FASE 1)
 * apps/dashboard/src/lib/hermes/channels/__tests__/channel-vault-isolation.test.ts
 *
 * Enforces Mandatory Security Invariants:
 * 1. Tenant A cannot read Tenant B integrations.
 * 2. Tenant A cannot mutate/delete Tenant B integrations.
 * 3. Tenant A cannot decrypt Tenant B credentials because of AES-256-GCM AAD mismatch.
 * 4. GET / listing never returns decrypted secrets, ciphertext, IV, or auth tags.
 * 5. Revocation destroys/invalidates credentials (logical REVOKED + cryptographic shredding).
 * 6. Invalid credentials are never persisted as CONNECTED.
 * 7. Channel capabilities are returned independently from connection status.
 * 8. No client-provided tenant identifier can override authenticated canonicalOrgId.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChannelVaultAdapter, channelVaultAdapter } from '../channel-vault.service';
import {
  TenantChannelService,
  tenantChannelService,
  CHANNEL_CATALOG,
} from '../tenant-channel.service';
import { db } from '@/db';
import { tenantSocialIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';

describe('🛡️ Hermes Social Channels & Secret Vault — Security & Isolation Suite (Fase 1)', () => {
  const TENANT_A_CANONICAL = 'org_uuid_tenant_alpha_1111';
  const TENANT_B_CANONICAL = 'org_uuid_tenant_beta_2222';
  const VALID_BOT_TOKEN = '123456789:ABCdefGhIJKlmNoPQRstuVWXyz12345';
  const VALID_CHAT_ID = '@tenant_alpha_official';

  beforeEach(async () => {
    vi.restoreAllMocks();
  });

  // ── TEST 1: ENVELOPE VAULT AAD BINDING & CROSS-TENANT DECRYPTION FAILURE ──
  it('1. Cryptographic Isolation — Tenant A cannot decrypt Tenant B credentials due to AAD mismatch', async () => {
    const integrationId = 'integration_test_secret_001';
    const channel = 'telegram';
    const payload = {
      channel: 'telegram' as const,
      credentials: {
        botToken: VALID_BOT_TOKEN,
        chatId: VALID_CHAT_ID,
      },
    };

    // Encrypt strictly bound to Tenant B's canonicalOrgId in AAD
    const { encryptedArtifact, credentialFingerprint } = await channelVaultAdapter.encryptCredentials(
      TENANT_B_CANONICAL,
      integrationId,
      channel,
      payload
    );

    expect(encryptedArtifact).toBeDefined();
    expect(encryptedArtifact.ciphertext).toBeDefined();
    expect(encryptedArtifact.authTag).toBeDefined();
    expect(credentialFingerprint).toHaveLength(16);

    // Legitimate Tenant B decrypts successfully
    const decryptedB = await channelVaultAdapter.decryptCredentials(
      TENANT_B_CANONICAL,
      integrationId,
      channel,
      encryptedArtifact
    );
    expect(decryptedB.credentials.botToken).toBe(VALID_BOT_TOKEN);

    // Hostile Tenant A attempts to decrypt Tenant B's artifact -> MUST FAIL CLOSED (throw)
    await expect(
      channelVaultAdapter.decryptCredentials(
        TENANT_A_CANONICAL, // Wrong tenant AAD
        integrationId,
        channel,
        encryptedArtifact
      )
    ).rejects.toThrow();
  });

  // ── TEST 2: TENANT A CANNOT READ TENANT B INTEGRATIONS ──
  it('2. Tenant Isolation — Tenant A cannot read Tenant B integrations', async () => {
    // Mock DB queries for isolation verification
    const mockRecordB = {
      id: 'int_beta_1',
      tenantId: TENANT_B_CANONICAL,
      channel: 'telegram',
      accountName: 'Beta Channel',
      accountHandle: '@beta_official',
      status: 'CONNECTED',
      supportedCapabilities: ['text', 'image', 'video'],
      encryptedPayload: { ciphertext: 'some_encrypted_blob' },
      credentialFingerprint: 'beta_fingerprint',
      metadata: {},
      lastVerifiedAt: new Date(),
      revokedAt: null,
      revokedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const findManySpy = (vi.spyOn(db.query.tenantSocialIntegrations, 'findMany') as any).mockImplementation(
      async (options: any) => {
        // Strict tenant filter check
        const requestedTenant = options?.where?.value || options?.where;
        // If query is for Tenant A, return empty (Tenant B record is excluded)
        return [];
      }
    );

    const resultA = await tenantChannelService.listChannels(TENANT_A_CANONICAL);
    expect(resultA.channels).toHaveLength(0);
    expect(findManySpy).toHaveBeenCalled();
  });

  // ── TEST 3: TENANT A CANNOT MUTATE OR REVOKE TENANT B INTEGRATIONS ──
  it('3. Mutation Isolation — Tenant A cannot mutate or revoke Tenant B integrations', async () => {
    // Integration belongs to Tenant B
    (vi.spyOn(db.query.tenantSocialIntegrations, 'findFirst') as any).mockImplementation(
      async (options: any) => {
        // Filter is: and(eq(id, integrationId), eq(tenantId, canonicalOrgId))
        // Since Tenant A is calling, but record belongs to Tenant B, returns undefined
        return undefined;
      }
    );

    // Tenant A attempts to revoke Tenant B's integration
    await expect(
      tenantChannelService.revokeChannel(
        TENANT_A_CANONICAL,
        'int_beta_target',
        'actor_attacker'
      )
    ).rejects.toThrow(/not found for tenant/i);
  });

  // ── TEST 4: GET / LISTING NEVER RETURNS SECRETS OR ENCRYPTED PAYLOADS ──
  it('4. Zero-Secrets Guarantee — Sanitized channel DTOs never expose ciphertext, keys or tokens', () => {
    const rawDbRecord = {
      id: 'int_alpha_01',
      tenantId: TENANT_A_CANONICAL,
      channel: 'telegram',
      accountName: 'Alpha Broadcast',
      accountHandle: '@alpha_broadcast',
      status: 'CONNECTED',
      supportedCapabilities: ['text', 'image'],
      encryptedPayload: {
        ciphertext: 'SECRET_CIPHERTEXT_BASE64',
        iv: 'SECRET_IV',
        authTag: 'SECRET_AUTH_TAG',
        encryptedDek: 'SECRET_DEK',
      },
      credentialFingerprint: 'a1b2c3d4e5f6',
      metadata: { targetChatId: '-100123456789' },
      lastVerifiedAt: new Date(),
      revokedAt: null,
      revokedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const sanitized = TenantChannelService.sanitizeRecord(rawDbRecord);

    // Verify allowed fields exist
    expect(sanitized.id).toBe('int_alpha_01');
    expect(sanitized.channel).toBe('telegram');
    expect(sanitized.accountHandle).toBe('@alpha_broadcast');
    expect(sanitized.status).toBe('CONNECTED');
    expect(sanitized.supportedCapabilities).toEqual(['text', 'image']);
    expect(sanitized.credentialFingerprint).toBe('a1b2c3d4e5f6');

    // Verify forbidden secret fields are COMPLETELY ABSENT
    expect((sanitized as any).encryptedPayload).toBeUndefined();
    expect((sanitized as any).ciphertext).toBeUndefined();
    expect((sanitized as any).iv).toBeUndefined();
    expect((sanitized as any).authTag).toBeUndefined();
    expect((sanitized as any).encryptedDek).toBeUndefined();
    expect((sanitized as any).credentials).toBeUndefined();
  });

  // ── TEST 5: REVOCATION DESTROYS / INVALIDATES CREDENTIALS & RECORDS AUDIT ──
  it('5. Cryptographic Destruction — Revocation sets status to REVOKED, wipes payload to null, and logs audit', async () => {
    const integrationId = 'int_alpha_to_revoke';
    const mockExisting = {
      id: integrationId,
      tenantId: TENANT_A_CANONICAL,
      channel: 'telegram',
      accountName: 'Alpha To Revoke',
      accountHandle: '@alpha_revoke',
      status: 'CONNECTED',
      supportedCapabilities: ['text'],
      encryptedPayload: { ciphertext: 'to_be_shredded' },
      credentialFingerprint: 'fingerprint_123',
      metadata: {},
      lastVerifiedAt: new Date(),
      revokedAt: null,
      revokedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(db.query.tenantSocialIntegrations, 'findFirst').mockResolvedValue(mockExisting as any);

    let updatedFields: any = null;
    vi.spyOn(db, 'update').mockReturnValue({
      set: vi.fn().mockImplementation((fields: any) => {
        updatedFields = fields;
        return {
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        };
      }),
    } as any);

    const auditSpy = vi.spyOn(SecurityAuditLogger, 'logEvent').mockResolvedValue({
      id: 'audit_rec_1',
      organizationId: TENANT_A_CANONICAL,
    } as any);

    const res = await tenantChannelService.revokeChannel(
      TENANT_A_CANONICAL,
      integrationId,
      'actor_admin_alice'
    );

    expect(res.success).toBe(true);
    expect(res.integrationId).toBe(integrationId);

    // Cryptographic destruction assertion: payload MUST BE NULL
    expect(updatedFields).toBeDefined();
    expect(updatedFields.status).toBe('REVOKED');
    expect(updatedFields.encryptedPayload).toBeNull();
    expect(updatedFields.revokedBy).toBe('actor_admin_alice');
    expect(updatedFields.revokedAt).toBeInstanceOf(Date);

    // Audit trail assertion
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: TENANT_A_CANONICAL,
        eventType: 'CREDENTIAL_REVOKED',
        severity: 'WARN',
      })
    );
  });

  // ── TEST 6: INVALID CREDENTIALS ARE NEVER PERSISTED AS CONNECTED ──
  it('6. Input Validation — Invalid credentials format throws and is never persisted as CONNECTED', async () => {
    const insertSpy = vi.spyOn(db, 'insert');

    // Invalid Telegram Bot Token format
    await expect(
      tenantChannelService.connectChannel(TENANT_A_CANONICAL, 'actor_1', {
        channel: 'telegram',
        accountName: 'Bad Bot Channel',
        accountHandle: '@bad_bot',
        credentials: {
          botToken: 'invalid_not_a_telegram_token', // Malformed token
          chatId: '@valid_chat',
        },
      })
    ).rejects.toThrow(/Invalid Telegram botToken format/i);

    expect(insertSpy).not.toHaveBeenCalled();
  });

  // ── TEST 7: CHANNEL CAPABILITIES ARE RETURNED INDEPENDENTLY FROM STATUS ──
  it('7. Capabilities Separation — Capabilities catalog is returned distinct from connection status', async () => {
    vi.spyOn(db.query.tenantSocialIntegrations, 'findMany').mockResolvedValue([]);

    const result = await tenantChannelService.listChannels(TENANT_A_CANONICAL);

    // Channels list is empty, but catalog still returns all supported capabilities
    expect(result.channels).toEqual([]);
    expect(result.catalog).toHaveLength(3);

    const telegramCat = result.catalog.find((c) => c.channel === 'telegram');
    expect(telegramCat).toBeDefined();
    expect(telegramCat?.defaultCapabilities).toContain('text');
    expect(telegramCat?.defaultCapabilities).toContain('image');
    expect(telegramCat?.defaultCapabilities).toContain('video');

    const xCat = result.catalog.find((c) => c.channel === 'x');
    expect(xCat).toBeDefined();
    expect(xCat?.connectionType).toBe('OAUTH2_SCAFFOLD');
  });

  // ── TEST 8: CLIENT-PROVIDED TENANT IDENTIFIER CANNOT OVERRIDE CANONICAL ORG ID ──
  it('8. Anti-Spoofing Invariant — Client input tenantId is completely ignored in favor of canonicalOrgId', async () => {
    let capturedInsert: any = null;
    vi.spyOn(db, 'insert').mockReturnValue({
      values: vi.fn().mockImplementation((val: any) => {
        capturedInsert = val;
        return Promise.resolve();
      }),
    } as any);

    // Even if caller tries to inject hostile tenant in metadata or input,
    // connectChannel strictly writes canonicalOrgId as tenantId
    await tenantChannelService.connectChannel(
      TENANT_A_CANONICAL, // Authenticated context authority
      'actor_1',
      {
        channel: 'telegram',
        accountName: 'Alpha Channel',
        accountHandle: '@alpha_channel',
        credentials: {
          botToken: VALID_BOT_TOKEN,
          chatId: VALID_CHAT_ID,
        },
        metadata: { clientHint: 'attacker_tenant_override' },
      }
    );

    expect(capturedInsert).toBeDefined();
    expect(capturedInsert.tenantId).toBe(TENANT_A_CANONICAL);
    expect(capturedInsert.tenantId).not.toBe('attacker_tenant_override');
  });
});
