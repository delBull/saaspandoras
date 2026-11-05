import { db } from '@saasfly/db-core';
import {
  knowledgeSources,
  knowledgeSourceVersions,
  hermesKnowledge,
  hermesGovernanceAudit,
} from '@saasfly/db-core/schema';
import { and, eq } from "@saasfly/db-core";
import type { 
  KnowledgeEmbeddingProvider, 
  KnowledgeIndex, 
  IndexedKnowledgeChunk 
} from './knowledge-types';
import { MockEmbeddingProvider } from './knowledge-types';
import { nanoid } from 'nanoid';
import { buildSourceKnowledgeProjection } from './source-knowledge-projection';

/**
 * PostgreSQL implementation of Knowledge Index.
 * In Phase 6.4 this is a mock implementation to satisfy the contract.
 * It does NOT persist chunks: semantic retrieval is not available yet.
 */
export class PostgresKnowledgeIndex implements KnowledgeIndex {
  async upsert(chunks: IndexedKnowledgeChunk[]): Promise<void> {
    console.log(`[PostgresKnowledgeIndex] Upserting ${chunks.length} chunks`);
  }
  async delete(sourceVersionId: string): Promise<void> {
    console.log(`[PostgresKnowledgeIndex] Deleting chunks for version ${sourceVersionId}`);
  }
  async search(queryEmbedding: number[], topK: number): Promise<IndexedKnowledgeChunk[]> {
    return [];
  }
}

interface ProjectionOutcome {
  knowledgeId: string;
  status: 'ACTIVE' | 'PENDING_REVIEW';
  dimension: string;
}

/**
 * The Knowledge Runtime is responsible for the ingestion lifecycle of Knowledge Sources.
 * 
 * The Lifecycle Contract:
 * Source -> Version -> Chunks -> Embedding Provider -> Index -> Facts (governed) -> READY
 *
 * Governance contract (FC-004): the runtime PROPOSES knowledge candidates. Approval is a
 * separate, explicit act (`KnowledgeService.updateFactStatus`), never assumed here.
 * Any failure is fail-closed: the source is marked FAILED with an error code and the error
 * is rethrown to the caller (no silent catches).
 */
export class KnowledgeRuntime {
  constructor(
    private readonly embeddingProvider: KnowledgeEmbeddingProvider,
    private readonly index: KnowledgeIndex
  ) {}

  /**
   * Processes a newly created knowledge version.
   * Throws on failure. The source/version are marked FAILED once tenant ownership was
   * proven; a cross-tenant call is rejected without writing to the foreign rows.
   */
  async processVersion(tenantId: string, sourceId: string, versionId: string): Promise<ProjectionOutcome> {
    // Never mutate rows before ownership is proven: a cross-tenant call must not even flip
    // another tenant's source into PROCESSING/FAILED.
    let tenantVerified = false;
    try {
      console.log(`[KnowledgeRuntime] Starting processing for Source: ${sourceId} / Version: ${versionId}`);

      // 1. Retrieve source version and its source
      const [version] = await db.select().from(knowledgeSourceVersions).where(eq(knowledgeSourceVersions.id, versionId)).limit(1);
      if (!version) throw new Error('KNOWLEDGE_VERSION_NOT_FOUND');

      const [sourceRow] = await db.select().from(knowledgeSources).where(eq(knowledgeSources.id, sourceId)).limit(1);
      if (!sourceRow) throw new Error('KNOWLEDGE_SOURCE_NOT_FOUND');

      // 1b. Tenant binding check (defense in depth: never process a version from another tenant)
      if (version.tenantId !== tenantId || sourceRow.tenantId !== tenantId) {
        throw new Error('KNOWLEDGE_TENANT_MISMATCH');
      }
      tenantVerified = true;

      // 2. Mark as processing
      await db.update(knowledgeSources).set({ status: 'PROCESSING', lastProcessedAt: new Date() }).where(eq(knowledgeSources.id, sourceId));
      await db.update(knowledgeSourceVersions).set({ status: 'PROCESSING', processedAt: new Date() }).where(eq(knowledgeSourceVersions.id, versionId));

      // 3. Chunking 
      // For MVP, we simulate chunking by just taking the whole content as 1 chunk.
      const rawChunks = [version.content];

      // 4. Embedding Provider
      const embeddings = await this.embeddingProvider.embed(rawChunks);

      const chunks: IndexedKnowledgeChunk[] = rawChunks.map((content, idx) => ({
        sourceId,
        sourceVersionId: versionId,
        tenantId,
        content,
        embedding: embeddings[idx]!
      }));

      // 5. Indexing
      // NOTE: PostgresKnowledgeIndex is still a contract stub (no chunk persistence yet).
      await this.index.upsert(chunks);

      // 6. Governed knowledge projection (source -> hermes_knowledge candidate)
      const projection = await this.projectFact(tenantId, sourceId, sourceRow, version);

      // 7. Retrievable -> READY
      await db.update(knowledgeSources).set({ status: 'READY', activeVersionId: versionId, lastProcessedAt: new Date(), errorCode: null, errorMessage: null }).where(eq(knowledgeSources.id, sourceId));
      await db.update(knowledgeSourceVersions).set({ status: 'READY', processedAt: new Date(), errorCode: null, errorMessage: null }).where(eq(knowledgeSourceVersions.id, versionId));

      console.log(`[KnowledgeRuntime] Completed Source ${sourceId}: fact ${projection.knowledgeId} (${projection.status})`);
      return projection;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorCode = errorMessage.startsWith('KNOWLEDGE_')
        ? errorMessage
        : 'KNOWLEDGE_PROCESSING_FAILED';

      console.error(`[KnowledgeRuntime] Failed processing Source: ${sourceId} (${errorCode})`, err);

      // Fail-closed: persist the failure state before propagating. If THIS write fails too,
      // the original error still propagates (we do not swallow either of them).
      if (!tenantVerified) {
        // Ownership was never proven: touching these rows would be a cross-tenant write.
        console.error('[KnowledgeRuntime] Skipping failure persistence: tenant binding not verified.');
        throw err;
      }
      try {
        await db.update(knowledgeSources)
          .set({ status: 'FAILED', lastProcessedAt: new Date(), errorCode, errorMessage })
          .where(eq(knowledgeSources.id, sourceId));
        await db.update(knowledgeSourceVersions)
          .set({ status: 'FAILED', processedAt: new Date(), errorCode, errorMessage })
          .where(eq(knowledgeSourceVersions.id, versionId));
      } catch (persistErr) {
        console.error('[KnowledgeRuntime] Could not persist failure state:', persistErr);
      }

      throw err;
    }
  }

