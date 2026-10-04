export interface KnowledgeSource {
  id: string;
  organizationId: string;
  title: string;
  type: 'DOCUMENT' | 'URL' | 'FAQ' | 'BUSINESS_INFO' | 'BUSINESS_RULE';
  status: 'CREATED' | 'PROCESSING' | 'READY' | 'FAILED';
  activeVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastProcessedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface KnowledgeSourceVersion {
  id: string;
  sourceId: string;
  organizationId: string;
  version: number;
  content: string;
  status: 'CREATED' | 'PROCESSING' | 'INDEXED' | 'READY' | 'FAILED';
  chunkCount: number;
  createdAt: Date;
  processedAt: Date | null;
  createdBy: string;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface IndexedKnowledgeChunk {
  id?: number;
  tenantId: string;
  sourceId: string;
  sourceVersionId: string;
  content: string;
  embedding: number[];
  metadata?: any;
}

export interface KnowledgeEmbeddingProvider {
  embed(inputs: string[]): Promise<number[][]>;
}

export interface KnowledgeRetrievalContext {
  organizationId: string;
  limit?: number;
  minSimilarity?: number;
}

export interface KnowledgeMatch {
  chunk: IndexedKnowledgeChunk;
  similarity: number;
}

export interface KnowledgeIndex {
  upsert(chunks: IndexedKnowledgeChunk[]): Promise<void>;
  delete(sourceVersionId: string): Promise<void>;
  search(queryEmbedding: number[], topK: number): Promise<IndexedKnowledgeChunk[]>;
}

/**
 * MVP / LOCAL implementation of an embedding provider.
 * This is used to prove the lifecycle without introducing an external dependency.
 * It generates a deterministically random 1536-dimensional array using a SHA-256 hash.
 */
export class MockEmbeddingProvider implements KnowledgeEmbeddingProvider {
  async embed(inputs: string[]): Promise<number[][]> {
    const crypto = await import('crypto');
    return inputs.map(content => {
      const hash = crypto.createHash('sha256').update(content).digest();
      const vec = [];
      const hashArray = Array.from(hash);
      for (let i = 0; i < 1536; i++) {
        vec.push(((hashArray[i % 32] || 0) / 255.0) * 2 - 1);
      }
      return vec;
    });
  }
}
