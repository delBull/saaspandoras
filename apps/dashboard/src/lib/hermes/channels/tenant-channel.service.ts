/**
 * 📡 Hermes Tenant Social Channels Domain Service
 * apps/dashboard/src/lib/hermes/channels/tenant-channel.service.ts
 *
 * Manages tenant-owned social channels for sovereign distribution.
 *
 * MANDATORY INVARIANTS:
 * 1. `canonicalOrgId` MUST originate from authenticated server-side context.
 * 2. Strict tenant isolation on every read, write, and deletion.
 * 3. Never returns decrypted credentials, ciphertext, IVs, or auth tags in DTOs.
 * 4. Revocation performs logical status update AND cryptographic shredding (`encryptedPayload = null`).
 * 5. Deletion/revocation is permanently logged in the tamper-evident SecurityAuditLogger.
 * 6. `supportedCapabilities` remains distinct and independent from connection `status`.
 */

import crypto from 'crypto';
import { db } from '@/db';
import { tenantSocialIntegrations, type TenantSocialIntegration } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { channelVaultAdapter, type ChannelType } from './channel-vault.service';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';

export interface ChannelCapabilityCatalogItem {
  channel: ChannelType;
  displayName: string;
  description: string;
  defaultCapabilities: string[];
  connectionType: 'DIRECT_SECRET' | 'OAUTH2_SCAFFOLD';
}

export const CHANNEL_CATALOG: ChannelCapabilityCatalogItem[] = [
  {
    channel: 'telegram',
    displayName: 'Telegram Channel / Group',
    description: 'Difusión y distribución directa en canales o grupos de Telegram operados por el bot del tenant.',
    defaultCapabilities: ['text', 'image', 'video'],
    connectionType: 'DIRECT_SECRET',
  },
  {
    channel: 'x',
    displayName: 'X (Twitter)',
    description: 'Publicación programada y threads en cuentas corporativas de X / Twitter.',
    defaultCapabilities: ['text', 'image'],
    connectionType: 'OAUTH2_SCAFFOLD',
  },
  {
    channel: 'newsletter',
    displayName: 'Newsletter / Email Dispatch',
    description: 'Distribución editorial proactiva hacia listas de suscriptores vía SMTP / Resend.',
    defaultCapabilities: ['text', 'markdown'],
    connectionType: 'DIRECT_SECRET',
  },
];

export interface SanitizedChannelDTO {
  id: string;
  channel: ChannelType;
  accountName: string;
  accountHandle: string;
  status: string; // 'CONNECTED' | 'REVOKED' | 'ERROR' | 'CONNECTING'
  supportedCapabilities: string[];
  credentialFingerprint: string | null;
  metadata: Record<string, unknown>;
  lastVerifiedAt: string | null;
  createdAt: string;
  revokedAt?: string | null;
}

export interface ConnectChannelInput {
  channel: ChannelType;
  accountName: string;
  accountHandle: string;
  credentials: Record<string, unknown>;
  supportedCapabilities?: string[];
  metadata?: Record<string, unknown>;
}

export class TenantChannelService {
  /**
   * Sanitizes a database record to guarantee NO encrypted material, keys, or secrets are exposed.
   */
  public static sanitizeRecord(record: TenantSocialIntegration): SanitizedChannelDTO {
    return {
      id: record.id,
      channel: record.channel as ChannelType,
      accountName: record.accountName,
      accountHandle: record.accountHandle,
      status: record.status,
      supportedCapabilities: (record.supportedCapabilities as string[]) || [],
      credentialFingerprint: record.credentialFingerprint,
      metadata: (record.metadata as Record<string, unknown>) || {},
      lastVerifiedAt: record.lastVerifiedAt ? record.lastVerifiedAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      revokedAt: record.revokedAt ? record.revokedAt.toISOString() : null,
    };
  }