  /**
   * Projects the source version into a governed `hermes_knowledge` candidate.
   * Atomic: supersede siblings + insert candidate + governance audit entry.
   */
  private async projectFact(
    tenantId: string,
    sourceId: string,
    sourceRow: { type: string | null; title: string | null },
    version: { version: number; content: string; createdBy: string }
  ): Promise<ProjectionOutcome> {
    const projection = buildSourceKnowledgeProjection({
      tenantId,
      sourceId,
      sourceType: sourceRow.type,
      sourceVersion: version.version,
      content: version.content,
      createdBy: version.createdBy,
    });

    const now = new Date();
    const { organizationId, dimension, key, status } = projection.values;

    return await db.transaction(async (tx) => {
      const siblings = await tx
        .select()
        .from(hermesKnowledge)
        .where(and(
          eq(hermesKnowledge.organizationId, organizationId),
          eq(hermesKnowledge.dimension, dimension),
          eq(hermesKnowledge.key, key)
        ));

      // Supersede the versions this candidate replaces:
      // - an ACTIVE candidate replaces the ACTIVE knowledge;
      // - a PENDING_REVIEW candidate replaces the previous unapproved draft only
      //   (approved knowledge stays live until the new version is explicitly approved).
      const replacedStatus = status === 'ACTIVE' ? 'ACTIVE' : 'PENDING_REVIEW';
      const replacedIds = siblings.filter((s) => s.status === replacedStatus).map((s) => s.id);

      if (replacedIds.length > 0) {
        await tx.update(hermesKnowledge)
          .set({ status: 'SUPERSEDED', updatedAt: now })
          .where(and(
            eq(hermesKnowledge.organizationId, organizationId),
            eq(hermesKnowledge.dimension, dimension),
            eq(hermesKnowledge.key, key),
            eq(hermesKnowledge.status, replacedStatus)
          ));
      }

      const nextVersion = siblings.reduce((max, s) => Math.max(max, s.version), 0) + 1;
      const knowledgeId = `k_${nanoid(18)}`;
      const supersedesId = siblings.find((s) => s.status === replacedStatus)?.id ?? null;

      await tx.insert(hermesKnowledge).values({
        id: knowledgeId,
        ...projection.values,
        version: nextVersion,
        supersedesId,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(hermesGovernanceAudit).values({
        id: `aud_${nanoid(18)}`,
        organizationId,
        knowledgeId,
        version: nextVersion,
        eventType: 'CREATE',
        actorId: projection.values.createdBy,
        actorType: projection.values.createdBy === 'knowledge_runtime' ? 'SYSTEM' : 'USER',
        oldStatus: replacedIds.length > 0 ? replacedStatus : null,
        newStatus: status,
        reason: projection.governance.reason ?? null,
        metadata: {
          source: 'KNOWLEDGE_SOURCE_INGESTION',
          sourceId,
          sourceType: sourceRow.type,
          sourceVersion: version.version,
          requiresHumanApproval: projection.governance.requiresHumanApproval,
          supersededKnowledgeIds: replacedIds,
        },
        createdAt: now,
      });

      return { knowledgeId, status, dimension };
    });
  }
}

// Global Singleton for Phase 6.4 MVP
// We explicitly wire up the MockEmbeddingProvider here so the architecture remains clean.
export const knowledgeRuntime = new KnowledgeRuntime(
  new MockEmbeddingProvider(),
  new PostgresKnowledgeIndex()
);
