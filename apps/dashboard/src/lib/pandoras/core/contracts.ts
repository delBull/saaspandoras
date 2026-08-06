/**
 * Pandora's Core — Immutable Contracts (ADR-013 Blueprint v1)
 *
 * Estos 11 contratos (ahora incluyendo ProviderDefinition y Binding) representan la
 * espina dorsal del ecosistema (Hermes, Growth, Media, Capital).
 * Solo pueden modificarse a través de un cambio de versión mayor.
 */

// ============================================================================
// 0. Base Types
// ============================================================================
export type DomainId =
  | 'marketing'
  | 'crm'
  | 'calendar'
  | 'content'
  | 'payments'
  | 'identity'
  | 'knowledge'
  | 'automation'
  | 'voice'
  | 'analytics'
  | string;

export type CapabilityId = string; // Ej: 'marketing.scoreLead'
export type ProviderId = string; // Ej: 'growth_provider_v1', 'hubspot_provider'

// ============================================================================
// 1. Identity
// ============================================================================
export interface Identity {
  id: string; // UUID de usuario, wallet, etc.
  type: 'USER' | 'TENANT' | 'AGENT' | 'SYSTEM';
  tenantId?: string; // Para multi-tenant, desacoplado de la BD relacional (no usar `number`)
  wallet?: string; // Para web3 auth
  roles?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// 2. ExecutionRequest
// ============================================================================
export interface ExecutionRequest<TInput = any> {
  capability: CapabilityId;
  identity: Identity; // Quién ejecuta
  input: TInput; // Payload fuertemente tipado en base a la CapabilityDefinition
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

// ============================================================================
// 3. ExecutionResult
// ============================================================================
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

// ============================================================================
// 4. CapabilityDefinition
// ============================================================================
export interface CapabilityDefinition {
  id: CapabilityId;
  domain: DomainId;
  version: string;
  description: string;
  owner: DomainId; // Ahora pertenece a un Dominio, no a un Producto (ej. 'marketing', no 'Growth OS')
  inputSchema: Record<string, any>; // JSON Schema de entrada
  outputSchema: Record<string, any>; // JSON Schema de salida
  executionType: 'SYNC' | 'ASYNC' | 'STREAM';
  permissions: string[]; // Roles/Permisos requeridos para invocar
  eventsEmitted?: string[];
}

// ============================================================================
// 5. ServiceProvider
// ============================================================================
export interface ServiceProvider {
  /**
   * El único punto de entrada para ejecutar lógica de dominio.
   */
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}

// ============================================================================
// 6. Artifact
// ============================================================================
export interface Artifact {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'CALENDAR_INVITE' | 'CERTIFICATE' | 'JSON' | 'MARKDOWN';
  name: string;
  size?: number; // Bytes
  checksum?: string;
  url?: string;
  content?: any;
  mimeType?: string;
  metadata?: Record<string, any>;
  createdAt: string; // ISO 8601
}

// ============================================================================
// 7. Event
// ============================================================================
export interface Event<TPayload = any> {
  id: string;
  name: string; // Estándar de la plataforma, ej: 'LeadQualified'
  source: ProviderId; // Provider que emitió el evento
  payload: TPayload;
  correlationId?: string; // Para trazar peticiones asíncronas
  timestamp: string; // ISO 8601
  identityContext?: Identity;
}

// ============================================================================
// 8. Job
// ============================================================================
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

// ============================================================================
// 9. Resource
// ============================================================================
export interface Resource {
  id: string;
  providerId: ProviderId; // A quién pertenece el recurso (Growth, Capital, External API)
  type: 'GPU' | 'HTTP_PROVIDER' | 'EXTERNAL_API' | 'WORKER_QUEUE' | 'DB_CONNECTION' | 'VOICE_CHANNEL';
  name: string;
  status: 'AVAILABLE' | 'IN_USE' | 'OFFLINE' | 'DEGRADED';
  capacity?: {
    total: number;
    used: number;
    unit: string;
  };
  configuration?: Record<string, any>;
}

// ============================================================================
// 10. ProviderDefinition
// ============================================================================
export interface ProviderDefinition {
  id: ProviderId;
  name: string; // Ej: 'Growth Provider v1'
  version: string;
  capabilities: CapabilityId[]; // Qué capacidades soporta este provider
  health: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  priority: number; // En caso de providers duplicados
  metadata?: Record<string, any>;
}

// ============================================================================
// 11. Binding
// ============================================================================
export interface Binding {
  capability: CapabilityId;
  providerId: ProviderId; // Quién resuelve esta capability (ej. 'growth_provider_v1')
  priority: number; // En caso de fallback
  enabled: boolean;
  version: string;
}
