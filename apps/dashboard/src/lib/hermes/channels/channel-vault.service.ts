/**
 * 🔐 Hermes Channel Secret Vault Adapter
 * apps/dashboard/src/lib/hermes/channels/channel-vault.service.ts
 *
 * Reuses Pandora's certified AES-256-GCM KnowledgeEnvelopeVault primitive.
 * This file is strictly an ADAPTER, not a parallel cryptographic implementation.
 *
 * MANDATORY SECURITY INVARIANTS:
 * 1. Cryptographically binds authenticated `canonicalOrgId` into the AES-GCM AAD.
 * 2. Cross-tenant decryption attempts fail closed (throw on AAD mismatch).
 * 3. Never returns or logs raw credentials or decryption keys.
 * 4. Generates non-reversible truncated SHA-256 fingerprints for audit traceability.
 */

import crypto from 'crypto';
import {
  KnowledgeEnvelopeVault,
  EncryptedKnowledgeArtifact,
  EncryptionContextAAD
} from '@/lib/pandoras/core/domains/hermes/knowledge/envelope-vault';

export type ChannelType = 'telegram' | 'x' | 'newsletter';

export interface ChannelCredentialsPayload {
  channel: ChannelType;
  credentials: Record<string, unknown>;
}

export class ChannelVaultAdapter {
  private _vault: KnowledgeEnvelopeVault | null = null;

  constructor(vault?: KnowledgeEnvelopeVault) {
    if (vault) this._vault = vault;
  }

  private get vault(): KnowledgeEnvelopeVault {
    if (!this._vault) {
      this._vault = new KnowledgeEnvelopeVault();
    }
    return this._vault;
  }

  /**
   * Encrypts sensitive channel credentials using Pandora's certified KnowledgeEnvelopeVault primitive.
   * Cryptographically binds canonicalOrgId into the AAD.
   */
  async encryptCredentials(
    canonicalOrgId: string,
    integrationId: string,
    channel: ChannelType,
    payload: ChannelCredentialsPayload
  ): Promise<{
    encryptedArtifact: EncryptedKnowledgeArtifact;
    credentialFingerprint: string;
  }> {
    if (!canonicalOrgId || !integrationId || !channel) {
      throw new Error('[ChannelVaultAdapter] Missing required parameters for encryption: canonicalOrgId, integrationId, channel are mandatory.');
    }

    const plaintext = JSON.stringify(payload);
    
    // Truncated SHA-256 fingerprint safe for audit logging and validation without exposing secrets
    const credentialFingerprint = crypto
      .createHash('sha256')
      .update(plaintext, 'utf8')
      .digest('hex')
      .slice(0, 16);

    const aadContext: EncryptionContextAAD = {
      tenantId: canonicalOrgId,
      artifactId: `channel_cred_${channel}_${integrationId}`,
      version: 1,
      classification: 'SECRET',
    };

    const encryptedArtifact = await this.vault.encryptArtifact(plaintext, aadContext);

    return {
      encryptedArtifact,
      credentialFingerprint,
    };
  }

  /**
   * Decrypts channel credentials in RAM.
   * If caller passes a different canonicalOrgId than what was bound at encryption time,
   * KnowledgeEnvelopeVault throws an AAD authentication mismatch error (fail-closed).
   */
  async decryptCredentials(
    canonicalOrgId: string,
    integrationId: string,
    channel: ChannelType,
    artifact: EncryptedKnowledgeArtifact
  ): Promise<ChannelCredentialsPayload> {
    if (!canonicalOrgId || !integrationId || !channel || !artifact) {
      throw new Error('[ChannelVaultAdapter] Missing required parameters for decryption.');
    }

    const aadContext: EncryptionContextAAD = {
      tenantId: canonicalOrgId,
      artifactId: `channel_cred_${channel}_${integrationId}`,
      version: artifact.version || 1,
      classification: 'SECRET',
    };

    const decryptedString = await this.vault.decryptArtifact(artifact, aadContext);
    return JSON.parse(decryptedString) as ChannelCredentialsPayload;
  }
}

// Global singleton instance
export const channelVaultAdapter = new ChannelVaultAdapter();
