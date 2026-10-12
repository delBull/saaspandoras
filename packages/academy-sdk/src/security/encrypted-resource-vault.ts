/**
 * 🔐 Pandora's Academy — Encrypted Course Resource Vault (Phase 1)
 * packages/academy-sdk/src/security/encrypted-resource-vault.ts
 *
 * Implements Sovereign Envelope Encryption for Private Course Content:
 * 1. Generates ephemeral 256-bit DEK (Data Encryption Key) per lesson/resource.
 * 2. Encrypts streamable chunks with AES-256-GCM, unique IV per chunk, and authenticates sequence.
 * 3. Binds AAD (Additional Authenticated Data): `tenantId:programId:moduleId:version`.
 * 4. Wraps DEK with KEK provider (fail-closed in production if unconfigured).
 * 5. Validates cryptographic integrity on decryption (zero tolerance for tampered bits).
 */

import crypto from 'crypto';
import {
  EncryptedCourseResourceManifest,
  EncryptedResourceChunkMetadata,
} from '../types';

export interface ResourceEncryptionOptions {
  resourceId: string;
  tenantId: string;
  programId: string;
  moduleId: string;
  title: string;
  mediaType: 'video/mp4' | 'application/pdf' | 'text/markdown' | 'application/json';
  version?: number;
  chunkSize?: number; // Default 1MB (1024 * 1024 bytes)
  chunkGatewayBase?: string; // Fase 3: base de entrega (pipeline la usa al publicar)
}

export interface EncryptedPayloadBundle {
  manifest: EncryptedCourseResourceManifest;
  encryptedChunks: Buffer[];
}

export interface KekProvider {
  getKey(keyId?: string): Promise<{ keyId: string; kekBuffer: Buffer }>;
}

export class DefaultAcademyKekProvider implements KekProvider {
  private keyId: string;
  private kek: Buffer | null = null;
  private secretOrKey?: string | Buffer;

  constructor(keyId = 'kek_academy_primary_v1', secretOrKey?: string | Buffer) {
    this.keyId = keyId;
    this.secretOrKey = secretOrKey;
  }

  private resolveKey(): Buffer {
    if (this.kek) return this.kek;

    if (this.secretOrKey) {
      this.kek =
        typeof this.secretOrKey === 'string'
          ? crypto.createHash('sha256').update(this.secretOrKey, 'utf8').digest()
          : this.secretOrKey;
      return this.kek;
    }

    const envKey = process.env.ACADEMY_KMS_KEK || process.env.HERMES_KMS_KEK || process.env.ENCRYPTION_KEY;
    if (!envKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[AcademyKekProvider] ACADEMY_KMS_KEK or ENCRYPTION_KEY is mandatory in production. Failing closed.');
      }
      this.kek = crypto.createHash('sha256').update('pandoras_academy_dev_kek_salt_32bytes!', 'utf8').digest();
    } else {
      this.kek = crypto.createHash('sha256').update(envKey, 'utf8').digest();
    }

    return this.kek;
  }

  async getKey(keyId?: string): Promise<{ keyId: string; kekBuffer: Buffer }> {
    return { keyId: this.keyId, kekBuffer: this.resolveKey() };
  }
}

export class EncryptedCourseResourceVault {
  private kekProvider: KekProvider;

  constructor(kekProvider?: KekProvider) {
    this.kekProvider = kekProvider || new DefaultAcademyKekProvider();
  }

  /**
   * Helper to format AAD for bound cryptographic authentication
   */
  public static buildAadString(aad: {
    tenantId: string;
    programId: string;
    moduleId: string;
    version: number;
    chunkIndex?: number;
  }): string {
    const base = `${aad.tenantId}:${aad.programId}:${aad.moduleId}:${aad.version}`;
    return aad.chunkIndex !== undefined ? `${base}:chunk_${aad.chunkIndex}` : base;
  }

  /**
   * Encrypts plaintext buffer into authenticated chunks and an envelope manifest
   */
  async encryptResource(
    payload: Buffer,
    options: ResourceEncryptionOptions,
    mockIpfsCidPrefix = 'bafkrei_cipher_'
  ): Promise<EncryptedPayloadBundle> {
    const version = options.version || 1;
    const chunkSize = options.chunkSize || 1024 * 1024; // 1MB chunks

    // 1. Compute overall plaintext content hash
    const contentHash = crypto.createHash('sha256').update(payload).digest('hex');

    // 2. Generate ephemeral 256-bit DEK
    const dek = crypto.randomBytes(32);

    // 3. Wrap DEK with KEK (Envelope Encryption)
    const { keyId: kekKeyId, kekBuffer } = await this.kekProvider.getKey();
    const dekIv = crypto.randomBytes(12);
    const dekCipher = crypto.createCipheriv('aes-256-gcm', kekBuffer, dekIv);
    dekCipher.setAAD(Buffer.from(`DEK_WRAP:${options.tenantId}:${options.resourceId}:${version}`, 'utf8'));

    const encryptedDek = Buffer.concat([dekCipher.update(dek), dekCipher.final()]);
    const dekAuthTag = dekCipher.getAuthTag();

    // 4. Split payload into chunks and encrypt each with DEK & unique IV
    const totalChunks = Math.ceil(payload.length / chunkSize) || 1;
    const encryptedChunks: Buffer[] = [];
    const chunksMetadata: EncryptedResourceChunkMetadata[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, payload.length);
      const chunkPlaintext = payload.subarray(start, end);

      const chunkIv = crypto.randomBytes(12);
      const chunkCipher = crypto.createCipheriv('aes-256-gcm', dek, chunkIv);

      const aadStr = EncryptedCourseResourceVault.buildAadString({
        tenantId: options.tenantId,
        programId: options.programId,
        moduleId: options.moduleId,
        version,
        chunkIndex: i,
      });
      chunkCipher.setAAD(Buffer.from(aadStr, 'utf8'));

      const cipherChunk = Buffer.concat([chunkCipher.update(chunkPlaintext), chunkCipher.final()]);
      const chunkAuthTag = chunkCipher.getAuthTag();

      encryptedChunks.push(cipherChunk);
      chunksMetadata.push({
        chunkIndex: i,
        totalChunks,
        byteLength: cipherChunk.length,
        iv: chunkIv.toString('base64'),
        authTag: chunkAuthTag.toString('base64'),
        chunkHash: crypto.createHash('sha256').update(cipherChunk).digest('hex'),
        ...(options.chunkGatewayBase
          ? { gatewayUrl: `${options.chunkGatewayBase.replace(/\/$/, '')}/${options.resourceId}/${i}` }
          : {}),
      });
    }

