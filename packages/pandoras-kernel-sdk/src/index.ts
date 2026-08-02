/**
 * 🏛️ PANDORAS KERNEL SDK — Multi-Tenant Agent Operating System Contracts (v2.0)
 * Tenant OS, Brand Engine, Installation Engine, Feature Flags, Domain Mapping & Security Vault
 */

export type TenantLifecycleStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'PAUSED' | 'ARCHIVED';

export interface BrandConfiguration {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  voice: {
    tone: 'executive' | 'premium' | 'educational' | 'urgent';
    language: string;
  };
  signature: string;
  customCss?: string;
}

export interface TenantFeatures {
  voiceAI: boolean;
  whatsapp: boolean;
  telegram: boolean;
  web3Checkout: boolean;
  speiFastLane: boolean;
  customDomain: boolean;
  enabledPacks: string[];
}

export interface TenantCapabilities {
  maxAgents: number;
  maxContacts: number;
  monthlyConversationsLimit: number;
  allowedChannels: string[];
}

export interface TenantDomainMapping {
  tenantId: string;
  customDomain: string; // e.g. "ai.luxuryhomes.com"
  sslStatus: 'PENDING' | 'ACTIVE' | 'FAILED';
  verificationToken?: string;
}

export interface TenantSecretVaultEntry {
  tenantId: string;
  provider: 'openai' | 'telegram' | 'whatsapp' | 'stripe' | 'telnyx';
  encryptedValue: string;
  updatedAt: number;
}

export interface TenantConfiguration {
  tenantId: string;
  slug: string;
  name: string;
  brand: BrandConfiguration;
  lifecycle: TenantLifecycleStatus;
  features: TenantFeatures;
  capabilities: TenantCapabilities;
  domainMapping?: TenantDomainMapping;
  billingPlan: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  createdAt: number;
}

export interface TenantContext {
  tenantId: string;
  brand: BrandConfiguration;
  features: TenantFeatures;
  capabilities: TenantCapabilities;
  lifecycle: TenantLifecycleStatus;
  locale: string;
}

export interface AgentInstance {
  id: string;
  tenantId: string;
  name: string;
  packId: string;
  channels: Array<'telegram' | 'whatsapp' | 'voice' | 'email' | 'web'>;
  status: 'ONLINE' | 'MAINTENANCE' | 'PAUSED';
  createdAt: number;
}

export interface AgentBlueprint {
  blueprintId: string;
  name: string;
  packId: string;
  defaultBrand: BrandConfiguration;
  defaultFeatures: TenantFeatures;
  recommendedChannels: string[];
}

export interface InstallationOptions {
  tenantId: string;
  blueprintId: string;
  customName?: string;
  brandOverride?: Partial<BrandConfiguration>;
}

export class AgentInstaller {
  static async installBlueprint(options: InstallationOptions): Promise<{ agentInstance: AgentInstance; status: 'INSTALLED' }> {
    const agentId = `AGT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    console.info(`[Pandoras Installation Engine] Installing Blueprint '${options.blueprintId}' for Tenant '${options.tenantId}' -> Agent ID: ${agentId}`);

    const agentInstance: AgentInstance = {
      id: agentId,
      tenantId: options.tenantId,
      name: options.customName || `Agent ${options.blueprintId}`,
      packId: 'snarai',
      channels: ['telegram', 'web'],
      status: 'ONLINE',
      createdAt: Date.now()
    };

    return { agentInstance, status: 'INSTALLED' };
  }
}

export class TenantRegistry {
  private static tenants: Map<string, TenantConfiguration> = new Map([
    [
      'tenant_001',
      {
        tenantId: 'tenant_001',
        slug: 'pandoras-internal',
        name: 'Pandoras Internal (S\'Narai)',
        brand: {
          name: "S'Narai Riviera Nayarit",
          voice: { tone: 'executive', language: 'es-MX' },
          signature: "Equipo S'Narai Patrimonial"
        },
        lifecycle: 'ACTIVE',
        features: {
          voiceAI: true,
          whatsapp: true,
          telegram: true,
          web3Checkout: true,
          speiFastLane: true,
          customDomain: true,
          enabledPacks: ['snarai']
        },
        capabilities: {
          maxAgents: 100,
          maxContacts: 1000000,
          monthlyConversationsLimit: 500000,
          allowedChannels: ['telegram', 'web', 'whatsapp', 'voice', 'email']
        },
        billingPlan: 'ENTERPRISE',
        createdAt: Date.now()
      }
    ]
  ]);

  static registerTenant(tenant: TenantConfiguration): void {
    this.tenants.set(tenant.tenantId, tenant);
  }

  static getTenant(tenantId: string): TenantConfiguration | undefined {
    return this.tenants.get(tenantId);
  }

  static createContext(tenantId: string): TenantContext {
    const tenant = this.getTenant(tenantId) || this.getTenant('tenant_001')!;
    return {
      tenantId: tenant.tenantId,
      brand: tenant.brand,
      features: tenant.features,
      capabilities: tenant.capabilities,
      lifecycle: tenant.lifecycle,
      locale: tenant.brand.voice.language || 'es-MX'
    };
  }
}
