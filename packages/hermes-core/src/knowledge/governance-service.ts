/**
 * 🏛️ Gobierno del conocimiento por tenant (gaps 2 y 3)
 *
 * Cierra el ciclo que antes era un stub (`approveKnowledge` devolvía null):
 *
 *   submit  → fila PENDING_REVIEW (visible al revisor, invisible al LLM)
 *   approve → cifra + fija en IPFS + firma con la llave DEL TENANT + registra + ACTIVE
 *   reject  → REJECTED, se descarta el texto y se audita
 *   edit    → nueva versión firmada y fijada; la anterior pasa a SUPERSEDED
 *
 * El runtime sólo hidrata ACTIVE, así que nada pendiente llega al prompt.
 */
import crypto from 'crypto';
import { db } from '@saasfly/db-core';
import { hermesKnowledge, hermesKnowledgeRegistry, knowledgeVaultBlobs } from '@saasfly/db-core/schema';
import { and, desc, eq } from '@saasfly/db-core';
import { TenantIpfsVaultService } from './ipfs-vault';
import { getSignerForTenant } from '../identity/tenant-signer';
import { SecurityAuditLogger } from '../runtime/security-audit-logger';

const sha256 = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

export interface SubmitKnowledgeInput {
  tenantId: string;
  key: string;
  dimension: string;
  content: string;
  classification: 'PUBLIC' | 'TENANT_RESTRICTED' | 'B2B_RESTRICTED' | 'INTERNAL_OPERATIONAL' | 'CONFIDENTIAL' | 'SECRET';
  actor: string;
}

export interface ApprovedKnowledge {
  knowledgeId: string;
  cid: string;
  version: number;
  signedBy: string;
  usedPlatformSigner: boolean;
}

function newId(): string {
  return crypto.randomUUID();
}

async function saveVaultBlob(input: {
  tenantId: string;
  artifactId: string;
  version: number;
  cid: string;
  contentHash: string;
  ciphertextHash: string;
  envelopeJson: string;
}): Promise<void> {
  const [existing] = await db
    .select({ id: knowledgeVaultBlobs.id })
    .from(knowledgeVaultBlobs)
    .where(and(
      eq(knowledgeVaultBlobs.tenantId, input.tenantId),
      eq(knowledgeVaultBlobs.artifactId, input.artifactId),
    ))
    .limit(1);

  if (existing) {
    await db
      .update(knowledgeVaultBlobs)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(knowledgeVaultBlobs.id, existing.id));
    return;
  }

  await db.insert(knowledgeVaultBlobs).values({ id: newId(), ...input });
}

export class KnowledgeGovernanceService {
  /** Alta de un hecho: queda pendiente, sin tocar el vault ni el prompt. */
  static async submit(input: SubmitKnowledgeInput): Promise<{ knowledgeId: string; status: 'PENDING_REVIEW' }> {
    const tenantId = input.tenantId.toLowerCase().trim();
    if (!tenantId || !input.key || !input.content?.trim()) {
      throw new Error('[KnowledgeGovernance] tenantId, key y content son obligatorios.');
    }
    if (input.content.length > 200_000) {
      throw new Error('[KnowledgeGovernance] El contenido excede 200k caracteres.');
    }

    const id = newId();
    await db.insert(hermesKnowledge).values({
      id,
      organizationId: tenantId,
      dimension: input.dimension,
      key: input.key,
      content: input.content,
      status: 'PENDING_REVIEW',
      visibility: input.classification === 'PUBLIC' ? 'PUBLIC' : 'INTERNAL',
      classification: input.classification,
      authority: 'TENANT',
      version: 1,
      source: 'PORTAL',
      createdBy: input.actor,
    });

    await SecurityAuditLogger.logEvent({
      organizationId: tenantId,
      actorId: input.actor,
      eventType: 'KNOWLEDGE_PROMOTED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: `knowledge_submit_${id}`,
      metadata: { decision: 'SUBMITTED', key: input.key, classification: input.classification },
    }).catch(() => {});

    return { knowledgeId: id, status: 'PENDING_REVIEW' };
  }