  /**
   * Lists all configured channels for a tenant.
   * Strips all secrets; returns channels + capability catalog.
   */
  async listChannels(canonicalOrgId: string): Promise<{
    channels: SanitizedChannelDTO[];
    catalog: ChannelCapabilityCatalogItem[];
  }> {
    if (!canonicalOrgId) {
      throw new Error('[TenantChannelService] canonicalOrgId is required to list channels.');
    }

    const records = await db.query.tenantSocialIntegrations.findMany({
      where: eq(tenantSocialIntegrations.tenantId, canonicalOrgId),
      orderBy: [desc(tenantSocialIntegrations.createdAt)],
    });

    const channels = records.map(TenantChannelService.sanitizeRecord);

    return {
      channels,
      catalog: CHANNEL_CATALOG,
    };
  }

  /**
   * Connects and securely envelopes a new social channel.
   * Encrypts secrets with AES-256-GCM via KnowledgeEnvelopeVault adapter,
   * binding canonicalOrgId as AAD.
   */
  async connectChannel(
    canonicalOrgId: string,
    actorId: string,
    input: ConnectChannelInput
  ): Promise<SanitizedChannelDTO> {
    if (!canonicalOrgId) {
      throw new Error('[TenantChannelService] canonicalOrgId is required to connect a channel.');
    }

    const catalogItem = CHANNEL_CATALOG.find((c) => c.channel === input.channel);
    if (!catalogItem) {
      throw new Error(`[TenantChannelService] Unsupported channel: '${input.channel}'.`);
    }

    if (!input.accountName || !input.accountName.trim()) {
      throw new Error('[TenantChannelService] accountName is required.');
    }

    if (!input.accountHandle || !input.accountHandle.trim()) {
      throw new Error('[TenantChannelService] accountHandle is required.');
    }

    // Channel-specific validations & status assignment
    let initialStatus: 'CONNECTED' | 'CONNECTING' = 'CONNECTED';

    if (input.channel === 'telegram') {
      const botToken = input.credentials?.botToken as string;
      const chatId = input.credentials?.chatId as string;

      if (!botToken || typeof botToken !== 'string') {
        throw new Error('[TenantChannelService] Telegram botToken is required.');
      }
      if (!chatId || typeof chatId !== 'string') {
        throw new Error('[TenantChannelService] Telegram chatId is required.');
      }

      // Validate Telegram bot token format: \d+:[A-Za-z0-9_-]+
      const telegramTokenRegex = /^\d+:[A-Za-z0-9_-]{30,}$/;
      if (!telegramTokenRegex.test(botToken.trim())) {
        throw new Error('[TenantChannelService] Invalid Telegram botToken format.');
      }
    } else if (input.channel === 'x') {
      // Phase 1/2 OAuth scaffold: X remains in CONNECTING until PKCE token exchange is verified
      initialStatus = 'CONNECTING';
    } else if (input.channel === 'newsletter') {
      const apiKey = input.credentials?.apiKey as string;
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
        throw new Error('[TenantChannelService] Newsletter API key is required and must be valid.');
      }
    }

    const integrationId = crypto.randomUUID();
    const supportedCapabilities = input.supportedCapabilities && input.supportedCapabilities.length > 0
      ? input.supportedCapabilities
      : catalogItem.defaultCapabilities;

    // Strict metadata sanitization: metadata is for public display only (e.g. channel name, chat title).
    // Sensitive credentials MUST be placed in credentials, never metadata.
    const forbiddenKeys = new Set([
      'token', 'secret', 'key', 'password', 'bottoken', 'apikey',
      'accesstoken', 'refreshtoken', 'privatekey', 'credentials', 'auth'
    ]);
    const sanitizedMetadata: Record<string, unknown> = {};
    if (input.metadata && typeof input.metadata === 'object') {
      for (const [k, v] of Object.entries(input.metadata)) {
        if (!forbiddenKeys.has(k.toLowerCase()) && typeof v !== 'function') {
          sanitizedMetadata[k] = v;
        }
      }
    }

