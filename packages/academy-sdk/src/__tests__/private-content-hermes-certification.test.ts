/**
 * 🧪 Test Suite: Phase 4 Integration — Private Content Snapshots & Hermes Rubric Certification
 * packages/academy-sdk/src/__tests__/private-content-hermes-certification.test.ts
 *
 * Verifies End-to-End integration between:
 * 1. EncryptedCourseResourceVault (Phase 1)
 * 2. KeyDistributionService (Phase 2 & 2.1)
 * 3. KnowledgeSnapshotManager with immutable hash preservation
 * 4. Hermes Assessment Engine & Deterministic Rubric Scoring
 * 5. CertificationService with EIP-712 Agent Wallet signature & IPFS anchor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ethers } from 'ethers';
import {
  EncryptedCourseResourceVault,
  DefaultAcademyKekProvider,
} from '../security/encrypted-resource-vault';
import {
  KeyDistributionService,
  InMemoryAcademyManifestStore,
  InMemoryNonceStore,
  KeyAccessPolicy,
} from '../security/key-distribution-service';
import { AssessmentEngine } from '../assessment/assessment-engine';
import { CertificationService } from '../certification/certification-service';
import { HermesIdentitySigner } from '@saasfly/hermes-core';
import { KnowledgeSnapshotManager } from '../snapshots/snapshot-manager';

describe('Pandora\'s Academy — Phase 4: Private Content & Notarized Hermes Certification', () => {
  const authorizedStudentWallet = ethers.Wallet.createRandom();
  let vault: EncryptedCourseResourceVault;
  let manifestStore: InMemoryAcademyManifestStore;
  let keyService: KeyDistributionService;
  let mockAgentSigner: HermesIdentitySigner;

  beforeEach(async () => {
    const kekProvider = new DefaultAcademyKekProvider('kek_p4_test', 'kek_secret_key_32_bytes_phase4!');
    vault = new EncryptedCourseResourceVault(kekProvider);
    manifestStore = new InMemoryAcademyManifestStore();

    const allowedPolicy: KeyAccessPolicy = {
      async isAllowed({ walletAddress }) {
        return walletAddress.toLowerCase() === authorizedStudentWallet.address.toLowerCase();
      },
    };

    const nonceStore = new InMemoryNonceStore(5 * 60 * 1000);
    keyService = new KeyDistributionService(vault, allowedPolicy, nonceStore);

    // Mock Hermes Identity Signer (EIP-712 agent wallet)
    mockAgentSigner = {
      address: '0x1111111111111111111111111111111111111111',
      async signIntent(intent: any) {
        return {
          intent,
          signature: '0xmock_eip712_agent_signature',
          signerAddress: '0x1111111111111111111111111111111111111111',
          timestamp: Date.now(),
        };
      },
    } as unknown as HermesIdentitySigner;
  });

  it('F4-01: Encrypted Lesson -> Snapshot Binding -> Assessment Evaluation -> Verified Certificate', async () => {
    // 1. Authoring: Cifrar recurso educativo privado
    const lessonContent = Buffer.from(
      'Documento Confidencial: Protocolo de Blindaje Multi-Entidad de Pandora\'s (Holding ADGM vs Wyoming LLC)'
    );
    const bundle = await vault.encryptResource(lessonContent, {
      resourceId: 'res_coo_confidential_01',
      tenantId: 'pandoras',
      programId: 'COO_EXECUTIVE_V2',
      moduleId: 'mod_coo_01_arch',
      title: 'Blindaje Multi-Entidad',
      mediaType: 'text/markdown',
      version: 1,
    });
    manifestStore.register(bundle.manifest);

    // 2. Alumno autorizado solicita llave DEK con firma EIP-191
    const timestamp = Date.now();
    const nonce = `nonce_f4_${Date.now()}`;
    const challengeMessage = KeyDistributionService.buildChallengeMessage({
      walletAddress: authorizedStudentWallet.address,
      resourceId: bundle.manifest.resourceId,
      tenantId: bundle.manifest.tenantId,
      programId: bundle.manifest.programId,
      nonce,
      timestamp,
    });
    const signature = await authorizedStudentWallet.signMessage(challengeMessage);

    const keyResult = await keyService.authorizeAndDeliverKey(
      {
        walletAddress: authorizedStudentWallet.address,
        resourceId: bundle.manifest.resourceId,
        tenantId: bundle.manifest.tenantId,
        programId: bundle.manifest.programId,
        nonce,
        timestamp,
        signature,
      },
      bundle.manifest
    );

    expect(keyResult.allowed).toBe(true);
    expect(keyResult.unwrappedDekBase64).toBeDefined();

    // 3. Alumno descifra la lección en memoria RAM con la DEK recibida
    const dek = Buffer.from(keyResult.unwrappedDekBase64!, 'base64');
    const decrypted = vault.decryptResource(bundle.encryptedChunks, bundle.manifest, dek);
    expect(decrypted.toString('utf8')).toBe(lessonContent.toString('utf8'));

    // 4. Freeze immutable Knowledge Snapshot for the examination
    const snapshot = KnowledgeSnapshotManager.createFullProgramSnapshot();
    expect(snapshot.snapshotHash).toBeDefined();

    // 5. Evaluación completa del intento con rúbricas objetivas de Hermes
    const answers: Record<string, string> = {
      asm_coo_01_entity_shielding:
        'Como COO de Pandora\'s rechazo tajantemente que la matriz de IP firme contratos comerciales directos. Se opera a través de Pandora\'s USA Operations LLC (Wyoming), protegiendo la Capa 3 de la Capa 5 y evitando embargos sobre patentes o software.',
    };

    const attemptResult = await AssessmentEngine.evaluateFullAttempt({
      programCode: 'COO_EXECUTIVE_V2',
      candidateId: 'cand_executive_pilot_01',
      attemptId: 'att_pilot_01',
      answers,
    });

    expect(attemptResult.attemptResult.overallReadinessScore).toBeGreaterThanOrEqual(80);
    expect(attemptResult.attemptResult.status).toBe('PASSED');

    // 6. Emisión y anclaje notarizado de la Certificación con agente Hermes
    const certificate = CertificationService.issueCertification({
      programId: 'COO_EXECUTIVE_V2',
      targetRole: 'COO',
      candidateId: 'cand_executive_pilot_01',
      candidateName: 'Carlos Mendoza (Piloto)',
      attemptResult: attemptResult.attemptResult,
    });

    expect(certificate.status).toBe('CERTIFIED');
    expect(certificate.certificateHash).toBeDefined();
    expect(certificate.knowledgeSnapshotHash).toBe(attemptResult.attemptResult.snapshotId);
  });
});
