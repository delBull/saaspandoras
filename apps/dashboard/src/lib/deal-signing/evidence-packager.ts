import { DocumentEnvelope, EvidenceManifest } from './types';
import { DocumentHasher } from './document-hasher';
import { StandaloneVerifierGenerator } from './standalone-verifier';

export interface AssembledEvidencePackage {
  envelopeId: string;
  manifest: EvidenceManifest;
  signaturesJson: string;
  blockchainJson: string;
  ipfsJson: string;
  auditJson: string;
  verifyHtml: string;
  rootEvidenceHash: string;
}

export class EvidencePackager {
  public static readonly LEGAL_SCOPE_STATEMENT = 
    'Sovereign Evidence Layer v1.0 — Cryptographic integrity, private-key ECDSA authorship proof and immutable storage record (Zero-Platform architecture). Legal identity verification & NOM-151 compliance reserved for Stage 2.';

  /**
   * Assembles the canonical JSON manifests and files for the Evidence Package v1
   */
  public static assemble(
    envelope: DocumentEnvelope, 
    auditTrail: Array<{ at: string; actor: string; action: string; ip?: string; detail?: string }>
  ): AssembledEvidencePackage {
    const nowIso = new Date().toISOString();

    const totalSigners = envelope.signers.length;
    const receivedSignatures = envelope.signers.filter(s => s.status === 'SIGNED').length;
    
    let requiredSignatures = totalSigners;
    let completionCondition = 'ALL_SIGNERS_SATISFIED';

    if (envelope.signingPolicy === 'M_OF_N') {
      requiredSignatures = envelope.thresholdM || totalSigners;
      completionCondition = `${requiredSignatures}_OF_${totalSigners}_THRESHOLD_MET`;
    } else if (envelope.signingPolicy === 'SEQUENTIAL') {
      completionCondition = 'STRICT_SEQUENTIAL_CHAIN_COMPLETED';
    }

    const manifest: EvidenceManifest = {
      manifestVersion: '1.0',
      envelopeId: envelope.envelopeId,
      organizationId: envelope.organizationId,
      title: envelope.title,
      documentHash: envelope.documentHash,
      documentSize: envelope.documentSize,
      documentMimeType: envelope.mimeType,
      signingPolicy: envelope.signingPolicy,
      totalSigners,
      requiredSignatures,
      receivedSignatures,
      completionCondition,
      status: envelope.status,
      createdAt: envelope.createdAt,
      finalizedAt: envelope.completedAt || nowIso,
      primaryCid: envelope.canonicalDocumentCid,
      backupCid: envelope.backupDocumentCid,
      blockchain: envelope.blockchainEvidence,
      preservation: envelope.preservationEvidence,
      legalScopeStatement: this.LEGAL_SCOPE_STATEMENT,
    };

    // Sort signers deterministically for signatures.json
    const sortedSigners = [...envelope.signers].sort((a, b) => a.orderIndex - b.orderIndex);

    const jsonReplacer = (_key: string, value: any) => 
      typeof value === 'bigint' ? value.toString() : value;

    const signaturesJson = JSON.stringify(
      sortedSigners.map(s => ({
        signerId: s.signerId,
        orderIndex: s.orderIndex,
        name: s.name,
        email: s.email,
        role: s.role,
        status: s.status,
        authentication: s.authentication,
        signatureProof: s.signatureProof,
      })),
      jsonReplacer,
      2
    );

    const blockchainJson = JSON.stringify(
      envelope.blockchainEvidence || { status: 'PENDING_ANCHOR' },
      jsonReplacer,
      2
    );

    const ipfsJson = JSON.stringify(
      {
        primaryKuboCid: envelope.canonicalDocumentCid,
        backupPinataCid: envelope.backupDocumentCid || null,
        pinnedAt: envelope.createdAt,
      },
      jsonReplacer,
      2
    );

    const auditJson = JSON.stringify(auditTrail, jsonReplacer, 2);

    const verifyHtml = StandaloneVerifierGenerator.generateHtml({
      envelopeId: envelope.envelopeId,
      documentHash: envelope.documentHash,
      evidencePackageCid: envelope.evidencePackageCid,
      txHash: envelope.blockchainEvidence?.transactionHash,
    });

    const manifestDigest = DocumentHasher.hashObject(manifest);
    const signaturesDigest = DocumentHasher.computeSignaturesDigest(envelope.signers);
    const rootEvidenceHash = DocumentHasher.computeRootEvidenceHash(
      envelope.documentHash,
      signaturesDigest,
      manifestDigest
    );

    return {
      envelopeId: envelope.envelopeId,
      manifest,
      signaturesJson,
      blockchainJson,
      ipfsJson,
      auditJson,
      verifyHtml,
      rootEvidenceHash,
    };
  }
}
