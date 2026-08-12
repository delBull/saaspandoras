/**
 * Execution Contracts (ADR-007)
 * Definiciones de la capa de Ejecución (Pandora's OS).
 */
import { ExecutionIdentitySnapshot } from './identity-contracts';
import { CapabilityId, ProviderId, Artifact, Event } from './capability-contracts';

export interface ChannelContext {
  interactionMode: 'conversational' | 'structured' | 'voice';
  capabilities: {
    supportsButtons: boolean;
    supportsMarkdown: boolean;
    supportsRichMedia: boolean;
    supportsLinks: boolean;
    supportsVoice: boolean;
  };
  constraints: {
    maxLength?: number;
    responseLatency?: 'realtime' | 'async';
  };
}

export interface EventContext {
  eventType: 'MESSAGE_RECEIVED' | 'BUTTON_CLICKED' | 'CALL_COMPLETED' | 'FORM_SUBMITTED' | 'LEAD_CREATED' | 'EMAIL_OPENED' | 'EMAIL_REPLIED' | 'CAMPAIGN_CLICKED' | 'MEETING_BOOKED' | 'MEETING_MISSED' | 'FOLLOW_UP_DUE' | string;
  timestamp: string;
  source: string;
  payload: any;
}

export interface ContactContext {
  contactId: string;
  status: 'NEW' | 'KNOWN' | 'ENGAGED' | 'QUALIFIED' | 'CONVERTING' | 'CUSTOMER';
  tags: string[];
}

export interface ConversationContext {
  conversationId: string;
  historySize: number;
  lastMessageAt?: string;
}

export interface MemoryContext {
  shortTermMemoryId?: string;
  longTermMemoryId?: string;
}

export interface ExecutionContext {
  executionId: string;
  timestamp: string;
  trigger: string;
  input: any;
  identitySnapshot: ExecutionIdentitySnapshot;
  channelContext?: ChannelContext;
  eventContext?: EventContext;
  contactContext?: ContactContext;
  conversationContext?: ConversationContext;
  memoryContext?: MemoryContext;
}

export interface ExecutionRequest<TInput = any> {
  capability: CapabilityId;
  context: ExecutionContext;
  identity: import('./identity-contracts').Identity;
  input: TInput;
  metadata?: {
    traceId?: string;
    correlationId?: string;
    costCenter?: string;
    billingContext?: string;
    sessionId?: string;
    [key: string]: any;
  };
  executionOptions?: {
    timeoutMs?: number;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    async?: boolean;
    retryPolicy?: { maxRetries: number; backoffStrategy: 'LINEAR' | 'EXPONENTIAL' };
    stream?: boolean; // Para respuestas LLM
    temperature?: number; // Para AI Models
  };
}

export interface ExecutionResult<TOutput = any> {
  success: boolean;
  actionExecuted: string; // El nombre real de la acción que procesó el provider
  data: TOutput;
  artifacts?: Artifact[];
  events?: Event[]; // Eventos disparados durante la ejecución
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metrics?: {
    executionTimeMs?: number;
    tokensConsumed?: number;
    costEstimationUsd?: number;
  };
}

export interface Job {
  id: string;
  parentJobId?: string; // Para flujos y workflows dependientes
  capabilityId: CapabilityId;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  schedule?: {
    cronExpression?: string;
    executeAt?: string;
  };
  requestSnapshot: ExecutionRequest;
  resultSnapshot?: ExecutionResult;
  createdAt: string;
  updatedAt: string;
}
