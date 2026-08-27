import { db } from '@/db';
import { dealEnvelopes, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { 
  DocumentEnvelope, 
  SignerParticipant, 
  SigningPolicy, 
  SignerRole, 
  EnvelopeStatus,
  BlockchainEvidence 
} from './types';
import { DocumentHasher } from './document-hasher';
import { EIP712Builder } from './eip712-builder';
import { EvidencePackager } from './evidence-packager';
import { SovereignRelayerService } from './relayer-service';
import { SovereignIpfsOrchestrator } from '@/lib/pandoras/core/domains/hermes/knowledge/ipfs/orchestrator';

export interface CreateEnvelopeInput {
  organizationId: string;
  title: string;
  description?: string;
  pdfBuffer: Buffer | Uint8Array;
  signingPolicy?: SigningPolicy;
  thresholdM?: number;
  signers: Array<{
    email: string;
    name: string;
    role?: SignerRole;
    claimedWalletAddress?: string;
    externalIdentifier?: string;
  }>;
  expiresInDays?: number;
}

export class EnvelopeService {
  private static ipfsOrchestrator = new SovereignIpfsOrchestrator();

  /**
   * 1. Creates a new Sovereign Document Envelope and pins initial PDF to IPFS
   */
  public static async createEnvelope(input: CreateEnvelopeInput): Promise<DocumentEnvelope> {
    if (!input.pdfBuffer || input.pdfBuffer.length === 0) {
      throw new Error('PDF buffer is required and cannot be empty.');
    }
    if (!input.signers || input.signers.length === 0) {
      throw new Error('At least one signer is required.');
    }

    // 1. Verify tenant organization exists
    const [project] = await db
      .select({ id: projects.id, slug: projects.slug })
      .from(projects)
      .where(eq(projects.slug, input.organizationId))
      .limit(1);

    if (!project) {
      throw new Error(`Organization '${input.organizationId}' not found.`);
    }

    // 2. Canonical SHA-256 Hashing of raw PDF buffer
    const documentHash = DocumentHasher.hashBuffer(input.pdfBuffer);
    const documentSize = input.pdfBuffer.length;

    // 3. Pin PDF descriptor & payload to Sovereign IPFS Stack (Kubo Primary + Pinata DR Mirror)
    const pinResult = await this.ipfsOrchestrator.pinJson(
      {
        artifactType: 'SOVEREIGN_DOCUMENT_PDF',
        documentHash,
        title: input.title,
        organizationId: input.organizationId,
        sizeBytes: documentSize,
        createdAt: new Date().toISOString(),
      },
      {
        name: `envelope_${documentHash.slice(0, 12)}.json`,
        category: 'LEGAL_AGREEMENT',
        tenantId: input.organizationId,
      }
    );

    const now = new Date();
    const expiresAt = input.expiresInDays 
      ? new Date(now.getTime() + input.expiresInDays * 24 * 60 * 60 * 1000) 
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    // 4. Map signers with initial state
    const signingPolicy = input.signingPolicy || 'PARALLEL';
    const mappedSigners: SignerParticipant[] = input.signers.map((s, idx) => ({
      signerId: crypto.randomUUID(),
      email: s.email.toLowerCase().trim(),
      name: s.name.trim(),
      role: s.role || 'SIGNER',
      orderIndex: idx,
      status: (signingPolicy === 'SEQUENTIAL' && idx > 0) ? 'PENDING' : 'INVITED',
      claimedWalletAddress: s.claimedWalletAddress?.toLowerCase(),
      externalIdentifier: s.externalIdentifier,
    }));

    const envelopeId = crypto.randomUUID();

    const envelopeRecord: typeof dealEnvelopes.$inferInsert = {
      id: envelopeId,
      organizationId: input.organizationId,
      title: input.title,
      description: input.description || null,
      documentHash,
      canonicalDocumentCid: pinResult.cid,
      backupDocumentCid: pinResult.backupCid || null,
      documentVersion: 1,
      documentSize,
      mimeType: 'application/pdf',
      signingPolicy,
      thresholdM: input.thresholdM || null,
      signers: mappedSigners as any,
      status: 'PENDING_SIGNATURES',
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };

    await db.insert(dealEnvelopes).values(envelopeRecord);

    return this.mapFromDb(envelopeRecord);
  }

  /**
   * 2. Retrieves an envelope by its ID
   */
  public static async getEnvelope(envelopeId: string): Promise<DocumentEnvelope | null> {
    const [record] = await db
      .select()
      .from(dealEnvelopes)
      .where(eq(dealEnvelopes.id, envelopeId))
      .limit(1);

    if (!record) return null;
    return this.mapFromDb(record);
  }

  /**
   * 3. Submits an EIP-712 cryptographic signature for a specific signer
   */
  public static async submitSignature(params: {
    envelopeId: string;
    signerId: string;
    signerAddress: string;
    signature: `0x${string}`;
    customStatement?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ envelope: DocumentEnvelope; isComplete: boolean }> {
    const envelope = await this.getEnvelope(params.envelopeId);
    if (!envelope) {
      throw new Error(`Envelope '${params.envelopeId}' not found.`);
    }
    if (envelope.status !== 'PENDING_SIGNATURES') {
      throw new Error(`Envelope cannot be signed in '${envelope.status}' status.`);
    }

    // Locate signer in participant list
    const signerIndex = envelope.signers.findIndex(s => s.signerId === params.signerId);
    if (signerIndex === -1) {
      throw new Error(`Signer '${params.signerId}' not found in envelope.`);
    }

    const signer = envelope.signers[signerIndex];
    if (!signer) {
      throw new Error(`Signer record at index ${signerIndex} is undefined.`);
    }
    if (signer.status === 'SIGNED') {
      throw new Error('Signer has already submitted a signature.');
    }

    // If sequential policy, verify previous signers have completed
    if (envelope.signingPolicy === 'SEQUENTIAL' && signer.orderIndex > 0) {
      const pendingPrior = envelope.signers.some(
        s => s.orderIndex < signer.orderIndex && s.status !== 'SIGNED'
      );
      if (pendingPrior) {
        throw new Error('Previous signers must complete their signature first (Sequential Policy).');
      }
    }

    const signedAtEpoch = Math.floor(Date.now() / 1000);
    const signedAtIso = new Date(signedAtEpoch * 1000).toISOString();

    // Cryptographic EIP-712 Verification
    const verification = await EIP712Builder.verifySignature({
      signerAddress: params.signerAddress,
      signature: params.signature,
      envelopeId: envelope.envelopeId,
      organizationId: envelope.organizationId,
      documentTitle: envelope.title,
      documentHash: envelope.documentHash,
      signerEmail: signer.email,
      signerRole: signer.role,
      signedAt: signedAtEpoch,
      customStatement: params.customStatement,
    });

    if (!verification.isValid) {
      throw new Error(`Cryptographic signature verification failed: ${verification.error || 'Invalid signature'}`);
    }

    const typedDataPayload = EIP712Builder.buildTypedData({
      envelopeId: envelope.envelopeId,
      organizationId: envelope.organizationId,
      documentTitle: envelope.title,
      documentHash: envelope.documentHash,
      signerEmail: signer.email,
      signerRole: signer.role,
      signedAt: signedAtEpoch,
      customStatement: params.customStatement,
    });

    // Update signer record
    signer.status = 'SIGNED';
    signer.signatureProof = {
      signingMethod: 'WALLET_EIP712',
      signerAddress: params.signerAddress.toLowerCase(),
      signature: params.signature,
      signedDocumentHash: envelope.documentHash,
      typedDataPayload,
      signedAt: signedAtIso,
    };
    signer.authentication = {
      authMethod: 'SIWE_ETHEREUM',
      authenticatedAt: signedAtIso,
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
    };

    // If Sequential, promote next signer to INVITED
    if (envelope.signingPolicy === 'SEQUENTIAL') {
      const nextSigner = envelope.signers.find(s => s.orderIndex === signer.orderIndex + 1);
      if (nextSigner && nextSigner.status === 'PENDING') {
        nextSigner.status = 'INVITED';
      }
    }

    // Check completion criteria
    const signedCount = envelope.signers.filter(s => s.status === 'SIGNED').length;
    let isComplete = false;

    if (envelope.signingPolicy === 'M_OF_N') {
      const threshold = envelope.thresholdM || envelope.signers.length;
      isComplete = signedCount >= threshold;
    } else {
      isComplete = signedCount === envelope.signers.length;
    }

    let evidencePackageCid: string | undefined;
    let completedAt: Date | undefined;

    if (isComplete) {
      envelope.status = 'COMPLETED';
      completedAt = new Date();
      envelope.completedAt = completedAt.toISOString();

      // Assemble Evidence Package v1
      const auditTrail = [
        { at: envelope.createdAt, actor: 'SYSTEM', action: 'EnvelopeCreated' },
        ...envelope.signers
          .filter(s => s.signatureProof)
          .map(s => ({
            at: s.signatureProof!.signedAt,
            actor: s.email,
            action: 'DocumentSigned',
            ip: s.authentication?.ipAddress,
            detail: `Signer ${s.name} (${s.signatureProof!.signerAddress}) signed via EIP-712`,
          })),
        { at: completedAt.toISOString(), actor: 'SYSTEM', action: 'EnvelopeCompleted' },
      ];

      const evidencePkg = EvidencePackager.assemble(envelope, auditTrail);
      
      // Pin Evidence Package Manifest to Sovereign IPFS
      const pkgPin = await this.ipfsOrchestrator.pinJson(
        evidencePkg,
        {
          name: `evidence_package_${envelope.envelopeId}.json`,
          category: 'AUDIT_SNAPSHOT',
          tenantId: envelope.organizationId,
        }
      );

      evidencePackageCid = pkgPin.cid;
      envelope.evidencePackageCid = evidencePackageCid;

      // ⚡ Option A: Background Auto-Anchor via Relayer (Fire-and-forget sponsorship)
      SovereignRelayerService.autoAnchorEnvelope({
        envelopeId: envelope.envelopeId,
        documentHash: envelope.documentHash,
        rootEvidenceHash: evidencePkg.rootEvidenceHash,
        evidencePackageCid,
        organizationId: envelope.organizationId,
        signersCount: envelope.signers.filter(s => s.status === 'SIGNED').length,
      }).catch(err => {
        console.warn(`[EnvelopeService] Auto-anchor relayer warning:`, err?.message);
      });
    }

    // Persist update in Neon Database
    await db
      .update(dealEnvelopes)
      .set({
        signers: envelope.signers as any,
        status: isComplete ? 'COMPLETED' : 'PENDING_SIGNATURES',
        evidencePackageCid: evidencePackageCid || null,
        completedAt: completedAt || null,
        updatedAt: new Date(),
      })
      .where(eq(dealEnvelopes.id, envelope.envelopeId));

    return { envelope, isComplete };
  }

  /**
   * 4. Anchors the completed envelope on-chain to the Sovereign Evidence Registry
   */
  public static async attachBlockchainEvidence(
    envelopeId: string,
    evidence: BlockchainEvidence
  ): Promise<DocumentEnvelope> {
    await db
      .update(dealEnvelopes)
      .set({
        blockchainEvidence: evidence as any,
        updatedAt: new Date(),
      })
      .where(eq(dealEnvelopes.id, envelopeId));

    const updated = await this.getEnvelope(envelopeId);
    if (!updated) throw new Error('Envelope not found after updating blockchain evidence');
    return updated;
  }

  private static mapFromDb(record: any): DocumentEnvelope {
    return {
      envelopeId: record.id,
      organizationId: record.organizationId,
      title: record.title,
      description: record.description || undefined,
      documentHash: record.documentHash,
      canonicalDocumentCid: record.canonicalDocumentCid,
      backupDocumentCid: record.backupDocumentCid || undefined,
      documentVersion: record.documentVersion,
      documentSize: record.documentSize,
      mimeType: record.mimeType || 'application/pdf',
      signingPolicy: record.signingPolicy || 'PARALLEL',
      thresholdM: record.thresholdM || undefined,
      signers: record.signers || [],
      status: record.status as EnvelopeStatus,
      evidencePackageCid: record.evidencePackageCid || undefined,
      blockchainEvidence: record.blockchainEvidence || undefined,
      preservationEvidence: record.preservationEvidence || undefined,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt?.toISOString(),
      expiresAt: record.expiresAt ? (typeof record.expiresAt === 'string' ? record.expiresAt : record.expiresAt.toISOString()) : undefined,
      completedAt: record.completedAt ? (typeof record.completedAt === 'string' ? record.completedAt : record.completedAt.toISOString()) : undefined,
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : record.updatedAt?.toISOString(),
    };
  }
}
