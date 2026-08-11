/**
 * 🏛️ PANDORAS KERNEL SDK — Multi-Tenant Agent Operating System Contracts (v2.1)
 * Tenant OS, Brand Engine, Installation Engine, Feature Flags, Domain Mapping & Security Vault
 * + CommunicationEndpoints & Universal Multi-Channel Router
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
  provider: 
    | 'openai' 
    | 'telegram' 
    | 'whatsapp' 
    | 'stripe' 
    | 'telnyx' 
    | 'bandwidth' 
    | 'signalwire' 
    | 'twilio' 
    | 'resend' 
    | 'meta_cloud' 
    | 'custom_byo';
  encryptedValue: string;
  updatedAt: number;
}

/**
 * 📡 CommunicationEndpoint & Universal Multi-Channel Protocol
 * Abstracción total del canal e infraestructura de transporte.
 * Elimina el concepto de "número de Hermes"; cada Tenant registra sus CommunicationEndpoints.
 * Hermes interactúa exclusivamente vía `channel = "whatsapp" | "voice" | ...` y `send(message)`.
 * El Kernel resuelve dinámicamente si utiliza Telnyx, SignalWire, Twilio o credenciales propias del cliente (BYO).
 */
export type CommunicationChannel = 
  | 'telegram'
  | 'whatsapp'
  | 'sms'
  | 'voice'
  | 'email'
  | 'widget'
  | 'facebook'
  | 'instagram'
  | 'messenger'
  | 'custom_webhook';

export type CommunicationProviderType = 
  | 'telnyx'
  | 'signalwire'
  | 'bandwidth'
  | 'twilio'
  | 'resend'
  | 'meta_cloud'
  | 'client_byo' // Bring Your Own Infrastructure
  | 'custom';

export interface CommunicationEndpoint {
  id: string;
  tenantId: string;
  channel: CommunicationChannel;
  provider: CommunicationProviderType;
  identifier: string; // e.g. "+18005550199", "@snarai_bot", "ventas@example.com", "widget_app_snarai", "page_id_102938"
  credentialsRef: string; // Referencia en SecretVault
  isActive: boolean;
  assignedAgentId?: string;
  routeRules?: {
    priority?: number;
    fallbackEndpointId?: string;
  };
  metadata?: Record<string, any>;
}

export interface UniversalOutboundMessage {
  tenantId: string;
  endpointId?: string; // Opcional: Si se omite, el Kernel auto-selecciona el CommunicationEndpoint activo para el canal
  channel: CommunicationChannel;
  recipientIdentifier: string; // Phone, Telegram ChatId, Email, SessionID
  content: string;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
}

export interface UniversalOutboundCall {
  tenantId: string;
  endpointId?: string;
  recipientPhone: string;
  initialPrompt?: string;
  voiceConfig?: {
    voiceId?: string;
    speed?: number;
    providerOverride?: CommunicationProviderType;
  };
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
  communicationEndpoints?: CommunicationEndpoint[];
  billingPlan: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  createdAt: number;
  updatedAt: number;
}

export interface DomainPackManifest {
  packId: string;
  version: string;
  name: string;
  description: string;
  requiredCapabilities: string[];
  defaultAgentConfigs: Array<{
    role: string;
    systemPrompt: string;
    allowedTools: string[];
  }>;
}

export interface TenantInstallationRequest {
  tenantId: string;
  packId: string;
  customBrandOverrides?: Partial<BrandConfiguration>;
}

export interface TenantInstallationResult {
  tenantId: string;
  packId: string;
  status: 'SUCCESS' | 'FAILED';
  installedAgentIds: string[];
  installedCommunicationEndpoints: CommunicationEndpoint[];
  error?: string;
}

export interface TenantRuntimeContext {
  tenant: TenantConfiguration;
  secrets: Map<string, string>;
  endpoints: CommunicationEndpoint[];
}

export class PandorasKernelSDK {
  private static tenants = new Map<string, TenantConfiguration>();
  private static installationLogs: TenantInstallationResult[] = [];

  static registerTenant(config: TenantConfiguration): void {
    this.tenants.set(config.tenantId, config);
  }

  static getTenant(tenantId: string): TenantConfiguration | undefined {
    return this.tenants.get(tenantId);
  }

  /**
   * Resuelve dinámicamente el CommunicationEndpoint adecuado para un canal dado de un tenant
   */
  static resolveEndpoint(tenantId: string, channel: CommunicationChannel): CommunicationEndpoint | undefined {
    const tenant = this.tenants.get(tenantId);
    if (!tenant || !tenant.communicationEndpoints) return undefined;
    
    return tenant.communicationEndpoints.find(ep => ep.channel === channel && ep.isActive);
  }

  static installPack(request: TenantInstallationRequest): TenantInstallationResult {
    const tenant = this.tenants.get(request.tenantId);
    if (!tenant) {
      return {
        tenantId: request.tenantId,
        packId: request.packId,
        status: 'FAILED',
        installedAgentIds: [],
        installedCommunicationEndpoints: [],
        error: `Tenant '${request.tenantId}' not registered in Pandoras Kernel.`
      };
    }

    if (!tenant.features.enabledPacks.includes(request.packId)) {
      tenant.features.enabledPacks.push(request.packId);
    }

    const result: TenantInstallationResult = {
      tenantId: request.tenantId,
      packId: request.packId,
      status: 'SUCCESS',
      installedAgentIds: [`agent_${request.tenantId}_${request.packId}_lead`],
      installedCommunicationEndpoints: tenant.communicationEndpoints || []
    };

    this.installationLogs.push(result);
    return result;
  }

  static getInstallationHistory(tenantId?: string): TenantInstallationResult[] {
    if (tenantId) {
      return this.installationLogs.filter(log => log.tenantId === tenantId);
    }
    return this.installationLogs;
  }
}
