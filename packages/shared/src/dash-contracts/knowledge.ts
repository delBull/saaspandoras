/**
 * 📦 Dash Contracts — Hermes Knowledge Domain
 * src/lib/dash-contracts/knowledge.ts
 */

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
