import { RuntimeMessage } from '../contracts';
import { ControlPlaneContext } from '../../knowledge/types';

export interface ConversationMemoryProvider {
  load(input: MemoryQuery): Promise<ConversationMemory>;
  append(input: MemoryAppend): Promise<MemoryAppendResult>;
}

export interface MemoryQuery {
  organizationId: string;
  conversationId: string;
  controlPlaneContext: ControlPlaneContext;
  limit?: number;
  before?: Date;
}

export interface ConversationMemory {
  organizationId: string;
  conversationId: string;
  messages: RuntimeMessage[];
  version: string;
  loadedAt: Date;
  source: 'PERSISTED' | 'EMPTY';
}

export interface ConversationTurn {
  userMessage: RuntimeMessage;
  assistantMessage: RuntimeMessage;
  responseId: string;
  createdAt: Date;
}

export interface MemoryAppend {
  organizationId: string;
  conversationId: string;
  controlPlaneContext: ControlPlaneContext;
  turn: ConversationTurn;
  expectedVersion?: string;
  idempotencyKey: string;
}

export interface MemoryAppendResult {
  persisted: boolean;
  duplicate: boolean;
  version: string;
  persistedAt: Date;
}

/**
 * Defines the strict trust boundary for conversational memory.
 * Memory ONLY provides historical context. It NEVER grants authority.
 */
export interface MemoryTrustBoundary {
  readonly grantsAuthority: false;
  readonly createsKnowledge: false;
  readonly modifiesGovernance: false;
  readonly modifiesCapabilities: false;
}
