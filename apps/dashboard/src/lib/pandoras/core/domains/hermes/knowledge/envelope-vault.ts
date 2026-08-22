/**
 * 🔐 Pandora's Hermes OS — Knowledge Envelope Vault (K15-KNOW-01 / K15-AAD-02)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/envelope-vault.ts
 *
 * Implements Institutional Envelope Encryption for Sensitive Knowledge:
 * 1. Generates ephemeral 256-bit DEK (Data Encryption Key) per artifact.
 * 2. Encrypts payload with AES-256-GCM and unique 12-byte IV.
 * 3. Binds AAD (Additional Authenticated Data): `tenantId:artifactId:version:classification`.
 * 4. Wraps DEK with KMS / HSM Key Encryption Key (KEK).
 * 5. Decrypts DEK exclusively in ephemeral RAM during runtime turn and zeroes buffers.
 * 6. Supports KEK rotation by re-wrapping DEKs without payload re-encryption.
 */

import crypto from 'crypto';
import type { KnowledgeClassificationTier } from '../runtime/contracts';
import { EphemeralMemoryScrubber } from '../runtime/sandbox/memory-scrubber';

export interface EncryptedKnowledgeArtifact {
  artifactId: string;
  tenantId: string;
  version: number;
  classification: KnowledgeClassificationTier;
  contentHash: string;
  ciphertext: string;       // base64
  iv: string;               // base64 (12 bytes)
  authTag: string;          // base64 (16 bytes)
  encryptedDek: string;     // base64 (wrapped DEK with KEK)
  dekIv: string;            // base64 (12 bytes for DEK wrapping)
  dekAuthTag: string;       // base64 (16 bytes for DEK wrapping)
  kekKeyId: string;         // identifier of the KEK used
  createdAt: string;
}

export interface EncryptionContextAAD {
  tenantId: string;
  artifactId: string;
  version: number;
  classification: KnowledgeClassificationTier;
}

export interface KekProvider {
  getKey(keyId?: string): Promise<{ keyId: string; kekBuffer: Buffer }>;
}

/**
 * Default Ephemeral KMS / Secret Manager KEK Provider
 * In production, wraps keys using AWS KMS / Google Cloud KMS / Azure Key Vault HSM.
 */
export class DefaultKmsKekProvider implements KekProvider {
  private keyId: string;
  private kek: Buffer;

  constructor(keyId = 'kek_hermes_primary_v1', secretOrKey?: string | Buffer) {
    this.keyId = keyId;
    if (secretOrKey) {
      this.kek = typeof secretOrKey === 'string'
        ? crypto.createHash('sha256').update(secretOrKey, 'utf8').digest()
        : secretOrKey;
    } else {
      const envKey = process.env.HERMES_KMS_KEK || process.env.ENCRYPTION_KEY;
      if (!envKey) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('[EnvelopeVault] HERMES_KMS_KEK or ENCRYPTION_KEY is required in production. Failing closed.');
        }
        // Ephemeral in-memory key for local development/test (deterministic salt)
        this.kek = crypto.createHash('sha256').update('pandoras_hermes_dev_ephemeral_kek_salt_32bytes!', 'utf8').digest();
      } else {
        this.kek = crypto.createHash('sha256').update(envKey, 'utf8').digest();
      }
    }
  }

  async getKey(keyId?: string): Promise<{ keyId: string; kekBuffer: Buffer }> {
    return { keyId: this.keyId, kekBuffer: this.kek };
  }
}

export class KnowledgeEnvelopeVault {
  private kekProvider: KekProvider;

  constructor(kekProvider?: KekProvider) {
    this.kekProvider = kekProvider || new DefaultKmsKekProvider();
  }

  /**
   * Serializes AAD into deterministic string buffer.
   * Cryptographically binds tenant, artifact, version, and classification tier.
   */
  private static serializeAAD(ctx: EncryptionContextAAD): Buffer {
    return Buffer.from(`${ctx.tenantId}:${ctx.artifactId}:${ctx.version}:${ctx.classification}`, 'utf8');
  }

  /**
   * Encrypts plaintext knowledge into an EncryptedKnowledgeArtifact with DEK envelope.
   */
  async encryptArtifact(
    plaintext: string,
    ctx: EncryptionContextAAD
  ): Promise<EncryptedKnowledgeArtifact> {
    if (!plaintext) {
      throw new Error('[EnvelopeVault] Cannot encrypt empty plaintext.');
    }

    const { keyId: kekKeyId, kekBuffer } = await this.kekProvider.getKey();

    // 1. Generate ephemeral 256-bit DEK
    const dek = crypto.randomBytes(32);
    const contentHash = crypto.createHash('sha256').update(plaintext, 'utf8').digest('hex');

    try {
      // 2. Encrypt plaintext payload with AES-256-GCM & AAD
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
      const aad = KnowledgeEnvelopeVault.serializeAAD(ctx);
      cipher.setAAD(aad);

      const ciphertextBuffer = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();

      // 3. Wrap DEK with KEK (AES-256-GCM)
      const dekIv = crypto.randomBytes(12);
      const dekCipher = crypto.createCipheriv('aes-256-gcm', kekBuffer, dekIv);
      const dekAAD = Buffer.from(`DEK_WRAP:${ctx.tenantId}:${ctx.artifactId}:${kekKeyId}`, 'utf8');
      dekCipher.setAAD(dekAAD);

      const encryptedDekBuffer = Buffer.concat([
        dekCipher.update(dek),
        dekCipher.final()
      ]);
      const dekAuthTag = dekCipher.getAuthTag();

      return {
        artifactId: ctx.artifactId,
        tenantId: ctx.tenantId,
        version: ctx.version,
        classification: ctx.classification,
        contentHash,
        ciphertext: ciphertextBuffer.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        encryptedDek: encryptedDekBuffer.toString('base64'),
        dekIv: dekIv.toString('base64'),
        dekAuthTag: dekAuthTag.toString('base64'),
        kekKeyId,
        createdAt: new Date().toISOString()
      };
    } finally {
      // Multi-pass cryptographic zeroization of ephemeral DEK
      EphemeralMemoryScrubber.wipeBuffer(dek);
    }
  }

