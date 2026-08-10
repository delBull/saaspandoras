/**
 * Identity Contracts (ADR-007)
 * Definiciones estáticas del contexto operativo inmutable.
 */

export interface OrganizationIdentity {
  id: string;
  name: string;
  brand: {
    logoUrl?: string;
    palette?: Record<string, string>;
  };
  voice: 'formal' | 'casual' | 'technical' | string;
  locale: string;
}

export interface Identity {
  id: string; // UUID de usuario, wallet, etc.
  type: 'USER' | 'TENANT' | 'AGENT' | 'SYSTEM';
  tenantId?: string; // Para multi-tenant
  wallet?: string; // Para web3 auth
  roles?: string[];
  metadata?: Record<string, any>;
}

export interface ActorIdentity {
  userId: string;
  roles: string[];
  permissions?: string[];
  wallet?: string;
}

export interface EnvironmentContext {
  stage: 'development' | 'staging' | 'production';
  timezone: string;
  region: string;
  language: string;
  units: 'metric' | 'imperial';
}

export interface ProviderConfig {
  providerId: string;
  model?: string;
  latencyPreference?: 'fast' | 'accurate';
  fallbacks?: string[];
  retries?: number;
  costLimitUsd?: number;
}

export interface PolicyLimits {
  budgetUsd: number;
  allowedModels: string[];
  rateLimits?: Record<string, number>;
  securityLevel: 'standard' | 'high' | 'critical';
}

export interface RuntimeMetadata {
  executionId: string;
  correlationId: string;
  traceId: string;
  sourceApp: string; // ej: 'hermes', 'snarai'
  version: string;
}

/**
 * Snapshot inmutable del contexto bajo el cual ocurre una ejecución.
 */
export interface ExecutionIdentitySnapshot {
  organization: OrganizationIdentity;
  actor: ActorIdentity;
  environment: EnvironmentContext;
  capabilities: {
    available: string[];
  };
  packs: {
    installed: string[];
  };
  providers: {
    llm?: ProviderConfig;
    [key: string]: ProviderConfig | undefined;
  };
  policies: {
    limits: PolicyLimits;
  };
  metadata: RuntimeMetadata;
}
