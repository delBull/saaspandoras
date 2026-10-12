/**
 * 🧪 Test Suite: Encrypted Course Resource Vault (Phase 1 Gate)
 * packages/academy-sdk/src/__tests__/encrypted-resource-vault.test.ts
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  EncryptedCourseResourceVault,
  DefaultAcademyKekProvider,
} from '../security/encrypted-resource-vault';

describe('Pandora\'s Academy — Private Content Protocol (Phase 1)', () => {
  const kekProvider = new DefaultAcademyKekProvider('kek_test_v1', 'test_kek_secret_key_32_bytes_len!');
  const vault = new EncryptedCourseResourceVault(kekProvider);

  it('SEC-01: Encrypts video/PDF payload into authenticated chunks and successfully decrypts with unwrap DEK', async () => {
    const rawData = Buffer.from('🎓 Pandora\'s Executive Private Lesson: Sovereign Deal Structuring & Asset Backed Tokens');
    const options = {
      resourceId: 'res_lesson_01',
      tenantId: 'pandoras',
      programId: 'coo_program_v1',
      moduleId: 'mod_treasury_01',
      title: 'Private Treasury Mechanics',
      mediaType: 'text/markdown' as const,
      version: 1,
      chunkSize: 32, // Small chunk size to force multi-chunk processing
    };

    const bundle = await vault.encryptResource(rawData, options);

    expect(bundle.manifest.resourceId).toBe('res_lesson_01');
    expect(bundle.manifest.chunks.length).toBeGreaterThan(1);
    expect(bundle.manifest.encryptedDek).toBeDefined();
    expect(bundle.manifest.ipfsCid).toContain('bafkrei_cipher_');

    // Server-side unwrapping of the DEK
    const dek = await vault.unwrapDek(bundle.manifest);
    expect(dek.length).toBe(32);

    // Client/consumer decryption
    const decrypted = vault.decryptResource(bundle.encryptedChunks, bundle.manifest, dek);
    expect(decrypted.toString('utf8')).toBe(rawData.toString('utf8'));
  });

  it('SEC-02: Cryptographic Tamper Detection — Altering a single bit in ciphertext fails deterministically', async () => {
    const rawData = Buffer.from('Confidential financial statements for Private Deal Room #42');
    const bundle = await vault.encryptResource(rawData, {
      resourceId: 'res_deal_room_pdf',
      tenantId: 'pandoras',
      programId: 'deal_room_v1',
      moduleId: 'mod_due_diligence',
      title: 'Due Diligence Dossier',
      mediaType: 'application/pdf',
      chunkSize: 64,
    });

    const dek = await vault.unwrapDek(bundle.manifest);

    // Tamper with byte 0 of chunk 0
    const tamperedChunks = [...bundle.encryptedChunks];
    const firstChunk = tamperedChunks[0];
    expect(firstChunk).toBeDefined();
    const corruptedChunk = Buffer.from(firstChunk!);
    corruptedChunk[0] = (corruptedChunk[0] ?? 0) ^ 0xff; // Flip bits
    tamperedChunks[0] = corruptedChunk;

    expect(() => {
      vault.decryptResource(tamperedChunks, bundle.manifest, dek);
    }).toThrow(/Authentication failure at chunk 0/);
  });

  it('SEC-03: AAD Binding — Attempting to decrypt with forged AAD context (Cross-Tenant attack) fails', async () => {
    const rawData = Buffer.from('Tenant A proprietary algorithm and prompts');
    const bundle = await vault.encryptResource(rawData, {
      resourceId: 'res_algo_tenanta',
      tenantId: 'tenant_a',
      programId: 'prog_ai_01',
      moduleId: 'mod_core',
      title: 'Core AI Models',
      mediaType: 'application/json',
    });

    const dek = await vault.unwrapDek(bundle.manifest);

    // Attacker modifies manifest to claim it belongs to tenant_b
    const forgedManifest = {
      ...bundle.manifest,
      aadContext: {
        ...bundle.manifest.aadContext,
        tenantId: 'tenant_b',
      },
    };

    expect(() => {
      vault.decryptResource(bundle.encryptedChunks, forgedManifest, dek);
    }).toThrow(/Authentication failure at chunk 0/);
  });

  it('SEC-04: DEK Wrap Authentication — Attempting to unwrap DEK with wrong KEK fails safely', async () => {
    const rawData = Buffer.from('Super sensitive curriculum assessment answer key');
    const bundle = await vault.encryptResource(rawData, {
      resourceId: 'res_exam_answers',
      tenantId: 'pandoras',
      programId: 'exam_v1',
      moduleId: 'mod_final',
      title: 'Final Exam Answers',
      mediaType: 'text/markdown',
    });

    // Vault initialized with different KEK
    const foreignKekProvider = new DefaultAcademyKekProvider('kek_foreign', 'completely_different_key_32_bytes!');
    const foreignVault = new EncryptedCourseResourceVault(foreignKekProvider);

    await expect(foreignVault.unwrapDek(bundle.manifest)).rejects.toThrow(/Failed to unwrap DEK/);
  });
});