    // Zeroize ephemeral DEK from heap buffer
    dek.fill(0);

    // 5. Generate deterministic mock CID for artifact simulation (or live IPFS)
    const syntheticCid = `${mockIpfsCidPrefix}${contentHash.substring(0, 32)}`;

    const manifest: EncryptedCourseResourceManifest = {
      resourceId: options.resourceId,
      tenantId: options.tenantId,
      programId: options.programId,
      moduleId: options.moduleId,
      title: options.title,
      mediaType: options.mediaType,
      totalBytes: payload.length,
      contentHash,
      encryptedDek: encryptedDek.toString('base64'),
      dekIv: dekIv.toString('base64'),
      dekAuthTag: dekAuthTag.toString('base64'),
      kekKeyId,
      ipfsCid: syntheticCid,
      chunks: chunksMetadata,
      ...(options.chunkGatewayBase ? { gatewayBaseUrl: options.chunkGatewayBase.replace(/\/$/, '') } : {}),
      aadContext: {
        tenantId: options.tenantId,
        programId: options.programId,
        moduleId: options.moduleId,
        version,
      },
      createdAt: new Date().toISOString(),
    };

    return {
      manifest,
      encryptedChunks,
    };
  }

  /**
   * Unwraps the DEK using the KEK provider (Server-side capability after policy approval)
   */
  async unwrapDek(manifest: EncryptedCourseResourceManifest): Promise<Buffer> {
    const { kekBuffer } = await this.kekProvider.getKey(manifest.kekKeyId);
    const dekIv = Buffer.from(manifest.dekIv, 'base64');
    const dekAuthTag = Buffer.from(manifest.dekAuthTag, 'base64');
    const encryptedDek = Buffer.from(manifest.encryptedDek, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', kekBuffer, dekIv);
    decipher.setAuthTag(dekAuthTag);
    decipher.setAAD(
      Buffer.from(`DEK_WRAP:${manifest.tenantId}:${manifest.resourceId}:${manifest.aadContext.version}`, 'utf8')
    );

    try {
      const dek = Buffer.concat([decipher.update(encryptedDek), decipher.final()]);
      return dek;
    } catch {
      throw new Error('[EncryptedCourseResourceVault] Failed to unwrap DEK: Authentication tag verification failed or KEK mismatch.');
    }
  }

  /**
   * Decrypts chunks using the raw DEK (Executed by authorized client or test suite)
   */
  decryptResource(
    encryptedChunks: Buffer[],
    manifest: EncryptedCourseResourceManifest,
    dek: Buffer
  ): Buffer {
    if (encryptedChunks.length !== manifest.chunks.length) {
      throw new Error(`[EncryptedCourseResourceVault] Chunk count mismatch: expected ${manifest.chunks.length}, got ${encryptedChunks.length}`);
    }

    const decryptedBuffers: Buffer[] = [];

    for (let i = 0; i < encryptedChunks.length; i++) {
      const chunkMeta = manifest.chunks[i];
      const cipherChunk = encryptedChunks[i];

      if (!chunkMeta || !cipherChunk) {
        throw new Error(`[EncryptedCourseResourceVault] Missing chunk metadata or payload for chunk index ${i}.`);
      }

      const chunkIv = Buffer.from(chunkMeta.iv, 'base64');
      const chunkAuthTag = Buffer.from(chunkMeta.authTag, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, chunkIv);
      decipher.setAuthTag(chunkAuthTag);

      const aadStr = EncryptedCourseResourceVault.buildAadString({
        tenantId: manifest.aadContext.tenantId,
        programId: manifest.aadContext.programId,
        moduleId: manifest.aadContext.moduleId,
        version: manifest.aadContext.version,
        chunkIndex: i,
      });
      decipher.setAAD(Buffer.from(aadStr, 'utf8'));

      try {
        const plainChunk = Buffer.concat([decipher.update(cipherChunk), decipher.final()]);
        decryptedBuffers.push(plainChunk);
      } catch {
        throw new Error(`[EncryptedCourseResourceVault] Authentication failure at chunk ${i}. Data altered or invalid key.`);
      }
    }

    const fullPlaintext = Buffer.concat(decryptedBuffers);

    // Verify content hash matches manifest
    const calculatedHash = crypto.createHash('sha256').update(fullPlaintext).digest('hex');
    if (calculatedHash !== manifest.contentHash) {
      throw new Error('[EncryptedCourseResourceVault] Final plaintext content hash does not match manifest contentHash.');
    }

    return fullPlaintext;
  }
}
