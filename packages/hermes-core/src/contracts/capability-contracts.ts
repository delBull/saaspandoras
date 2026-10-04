/**
 * Capability Contracts (ADR-007)
 * Definiciones de la capa de Infraestructura (Providers, Capabilities).
 */

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

export interface CapabilityDefinition {
  id: CapabilityId;
  domain: DomainId;
  version: string;
  description: string;
  owner: DomainId;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  executionType: 'SYNC' | 'ASYNC' | 'STREAM';
  permissions: string[];
  eventsEmitted?: string[];
}

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  version: string;
  capabilities: CapabilityId[];
  health: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  priority: number;
  metadata?: Record<string, any>;
}

export interface Binding {
  capability: CapabilityId;
  providerId: ProviderId;
  priority: number;
  enabled: boolean;
  version: string;
}

export interface Resource {
  id: string;
  providerId: ProviderId;
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

export interface Event<TPayload = any> {
  id: string;
  name: string;
  source: ProviderId;
  payload: TPayload;
  correlationId?: string;
  timestamp: string; // ISO 8601
  identityContext?: any; // referenciar a algo ligero si es necesario
}

export interface ServiceProvider {
  execute(request: import('./execution-contracts').ExecutionRequest): Promise<import('./execution-contracts').ExecutionResult>;
}
