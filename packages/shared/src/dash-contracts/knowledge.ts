/**
 * 📦 Dash Contracts — Hermes Knowledge Domain
 * src/lib/dash-contracts/knowledge.ts
 */

/**
 * Canonical knowledge dimensions (mirror of `KnowledgeDimension` in `@saasfly/hermes-core`,
 * declared here because the UI package cannot import the DB-bound core package).
 * `@saasfly/hermes-core` asserts assignability at compile time, so a divergence breaks the build.
 */
export type KnowledgeDimensionView =
  | 'identity'
  | 'project'
  | 'product'
  | 'market'
  | 'founder'
  | 'business_model'
  | 'traction'
  | 'evidence'
  | 'offer'
  | 'governance';

/**
 * Dimensions that describe the business itself — used by Dash "Business Entities".
 * Single source for both the UI counter and the backend projection.
 */
export const BUSINESS_ENTITY_DIMENSIONS = [
  'identity',
  'project',
  'product',
  'market',
  'founder',
  'business_model',
] as const satisfies readonly KnowledgeDimensionView[];

export interface KnowledgeFactDTO {
  id: string;
  dimension: string;
  key: string;
  content: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  authority: string;
  updatedAt: string;
}

export interface KnowledgeSourceDTO {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface KnowledgeSourceView {
  id: string;
  title: string;
  type: 'DOCUMENT' | 'URL' | 'FAQ' | 'BUSINESS_INFO' | 'BUSINESS_RULE' | 'API' | 'MANUAL' | 'TEXT';
  status: 'CREATED' | 'PROCESSING' | 'READY' | 'FAILED';
  version?: number;
  lastUpdated?: Date | string;
  lastProcessedAt?: Date | string | null;
  chunkCount?: number;
  canRetry?: boolean;
  lastSyncAt?: Date | string;
  itemCount?: number;
}

export interface KnowledgeFactView {
  id: string;
  dimension: string;
  key: string;
  content: string;
  status: 'ACTIVE' | 'PENDING_REVIEW' | 'REJECTED' | 'SUPERSEDED';
  source: string;
}

export interface KnowledgeOverviewView {
  totalSources: number;
  readySources: number;
  processingSources: number;
  failedSources: number;
  knowledgeHealth: 'READY' | 'PROCESSING' | 'ATTENTION_REQUIRED' | 'EMPTY';
  sources: KnowledgeSourceView[];
  facts: KnowledgeFactView[];
}

export interface GetKnowledgeResponseDTO {
  facts: KnowledgeFactDTO[];
  sources: KnowledgeSourceDTO[];
}

export interface AddKnowledgeSourceRequestDTO {
  type: 'TEXT' | 'DOCUMENT' | 'URL';
  title: string;
  content: string;
}

export interface AddKnowledgeSourceResponseDTO {
  success: boolean;
  sourceId: string;
}

export interface UpdateKnowledgeFactStatusRequestDTO {
  factId: string;
  status: 'ACTIVE' | 'REJECTED';
}

export interface UpdateKnowledgeFactStatusResponseDTO {
  success: boolean;
  factId: string;
  status: 'ACTIVE' | 'REJECTED';
}