  /** Aprueba: cifra, fija, firma con la identidad del tenant y registra. */
  static async approve(params: { tenantId: string; knowledgeId: string; actor: string }): Promise<ApprovedKnowledge> {
    const tenantId = params.tenantId.toLowerCase().trim();
    const [row] = await db
      .select()
      .from(hermesKnowledge)
      .where(and(eq(hermesKnowledge.id, params.knowledgeId), eq(hermesKnowledge.organizationId, tenantId)))
      .limit(1);

    if (!row) throw new Error('KNOWLEDGE_NOT_FOUND');
    if (row.status === 'ACTIVE') throw new Error('KNOWLEDGE_ALREADY_ACTIVE');
    if (row.status !== 'PENDING_REVIEW' && row.status !== 'DISCOVERED') throw new Error(`KNOWLEDGE_NOT_REVIEWABLE: ${row.status}`);
    if (!row.content?.trim()) throw new Error('KNOWLEDGE_EMPTY_CONTENT');

    const vault = new TenantIpfsVaultService();
    const signerInfo = await getSignerForTenant(tenantId);
    const ctx = {
      tenantId,
      artifactId: row.key,
      version: row.version,
      classification: row.classification as any,
    };

    const pinned = await vault.storeEncryptedKnowledgeToIpfs(row.content, ctx, signerInfo.signer);
    const contentHash = sha256(row.content);
    const ciphertextHash = sha256(pinned.encryptedMetadata.ciphertext);

    if (!pinned.agentSignature) {
      throw new Error('KNOWLEDGE_UNSIGNED: el pin no devolvió firma; no se registra.');
    }

    // Verificación antes de promover: si no descifra e íntegro, no entra al prompt.
    await vault.retrieveVerifiedFromIpfs(pinned.cid, ctx as any, ciphertextHash);

    const [existingRegistry] = await db
      .select({ id: hermesKnowledgeRegistry.id })
      .from(hermesKnowledgeRegistry)
      .where(and(
        eq(hermesKnowledgeRegistry.tenantId, tenantId),
        eq(hermesKnowledgeRegistry.artifactId, row.key),
      ))
      .limit(1);

    const values = {
      tenantId,
      domain: row.dimension,
      artifactId: row.key,
      classification: row.classification,
      version: row.version,
      contentHash,
      ciphertextHash,
      ipfsCid: pinned.cid,
      ipfsUri: `ipfs://${pinned.cid}`,
      signedByAddress: signerInfo.address,
      agentSignature: pinned.agentSignature,
      governanceStatus: 'ACTIVE' as const,
      updatedAt: new Date(),
    };

    if (existingRegistry) {
      await db.update(hermesKnowledgeRegistry).set(values).where(eq(hermesKnowledgeRegistry.id, existingRegistry.id));
    } else {
      await db.insert(hermesKnowledgeRegistry).values({ id: newId(), ...values });
    }

    // Seguro: el sobre cifrado queda en BD para poder re-fijar sin red.
    await saveVaultBlob({
      tenantId,
      artifactId: row.key,
      version: row.version,
      cid: pinned.cid,
      contentHash,
      ciphertextHash,
      envelopeJson: JSON.stringify(pinned.encryptedMetadata),
    });

    // El texto sale de la BD: el vault es la fuente de verdad.
    await db
      .update(hermesKnowledge)
      .set({ status: 'ACTIVE', content: null, authority: 'VERIFIED', updatedAt: new Date() })
      .where(eq(hermesKnowledge.id, row.id));

    await SecurityAuditLogger.logEvent({
      organizationId: tenantId,
      actorId: params.actor,
      eventType: 'KNOWLEDGE_PROMOTED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: `knowledge_approve_${row.id}`,
      artifactId: row.key,
      classification: row.classification as any,
      metadata: {
        decision: 'APPROVED',
        cid: pinned.cid,
        contentHash,
        ciphertextHash,
        signedBy: signerInfo.address,
        usedPlatformSigner: signerInfo.isPlatformFallback,
      },
    }).catch(() => {});

    return {
      knowledgeId: row.id,
      cid: pinned.cid,
      version: row.version,
      signedBy: signerInfo.address,
      usedPlatformSigner: signerInfo.isPlatformFallback,
    };
  }

  /** Rechaza: se descarta el texto y se deja rastro. */
  static async reject(params: { tenantId: string; knowledgeId: string; actor: string; reason: string }): Promise<void> {
    const tenantId = params.tenantId.toLowerCase().trim();
    const [row] = await db
      .select({ id: hermesKnowledge.id, key: hermesKnowledge.key, status: hermesKnowledge.status })
      .from(hermesKnowledge)
      .where(and(eq(hermesKnowledge.id, params.knowledgeId), eq(hermesKnowledge.organizationId, tenantId)))
      .limit(1);

    if (!row) throw new Error('KNOWLEDGE_NOT_FOUND');
    if (row.status === 'ACTIVE') throw new Error('KNOWLEDGE_ALREADY_ACTIVE_USE_EDIT_OR_DEMOTE');

    await db
      .update(hermesKnowledge)
      .set({ status: 'REJECTED', content: null, updatedAt: new Date() })
      .where(eq(hermesKnowledge.id, row.id));

    await SecurityAuditLogger.logEvent({
      organizationId: tenantId,
      actorId: params.actor,
      eventType: 'KNOWLEDGE_DEMOTED',
      severity: 'INFO',
      policyDecision: 'DENY',
      correlationId: `knowledge_reject_${row.id}`,
      artifactId: row.key,
      metadata: { decision: 'REJECTED', reason: params.reason.slice(0, 500) },
    }).catch(() => {});
  }

