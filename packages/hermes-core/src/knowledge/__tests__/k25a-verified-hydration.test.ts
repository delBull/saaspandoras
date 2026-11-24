/**
 * 🏛️ K25-A — Hidratación verificada del vault soberano
 *
 * Estos tests fallan si la verificación desaparece o si se vuelve a comparar el
 * plaintext contra la columna equivocada (`content_hash` tiene dos convenciones
 * distintas entre los escritores de Pandora's y S'Narai).
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { TenantIpfsVaultService } from '../ipfs-vault';
import { KnowledgeEnvelopeVault } from '../envelope-vault';

process.env.HERMES_KMS_KEK = process.env.HERMES_KMS_KEK || 'test-kek-k25a-32-bytes-minimum-secret!!';

const CTX = {
  tenantId: 'pandoras',
  artifactId: 'security_whitepaper',
  version: 1,
  classification: 'PUBLIC' as const,
};

const PLAINTEXT = '# Whitepaper\n\nContenido institucional de prueba.';

async function makeEnvelope(overrides: Partial<typeof CTX> = {}) {
  const ctx = { ...CTX, ...overrides };
  const vault = new KnowledgeEnvelopeVault();
  const envelope = await vault.encryptArtifact(PLAINTEXT, ctx as any);
  return { envelope, ctx };
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

describe('K25-A · verifyAndDecryptEnvelope', () => {
  it('K25A-01: descifra y verifica un sobre íntegro', async () => {
    const { envelope, ctx } = await makeEnvelope();
    const service = new TenantIpfsVaultService();

    const result = await service.verifyAndDecryptEnvelope(envelope, ctx as any, sha256(envelope.ciphertext));

    expect(result.plaintext).toBe(PLAINTEXT);
    expect(result.contentHash).toBe(sha256(PLAINTEXT));
    expect(result.contentHash).toBe(envelope.contentHash);
  });

  it('K25A-02: rechaza si el ciphertext no coincide con el hash registrado', async () => {
    const { envelope, ctx } = await makeEnvelope();
    const service = new TenantIpfsVaultService();

    await expect(
      service.verifyAndDecryptEnvelope(envelope, ctx as any, sha256('otro-ciphertext')),
    ).rejects.toThrow(/KNOWLEDGE_CIPHERTEXT_HASH_MISMATCH/);
  });

  it('K25A-03: rechaza un sobre de otro artefacto (identidad del artefacto)', async () => {
    const { envelope } = await makeEnvelope();
    const service = new TenantIpfsVaultService();

    const foreignCtx = { ...CTX, artifactId: 'blindaje_corporativo', classification: 'SECRET' as const };

    await expect(
      service.verifyAndDecryptEnvelope(envelope, foreignCtx as any, null),
    ).rejects.toThrow(/KNOWLEDGE_ENVELOPE_MISMATCH/);
  });

  it('K25A-04: rechaza si el contentHash del sobre fue alterado', async () => {
    const { envelope, ctx } = await makeEnvelope();
    const service = new TenantIpfsVaultService();

    const tampered = { ...envelope, contentHash: sha256('otro-plaintext') };

    await expect(
      service.verifyAndDecryptEnvelope(tampered as any, ctx as any, null),
    ).rejects.toThrow(/KNOWLEDGE_CONTENT_HASH_MISMATCH|Integrity violation/);
  });

  it('K25A-05: el AAD impide descifrar con un tenant distinto', async () => {
    const { envelope } = await makeEnvelope();
    const service = new TenantIpfsVaultService();

    const otherTenant = { ...CTX, tenantId: 'snarai' };

    await expect(
      service.verifyAndDecryptEnvelope(envelope, otherTenant as any, null),
    ).rejects.toThrow(/KNOWLEDGE_ENVELOPE_MISMATCH/);
  });

  it('K25A-06: el hash del plaintext NO es el hash del sobre (el bug original)', async () => {
    const { envelope } = await makeEnvelope();

    // El código anterior comparaba sha256(plaintext) contra
    // hermes_knowledge_registry.content_hash, que en Pandora's guarda el hash del
    // sobre. Por eso todos los artefactos fallaban en silencio (fail-closed).
    const plaintextHash = sha256(PLAINTEXT);
    const envelopeHash = sha256(JSON.stringify(envelope));

    expect(envelope.contentHash).toBe(plaintextHash);
    expect(plaintextHash).not.toBe(envelopeHash);
    expect(sha256(envelope.ciphertext)).not.toBe(plaintextHash);
  });
});
