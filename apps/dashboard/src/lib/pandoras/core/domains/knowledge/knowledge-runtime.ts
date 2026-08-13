import { db } from '@/db';
import { knowledgeSources, knowledgeSourceVersions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { 
  KnowledgeEmbeddingProvider, 
  KnowledgeIndex, 
  IndexedKnowledgeChunk 
} from './knowledge-types';
import { MockEmbeddingProvider } from './knowledge-types';
import { nanoid } from 'nanoid';

/**
 * PostgreSQL implementation of Knowledge Index.
 * In Phase 6.4 this is a mock implementation to satisfy the contract.
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

/**
 * The Knowledge Runtime is responsible for the ingestion lifecycle of Knowledge Sources.
 * 
 * The Lifecycle Contract:
 * Source -> Version -> Chunks -> Embedding Provider -> Index -> Retrievable -> READY
 */
export class KnowledgeRuntime {
  constructor(
    private readonly embeddingProvider: KnowledgeEmbeddingProvider,
    private readonly index: KnowledgeIndex
  ) {}

  /**
   * Processes a newly created knowledge version asynchronously.
   */
  async processVersion(tenantId: string, sourceId: string, versionId: string): Promise<void> {
    try {
      console.log(`[KnowledgeRuntime] Starting processing for Source: ${sourceId} / Version: ${versionId}`);
      
      // 1. Mark as processing
      await db.update(knowledgeSources).set({ status: 'PROCESSING', lastProcessedAt: new Date() }).where(eq(knowledgeSources.id, sourceId));
      await db.update(knowledgeSourceVersions).set({ status: 'PROCESSING', processedAt: new Date() }).where(eq(knowledgeSourceVersions.id, versionId));

      // 2. Retrieve source version
      const [version] = await db.select().from(knowledgeSourceVersions).where(eq(knowledgeSourceVersions.id, versionId)).limit(1);
      if (!version) throw new Error('Version not found');

      // 3. Chunking 
      // For MVP, we simulate chunking by just taking the whole content as 1 chunk.
      // In production, this will use a RecursiveCharacterTextSplitter or similar.
      const rawChunks = [version.content];

      // 4. Embedding Provider
      // Embed all chunks via the provider.
      const embeddings = await this.embeddingProvider.embed(rawChunks);

      const chunks: IndexedKnowledgeChunk[] = rawChunks.map((content, idx) => ({
        sourceId,
        sourceVersionId: versionId,
        tenantId,
        content,
        embedding: embeddings[idx]!
      }));

      // 5. Indexing
      // Upsert into the vector store.
      await this.index.upsert(chunks);

      // 6. Retrievable -> READY
      await db.update(knowledgeSources).set({ status: 'READY', activeVersionId: versionId, lastProcessedAt: new Date() }).where(eq(knowledgeSources.id, sourceId));
      await db.update(knowledgeSourceVersions).set({ status: 'READY', processedAt: new Date() }).where(eq(knowledgeSourceVersions.id, versionId));
      
      console.log(`[KnowledgeRuntime] Successfully completed lifecycle for Source: ${sourceId}`);
    } catch (err: any) {
      console.error(`[KnowledgeRuntime] Failed processing Source: ${sourceId}`, err);
      // Mark as failed
      await db.update(knowledgeSources).set({ status: 'FAILED', lastProcessedAt: new Date() }).where(eq(knowledgeSources.id, sourceId));
      await db.update(knowledgeSourceVersions).set({ status: 'FAILED', processedAt: new Date() }).where(eq(knowledgeSourceVersions.id, versionId));
    }
  }
}

// Global Singleton for Phase 6.4 MVP
// We explicitly wire up the MockEmbeddingProvider here so the architecture remains clean.
export const knowledgeRuntime = new KnowledgeRuntime(
  new MockEmbeddingProvider(),
  new PostgresKnowledgeIndex()
);
