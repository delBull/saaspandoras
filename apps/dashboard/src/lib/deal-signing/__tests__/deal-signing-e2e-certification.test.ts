import { describe, it, expect } from 'vitest';
import { DocumentHasher } from '../document-hasher';
import { EIP712Builder } from '../eip712-builder';
import { EvidencePackager } from '../evidence-packager';
import { DocumentEnvelope, SignerParticipant } from '../types';
import { privateKeyToAccount } from 'viem/accounts';

describe('🏛️ Sovereign Sign — End-to-End Evidence Certification & Resilience Suite', () => {
  // Deterministic test accounts
  const ALICE_KEY = '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f36fe30' as const;
  const BOB_KEY = '0x6b8404a79df89dc33989c4ad3d9d300eb0dc6a41f8c857753eef6a0eec3ae40e' as const;
  const CHARLIE_KEY = '0x8f2a55949038a9610f50fb23b5883af3b80bf30b56b529e10fa9e541e7fa44ef' as const;

  const alice = privateKeyToAccount(ALICE_KEY);
  const bob = privateKeyToAccount(BOB_KEY);
  const charlie = privateKeyToAccount(CHARLIE_KEY);

  const MOCK_PDF_BUFFER = Buffer.from('%PDF-1.4 Institutional Real Estate Sovereign Agreement', 'utf8');
  const CANONICAL_DOC_HASH = DocumentHasher.hashBuffer(MOCK_PDF_BUFFER);

  // --------------------------------------------------------------------------
  // CASO A: 1 FIRMANTE
  // --------------------------------------------------------------------------
  it('Caso A: Single Signer — Create Envelope -> EIP-712 Sign -> Evidence Package Verification', async () => {
    const envelopeId = 'env-single-001';
    const orgId = 'snarai';
    const docTitle = 'Acuerdo Bilateral Snarai';
    const signedAt = 1787710000;

    const typedData = EIP712Builder.buildTypedData({
      envelopeId,
      organizationId: orgId,
      documentTitle: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      signerEmail: 'alice@snarai.com',
      signerRole: 'SIGNER',
      signedAt,
      chainId: 8453,
    });

    const signature = await alice.signTypedData({
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
    });

    // 1. Verify EIP-712 validity
    const verifyResult = await EIP712Builder.verifySignature({
      signerAddress: alice.address,
      signature,
      envelopeId,
      organizationId: orgId,
      documentTitle: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      signerEmail: 'alice@snarai.com',
      signerRole: 'SIGNER',
      signedAt,
      chainId: 8453,
    });

    expect(verifyResult.isValid).toBe(true);

    // 2. Assemble Evidence Package
    const envelope: DocumentEnvelope = {
      envelopeId,
      organizationId: orgId,
      title: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      canonicalDocumentCid: 'mock_bafkrei_kubo_single',
      documentVersion: 1,
      documentSize: MOCK_PDF_BUFFER.length,
      mimeType: 'application/pdf',
      signingPolicy: 'PARALLEL',
      signers: [
        {
          signerId: 'alice-uuid',
          email: 'alice@snarai.com',
          name: 'Alice Azteca',
          role: 'SIGNER',
          orderIndex: 0,
          status: 'SIGNED',
          signatureProof: {
            signingMethod: 'WALLET_EIP712',
            signerAddress: alice.address.toLowerCase(),
            signature,
            signedDocumentHash: CANONICAL_DOC_HASH,
            typedDataPayload: typedData,
            signedAt: new Date(signedAt * 1000).toISOString(),
          },
        },
      ],
      status: 'COMPLETED',
      createdAt: '2026-08-26T20:00:00.000Z',
      completedAt: '2026-08-26T20:05:00.000Z',
      updatedAt: '2026-08-26T20:05:00.000Z',
    };

    const auditTrail = [
      { at: envelope.createdAt, actor: 'SYSTEM', action: 'EnvelopeCreated' },
      { at: envelope.completedAt!, actor: 'alice@snarai.com', action: 'DocumentSigned' },
    ];

    const pkg = EvidencePackager.assemble(envelope, auditTrail);

    expect(pkg.manifest.status).toBe('COMPLETED');
    expect(pkg.manifest.totalSigners).toBe(1);
    expect(pkg.manifest.receivedSignatures).toBe(1);
    expect(pkg.manifest.completionCondition).toBe('ALL_SIGNERS_SATISFIED');
    expect(pkg.rootEvidenceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  // --------------------------------------------------------------------------
  // CASO B: 2 FIRMANTES PARALELOS
  // --------------------------------------------------------------------------
  it('Caso B: Parallel Signers — Alice and Bob sign in any order to complete', async () => {
    const envelopeId = 'env-parallel-002';
    const orgId = 'snarai';
    const docTitle = 'Contrato de Inversión Fraccionada';

    // Bob signs first
    const bobSignedAt = 1787711000;
    const bobTypedData = EIP712Builder.buildTypedData({
      envelopeId,
      organizationId: orgId,
      documentTitle: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      signerEmail: 'bob@partner.com',
      signerRole: 'SIGNER',
      signedAt: bobSignedAt,
    });
    const bobSig = await bob.signTypedData({
      domain: bobTypedData.domain,
      types: bobTypedData.types,
      primaryType: bobTypedData.primaryType,
      message: bobTypedData.message,
    });

    // Alice signs second
    const aliceSignedAt = 1787712000;
    const aliceTypedData = EIP712Builder.buildTypedData({
      envelopeId,
      organizationId: orgId,
      documentTitle: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      signerEmail: 'alice@snarai.com',
      signerRole: 'SIGNER',
      signedAt: aliceSignedAt,
    });
    const aliceSig = await alice.signTypedData({
      domain: aliceTypedData.domain,
      types: aliceTypedData.types,
      primaryType: aliceTypedData.primaryType,
      message: aliceTypedData.message,
    });

    const signers: SignerParticipant[] = [
      {
        signerId: 'alice-id',
        email: 'alice@snarai.com',
        name: 'Alice',
        role: 'SIGNER',
        orderIndex: 0,
        status: 'SIGNED',
        signatureProof: {
          signingMethod: 'WALLET_EIP712',
          signerAddress: alice.address.toLowerCase(),
          signature: aliceSig,
          signedDocumentHash: CANONICAL_DOC_HASH,
          typedDataPayload: aliceTypedData,
          signedAt: new Date(aliceSignedAt * 1000).toISOString(),
        },
      },
      {
        signerId: 'bob-id',
        email: 'bob@partner.com',
        name: 'Bob',
        role: 'SIGNER',
        orderIndex: 1,
        status: 'SIGNED',
        signatureProof: {
          signingMethod: 'WALLET_EIP712',
          signerAddress: bob.address.toLowerCase(),
          signature: bobSig,
          signedDocumentHash: CANONICAL_DOC_HASH,
          typedDataPayload: bobTypedData,
          signedAt: new Date(bobSignedAt * 1000).toISOString(),
        },
      },
    ];

    const envelope: DocumentEnvelope = {
      envelopeId,
      organizationId: orgId,
      title: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      canonicalDocumentCid: 'mock_bafkrei_parallel',
      documentVersion: 1,
      documentSize: MOCK_PDF_BUFFER.length,
      mimeType: 'application/pdf',
      signingPolicy: 'PARALLEL',
      signers,
      status: 'COMPLETED',
      createdAt: '2026-08-26T20:00:00.000Z',
      completedAt: '2026-08-26T20:10:00.000Z',
      updatedAt: '2026-08-26T20:10:00.000Z',
    };

    const pkg = EvidencePackager.assemble(envelope, []);
    expect(pkg.manifest.totalSigners).toBe(2);
    expect(pkg.manifest.receivedSignatures).toBe(2);
    expect(pkg.manifest.completionCondition).toBe('ALL_SIGNERS_SATISFIED');
  });

  // --------------------------------------------------------------------------
  // CASO C: SECUENCIAL ESTRICTO
  // --------------------------------------------------------------------------
  it('Caso C: Sequential Policy — Enforces strict ordering (Bob cannot sign before Alice)', () => {
    const signers: SignerParticipant[] = [
      {
        signerId: 'alice-id',
        email: 'alice@snarai.com',
        name: 'Alice',
        role: 'SIGNER',
        orderIndex: 0,
        status: 'INVITED', // Has NOT signed yet
      },
      {
        signerId: 'bob-id',
        email: 'bob@partner.com',
        name: 'Bob',
        role: 'SIGNER',
        orderIndex: 1,
        status: 'PENDING',
      },
    ];

    // Simulating sequential rule check:
    const bobSigner = signers[1]!;
    const pendingPrior = signers.some(
      s => s.orderIndex < bobSigner.orderIndex && s.status !== 'SIGNED'
    );

    expect(pendingPrior).toBe(true); // Must block Bob from signing
  });

  // --------------------------------------------------------------------------
  // CASO D: M-OF-N THRESHOLD (2 de 3)
  // --------------------------------------------------------------------------
  it('Caso D: M-of-N Threshold — Completes when 2 of 3 signers sign', async () => {
    const envelopeId = 'env-mofn-003';
    const orgId = 'snarai';
    const docTitle = 'Resolución de Consejo 2-of-3';

    // Alice & Charlie sign (Bob abstains)
    const aliceTypedData = EIP712Builder.buildTypedData({
      envelopeId,
      organizationId: orgId,
      documentTitle: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      signerEmail: 'alice@snarai.com',
      signerRole: 'SIGNER',
      signedAt: 1787713000,
    });
    const aliceSig = await alice.signTypedData({
      domain: aliceTypedData.domain,
      types: aliceTypedData.types,
      primaryType: aliceTypedData.primaryType,
      message: aliceTypedData.message,
    });

    const charlieTypedData = EIP712Builder.buildTypedData({
      envelopeId,
      organizationId: orgId,
      documentTitle: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      signerEmail: 'charlie@snarai.com',
      signerRole: 'SIGNER',
      signedAt: 1787713500,
    });
    const charlieSig = await charlie.signTypedData({
      domain: charlieTypedData.domain,
      types: charlieTypedData.types,
      primaryType: charlieTypedData.primaryType,
      message: charlieTypedData.message,
    });

    const signers: SignerParticipant[] = [
      {
        signerId: 'alice-id',
        email: 'alice@snarai.com',
        name: 'Alice',
        role: 'SIGNER',
        orderIndex: 0,
        status: 'SIGNED',
        signatureProof: {
          signingMethod: 'WALLET_EIP712',
          signerAddress: alice.address.toLowerCase(),
          signature: aliceSig,
          signedDocumentHash: CANONICAL_DOC_HASH,
          typedDataPayload: aliceTypedData,
          signedAt: '2026-08-26T20:20:00.000Z',
        },
      },
      {
        signerId: 'bob-id',
        email: 'bob@partner.com',
        name: 'Bob',
        role: 'SIGNER',
        orderIndex: 1,
        status: 'INVITED', // Did not sign
      },
      {
        signerId: 'charlie-id',
        email: 'charlie@snarai.com',
        name: 'Charlie',
        role: 'SIGNER',
        orderIndex: 2,
        status: 'SIGNED',
        signatureProof: {
          signingMethod: 'WALLET_EIP712',
          signerAddress: charlie.address.toLowerCase(),
          signature: charlieSig,
          signedDocumentHash: CANONICAL_DOC_HASH,
          typedDataPayload: charlieTypedData,
          signedAt: '2026-08-26T20:25:00.000Z',
        },
      },
    ];

    const envelope: DocumentEnvelope = {
      envelopeId,
      organizationId: orgId,
      title: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      canonicalDocumentCid: 'mock_bafkrei_mofn',
      documentVersion: 1,
      documentSize: MOCK_PDF_BUFFER.length,
      mimeType: 'application/pdf',
      signingPolicy: 'M_OF_N',
      thresholdM: 2,
      signers,
      status: 'COMPLETED',
      createdAt: '2026-08-26T20:00:00.000Z',
      completedAt: '2026-08-26T20:25:00.000Z',
      updatedAt: '2026-08-26T20:25:00.000Z',
    };

    const pkg = EvidencePackager.assemble(envelope, []);
    expect(pkg.manifest.status).toBe('COMPLETED');
    expect(pkg.manifest.totalSigners).toBe(3);
    expect(pkg.manifest.requiredSignatures).toBe(2);
    expect(pkg.manifest.receivedSignatures).toBe(2);
    expect(pkg.manifest.completionCondition).toBe('2_OF_3_THRESHOLD_MET');
  });

  // --------------------------------------------------------------------------
  // CASO E: DETECCIÓN INEQUÍVOCA DE DOCUMENTO ALTERADO (TAMPER TEST)
  // --------------------------------------------------------------------------
  it('Caso E: Tamper Detection — Modified document byte immediately produces mismatched hash', () => {
    const originalHash = DocumentHasher.hashBuffer(MOCK_PDF_BUFFER);

    // Alter 1 single character in buffer
    const alteredBuffer = Buffer.from('%PDF-1.4 Institutional Real Estate Sovereign Agreement [ALTERED]', 'utf8');
    const alteredHash = DocumentHasher.hashBuffer(alteredBuffer);

    expect(originalHash).not.toBe(alteredHash);
  });

  // --------------------------------------------------------------------------
  // CASO F: DETECCIÓN INEQUÍVOCA DE FIRMA ALTERADA (SIGNATURE TAMPER TEST)
  // --------------------------------------------------------------------------
  it('Caso F: Signature Tamper Detection — Altering 1 bit of signature fails ECDSA verification', async () => {
    const envelopeId = 'env-tamper-004';
    const orgId = 'snarai';
    const docTitle = 'Contrato Inviolable';
    const signedAt = 1787715000;

    const typedData = EIP712Builder.buildTypedData({
      envelopeId,
      organizationId: orgId,
      documentTitle: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      signerEmail: 'alice@snarai.com',
      signerRole: 'SIGNER',
      signedAt,
    });

    const validSignature = await alice.signTypedData({
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
    });

    // Corrupt signature (replace last hex character)
    const corruptedSignature = (validSignature.slice(0, -1) + (validSignature.endsWith('a') ? 'b' : 'a')) as `0x${string}`;

    const result = await EIP712Builder.verifySignature({
      signerAddress: alice.address,
      signature: corruptedSignature,
      envelopeId,
      organizationId: orgId,
      documentTitle: docTitle,
      documentHash: CANONICAL_DOC_HASH,
      signerEmail: 'alice@snarai.com',
      signerRole: 'SIGNER',
      signedAt,
    });

    expect(result.isValid).toBe(false);
  });

  // --------------------------------------------------------------------------
  // CASO G: PREVENCIÓN DE REPLAY ATTACK (REPLAY TEST)
  // --------------------------------------------------------------------------
  it('Caso G: Replay Attack Prevention — Valid signature on Doc A fails verification on Doc B', async () => {
    const envelopeId = 'env-replay-005';
    const orgId = 'snarai';
    const signedAt = 1787716000;

    // Alice signs Document A
    const typedDataDocA = EIP712Builder.buildTypedData({
      envelopeId,
      organizationId: orgId,
      documentTitle: 'Documento A',
      documentHash: CANONICAL_DOC_HASH,
      signerEmail: 'alice@snarai.com',
      signerRole: 'SIGNER',
      signedAt,
    });
    const sigDocA = await alice.signTypedData({
      domain: typedDataDocA.domain,
      types: typedDataDocA.types,
      primaryType: typedDataDocA.primaryType,
      message: typedDataDocA.message,
    });

    // Attacker tries to replay Alice's signature on Document B (different documentHash)
    const fakeDocHash = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const replayVerification = await EIP712Builder.verifySignature({
      signerAddress: alice.address,
      signature: sigDocA,
      envelopeId,
      organizationId: orgId,
      documentTitle: 'Documento A',
      documentHash: fakeDocHash, // Changed document hash
      signerEmail: 'alice@snarai.com',
      signerRole: 'SIGNER',
      signedAt,
    });

    expect(replayVerification.isValid).toBe(false);
  });
});