  /**
   * Nueva versión de un hecho ya activo: se cifra y fija; la anterior pasa a
   * SUPERSEDED en el registro para que sólo una quede ACTIVE.
   */
  static async edit(params: { tenantId: string; knowledgeId: string; content: string; actor: string }): Promise<ApprovedKnowledge> {
    const tenantId = params.tenantId.toLowerCase().trim();
    const [row] = await db
      .select()
      .from(hermesKnowledge)
      .where(and(eq(hermesKnowledge.id, params.knowledgeId), eq(hermesKnowledge.organizationId, tenantId)))
      .limit(1);

    if (!row) throw new Error('KNOWLEDGE_NOT_FOUND');
    if (!params.content?.trim()) throw new Error('KNOWLEDGE_EMPTY_CONTENT');

    const vault = new TenantIpfsVaultService();
    const signerInfo = await getSignerForTenant(tenantId);
    const nextVersion = (row.version ?? 1) + 1;
    const ctx = { tenantId, artifactId: row.key, version: nextVersion, classification: row.classification as any };

    const pinned = await vault.storeEncryptedKnowledgeToIpfs(params.content, ctx, signerInfo.signer);
    const contentHash = sha256(params.content);
    const ciphertextHash = sha256(pinned.encryptedMetadata.ciphertext);
    if (!pinned.agentSignature) throw new Error('KNOWLEDGE_UNSIGNED');

    await vault.retrieveVerifiedFromIpfs(pinned.cid, ctx as any, ciphertextHash);

    // Una sola versión ACTIVE por artefacto.
    await db
      .update(hermesKnowledgeRegistry)
      .set({ governanceStatus: 'SUPERSEDED', updatedAt: new Date() })
      .where(and(
        eq(hermesKnowledgeRegistry.tenantId, tenantId),
        eq(hermesKnowledgeRegistry.artifactId, row.key),
        eq(hermesKnowledgeRegistry.governanceStatus, 'ACTIVE'),
      ));

    await db.insert(hermesKnowledgeRegistry).values({
      id: newId(),
      tenantId,
      domain: row.dimension,
      artifactId: row.key,
      classification: row.classification,
      version: nextVersion,
      contentHash,
      ciphertextHash,
      ipfsCid: pinned.cid,
      ipfsUri: `ipfs://${pinned.cid}`,
      signedByAddress: signerInfo.address,
      agentSignature: pinned.agentSignature,
      governanceStatus: 'ACTIVE',
    });

    await saveVaultBlob({
      tenantId,
      artifactId: row.key,
      version: nextVersion,
      cid: pinned.cid,
      contentHash,
      ciphertextHash,
      envelopeJson: JSON.stringify(pinned.encryptedMetadata),
    });

    await db
      .update(hermesKnowledge)
      .set({ status: 'ACTIVE', content: null, version: nextVersion, authority: 'VERIFIED', updatedAt: new Date() })
      .where(eq(hermesKnowledge.id, row.id));

    await SecurityAuditLogger.logEvent({
      organizationId: tenantId,
      actorId: params.actor,
      eventType: 'KNOWLEDGE_PROMOTED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: `knowledge_edit_${row.id}`,
      artifactId: row.key,
      classification: row.classification as any,
      metadata: { decision: 'SUPERSEDED_PREVIOUS', newVersion: nextVersion, cid: pinned.cid, signedBy: signerInfo.address },
    }).catch(() => {});

    return {
      knowledgeId: row.id,
      cid: pinned.cid,
      version: nextVersion,
      signedBy: signerInfo.address,
      usedPlatformSigner: signerInfo.isPlatformFallback,
    };
  }

  /** Bandeja de revisión del tenant. */
  static async listByStatus(tenantId: string, status: 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'SUPERSEDED' = 'PENDING_REVIEW') {
    return db
      .select({
        id: hermesKnowledge.id,
        key: hermesKnowledge.key,
        dimension: hermesKnowledge.dimension,
        classification: hermesKnowledge.classification,
        version: hermesKnowledge.version,
        status: hermesKnowledge.status,
        content: hermesKnowledge.content,
        updatedAt: hermesKnowledge.updatedAt,
      })
      .from(hermesKnowledge)
      .where(and(eq(hermesKnowledge.organizationId, tenantId.toLowerCase()), eq(hermesKnowledge.status, status)))
      .orderBy(desc(hermesKnowledge.updatedAt))
      .limit(100);
  }
}