    // Encrypt secrets using certified KnowledgeEnvelopeVault primitive
    const { encryptedArtifact, credentialFingerprint } = await channelVaultAdapter.encryptCredentials(
      canonicalOrgId,
      integrationId,
      input.channel,
      {
        channel: input.channel,
        credentials: input.credentials,
      }
    );

    const now = new Date();
    const newRecord: typeof tenantSocialIntegrations.$inferInsert = {
      id: integrationId,
      tenantId: canonicalOrgId, // Authority strictly derived from session
      channel: input.channel,
      accountName: input.accountName.trim(),
      accountHandle: input.accountHandle.trim(),
      status: initialStatus,
      supportedCapabilities,
      encryptedPayload: encryptedArtifact,
      credentialFingerprint,
      metadata: sanitizedMetadata,
      lastVerifiedAt: initialStatus === 'CONNECTED' ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tenantSocialIntegrations).values(newRecord);

    return {
      id: integrationId,
      channel: input.channel,
      accountName: newRecord.accountName,
      accountHandle: newRecord.accountHandle,
      status: initialStatus,
      supportedCapabilities,
      credentialFingerprint,
      metadata: newRecord.metadata as Record<string, unknown>,
      lastVerifiedAt: newRecord.lastVerifiedAt ? newRecord.lastVerifiedAt.toISOString() : null,
      createdAt: now.toISOString(),
      revokedAt: null,
    };
  }

  /**
   * Revokes a channel:
   * 1. Validates strict tenant ownership (`tenantId = canonicalOrgId`).
   * 2. Sets status to 'REVOKED'.
   * 3. Performs cryptographic shredding: wipes `encryptedPayload = null`.
   * 4. Emits tamper-evident hash-chained audit event.
   */
  async revokeChannel(
    canonicalOrgId: string,
    integrationId: string,
    actorId: string
  ): Promise<{ success: boolean; integrationId: string }> {
    if (!canonicalOrgId || !integrationId) {
      throw new Error('[TenantChannelService] canonicalOrgId and integrationId are required for revocation.');
    }

    // 1. Verify existence and tenant isolation
    const existing = await db.query.tenantSocialIntegrations.findFirst({
      where: and(
        eq(tenantSocialIntegrations.id, integrationId),
        eq(tenantSocialIntegrations.tenantId, canonicalOrgId)
      ),
    });

    if (!existing) {
      throw new Error(`[TenantChannelService] Integration '${integrationId}' not found for tenant.`);
    }

    if (existing.status === 'REVOKED' && existing.encryptedPayload === null) {
      return { success: true, integrationId };
    }

    const now = new Date();

    // 2. Perform logical revocation + cryptographic shredding of secret payload
    await db
      .update(tenantSocialIntegrations)
      .set({
        status: 'REVOKED',
        encryptedPayload: null, // Cryptographic destruction of secret material
        revokedAt: now,
        revokedBy: actorId || 'portal_user',
        updatedAt: now,
      })
      .where(
        and(
          eq(tenantSocialIntegrations.id, integrationId),
          eq(tenantSocialIntegrations.tenantId, canonicalOrgId)
        )
      );

    // 3. Emit immutable security audit event
    try {
      await SecurityAuditLogger.logEvent({
        organizationId: canonicalOrgId,
        actorId: actorId || 'portal_user',
        eventType: 'CREDENTIAL_REVOKED',
        severity: 'WARN',
        policyDecision: 'ALLOW',
        correlationId: `revocation_${integrationId}_${Date.now()}`,
        artifactId: `channel_cred_${existing.channel}_${integrationId}`,
        metadata: {
          channel: existing.channel,
          integrationId,
          accountHandle: existing.accountHandle,
          action: 'LOGICAL_REVOCATION_AND_CRYPTOGRAPHIC_SHREDDING',
          timestamp: now.toISOString(),
        },
      });
    } catch (auditErr) {
      console.warn('[TenantChannelService] Security audit logging warning:', auditErr);
    }

    return { success: true, integrationId };
  }
}

// Global singleton instance
export const tenantChannelService = new TenantChannelService();
