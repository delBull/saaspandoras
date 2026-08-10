/**
 * Execution Contracts (ADR-007)
 * Definiciones de la capa de Ejecución (Pandora's OS).
 */
import { ExecutionIdentitySnapshot } from './identity-contracts';
import { CapabilityId, ProviderId, Artifact, Event } from './capability-contracts';

export interface ExecutionContext {
  executionId: string;
  timestamp: string;
  trigger: string;
  input: any;
  identitySnapshot: ExecutionIdentitySnapshot;
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