  /**
   * Decrypts an EncryptedKnowledgeArtifact in RAM.
   * Fails closed if AAD, auth tags, or keys do not match.
   */
  async decryptArtifact(
    artifact: EncryptedKnowledgeArtifact,
    expectedContext: EncryptionContextAAD
  ): Promise<string> {
    const { kekBuffer } = await this.kekProvider.getKey(artifact.kekKeyId);

    // 1. Unwrap DEK using KEK
    const encryptedDek = Buffer.from(artifact.encryptedDek, 'base64');
    const dekIv = Buffer.from(artifact.dekIv, 'base64');
    const dekAuthTag = Buffer.from(artifact.dekAuthTag, 'base64');
    const dekAAD = Buffer.from(`DEK_WRAP:${artifact.tenantId}:${artifact.artifactId}:${artifact.kekKeyId}`, 'utf8');

    const dekDecipher = crypto.createDecipheriv('aes-256-gcm', kekBuffer, dekIv);
    dekDecipher.setAAD(dekAAD);
    dekDecipher.setAuthTag(dekAuthTag);

    let dek: Buffer;
    try {
      dek = Buffer.concat([
        dekDecipher.update(encryptedDek),
        dekDecipher.final()
      ]);
    } catch {
      throw new Error('[EnvelopeVault] DEK unwrap failed. KEK mismatch or corrupted encrypted DEK.');
    }

    try {
      // 2. Decrypt Payload using unwrapped DEK and expected AAD
      const ciphertext = Buffer.from(artifact.ciphertext, 'base64');
      const iv = Buffer.from(artifact.iv, 'base64');
      const authTag = Buffer.from(artifact.authTag, 'base64');
      const aad = KnowledgeEnvelopeVault.serializeAAD(expectedContext);

      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
      decipher.setAAD(aad);
      decipher.setAuthTag(authTag);

      const plaintextBuffer = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);

      const plaintext = plaintextBuffer.toString('utf8');

      // 3. Verify SHA-256 integrity hash
      const computedHash = crypto.createHash('sha256').update(plaintext, 'utf8').digest('hex');
      if (computedHash !== artifact.contentHash) {
        throw new Error('[EnvelopeVault] Integrity violation: plaintext hash does not match artifact contentHash.');
      }

      return plaintext;
    } catch (err: any) {
      throw new Error(`[EnvelopeVault] Payload decryption failed (AAD mismatch or tampering): ${err.message}`);
    } finally {
      // Cryptographic multi-pass zeroization of unwrapped DEK
      if (dek) {
        EphemeralMemoryScrubber.wipeBuffer(dek);
      }
    }
  }

  /**
   * Rotates the KEK wrapping of an artifact's DEK without decrypting or re-encrypting the payload.
   */
  async reWrapDEK(
    artifact: EncryptedKnowledgeArtifact,
    newKekProvider: KekProvider
  ): Promise<EncryptedKnowledgeArtifact> {
    const { kekBuffer: oldKek } = await this.kekProvider.getKey(artifact.kekKeyId);
    const { keyId: newKekKeyId, kekBuffer: newKek } = await newKekProvider.getKey();

    // 1. Unwrap DEK with old KEK
    const encryptedDek = Buffer.from(artifact.encryptedDek, 'base64');
    const dekIv = Buffer.from(artifact.dekIv, 'base64');
    const dekAuthTag = Buffer.from(artifact.dekAuthTag, 'base64');
    const oldDekAAD = Buffer.from(`DEK_WRAP:${artifact.tenantId}:${artifact.artifactId}:${artifact.kekKeyId}`, 'utf8');

    const dekDecipher = crypto.createDecipheriv('aes-256-gcm', oldKek, dekIv);
    dekDecipher.setAAD(oldDekAAD);
    dekDecipher.setAuthTag(dekAuthTag);

    const dek = Buffer.concat([
      dekDecipher.update(encryptedDek),
      dekDecipher.final()
    ]);

    try {
      // 2. Re-wrap DEK with new KEK
      const newDekIv = crypto.randomBytes(12);
      const newDekCipher = crypto.createCipheriv('aes-256-gcm', newKek, newDekIv);
      const newDekAAD = Buffer.from(`DEK_WRAP:${artifact.tenantId}:${artifact.artifactId}:${newKekKeyId}`, 'utf8');
      newDekCipher.setAAD(newDekAAD);

      const newEncryptedDekBuffer = Buffer.concat([
        newDekCipher.update(dek),
        newDekCipher.final()
      ]);
      const newDekAuthTag = newDekCipher.getAuthTag();

      return {
        ...artifact,
        encryptedDek: newEncryptedDekBuffer.toString('base64'),
        dekIv: newDekIv.toString('base64'),
        dekAuthTag: newDekAuthTag.toString('base64'),
        kekKeyId: newKekKeyId
      };
    } finally {
      dek.fill(0);
    }
  }
}
