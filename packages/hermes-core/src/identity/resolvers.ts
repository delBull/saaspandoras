// Legacy context types — defined locally since they predate ExecutionIdentitySnapshot
interface TenantContext {
  id: string;
  organization: string;
  environment: string;
  region: string;
  currency: string;
}

interface BrandingContext {
  voice: string;
  tone: string;
  promptStyle: string;
}

interface PolicyContext {
  budgetUsd: number;
  allowedModels: string[];
  securityLevel: string;
  rateLimits?: Record<string, number>;
}

interface UserContext {
  id: string;
  roles: string[];
  permissions?: string[];
  wallet?: string;
}

interface LocalizationContext {
  language: string;
  locale: string;
  timezone: string;
  units: string;
}

interface CapabilityContext {
  [key: string]: { model?: string; latencyPreference?: string };
}

/**
 * Interfaces para los Resolvers individuales.
 * Cada uno se encarga de ir a buscar (DB, Redis, Config) su parte del contexto.
 */

export interface ITenantResolver {
  resolve(tenantId: string): Promise<TenantContext>;
}

export interface IBrandResolver {
  resolve(tenantId: string): Promise<BrandingContext>;
}

export interface IPolicyResolver {
  resolve(tenantId: string): Promise<PolicyContext>;
}

export interface IUserResolver {
  resolve(userId: string): Promise<UserContext>;
}

export interface ILocalizationResolver {
  resolve(tenantId: string, userId: string): Promise<LocalizationContext>;
}

export interface ICapabilityContextResolver {
  resolve(tenantId: string): Promise<CapabilityContext>;
}

// ============================================================================
// Default/Mock Implementations (MVP)
// ============================================================================

export class DefaultTenantResolver implements ITenantResolver {
  async resolve(tenantId: string): Promise<TenantContext> {
    return {
      id: tenantId,
      organization: 'Pandoras Mock Org',
      environment: 'development',
      region: 'us-east-1',
      currency: 'USD'
    };
  }
}

export class DefaultBrandResolver implements IBrandResolver {
  async resolve(tenantId: string): Promise<BrandingContext> {
    return {
      voice: 'formal',
      tone: 'professional',
      promptStyle: 'Direct and concise, with high attention to detail.'
    };
  }
}

export class DefaultPolicyResolver implements IPolicyResolver {
  async resolve(tenantId: string): Promise<PolicyContext> {
    return {
      budgetUsd: 1000,
      allowedModels: ['gpt-4o', 'claude-3-5-sonnet'],
      securityLevel: 'standard'
    };
  }
}

export class DefaultUserResolver implements IUserResolver {
  async resolve(userId: string): Promise<UserContext> {
    return {
      id: userId,
      roles: ['admin'],
    };
  }
}

export class DefaultLocalizationResolver implements ILocalizationResolver {
  async resolve(tenantId: string, userId: string): Promise<LocalizationContext> {
    return {
      language: 'es',
      locale: 'es-MX',
      timezone: 'America/Mexico_City',
      units: 'metric'
    };
  }
}

export class DefaultCapabilityContextResolver implements ICapabilityContextResolver {
  async resolve(tenantId: string): Promise<CapabilityContext> {
    return {
      'generate.image': {
        model: 'dall-e-3',
        latencyPreference: 'accurate'
      }
    };
  }
}
