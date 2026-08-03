/**
 * @pandoras/runtime-sdk — Hermes Runtime Engine Abstraction Layer
 *
 * Implements the 4-layer decoupled architecture:
 *   Adapters → Providers → Connectors → Capabilities
 *
 * The TenantRuntimeManifest is the single bootstrapper artifact that
 * Hermes Runtime reads on startup — no multi-table queries required.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TIER & CAPABILITY TYPES (imported conceptually from @pandoras/capability-sdk)
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';

export type CapabilityId =
  | 'AI_AGENTS'
  | 'CRM'
  | 'VOICE'
  | 'PAYMENTS'
  | 'MARKETPLACE'
  | 'TOKENIZATION'
  | 'DAO'
  | 'MEDIA'
  | 'ANALYTICS'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'KNOWLEDGE'
  | 'VECTOR_MEMORY';

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1: ADAPTER TYPES (Protocol-level)
// ─────────────────────────────────────────────────────────────────────────────

export type AdapterType =
  | 'whatsapp'
  | 'telegram'
  | 'email'
  | 'web_widget'
  | 'sms'
  | 'voice'
  | 'discord'
  | 'slack';

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2: PROVIDER TYPES (Vendor-level — swappable without touching Adapters)
// ─────────────────────────────────────────────────────────────────────────────

/** LLM Providers — Hermes Runtime selects the active model from this list */
export type LLMProviderId =
  | 'ollama'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'mistral';

/** WhatsApp Providers — pluggable behind the WhatsApp Adapter */
export type WhatsAppProviderId =
  | 'meta'          // Meta Cloud API (Enterprise, Official, Recommended)
  | 'baileys'       // Baileys QR Web Bridge (Pyme Quick-Connect / Sandbox)
  | 'twilio'        // Twilio WhatsApp API
  | 'evolution_api' // Evolution API (Self-hosted open source)
  | 'infobip';      // Infobip

/** Voice Providers */
export type VoiceProviderId =
  | 'elevenlabs'
  | 'cartesia'
  | 'openai_tts'
  | 'playht';

/** Email Providers */
export type EmailProviderId =
  | 'resend'
  | 'postmark'
  | 'sendgrid'
  | 'mailgun';

/** Payment Rail Providers */
export type PaymentProviderId =
  | 'banregio_spei'  // SPEI (México)
  | 'thirdweb'       // Web3 / USDC
  | 'stripe'
  | 'mercadopago';

export interface LLMProviderConfig {
  provider: LLMProviderId;
  model: string;
  baseUrl?: string;           // Required for Ollama
  apiKeyRef?: string;         // Vault key reference (never raw secret)
  maxTokens?: number;
  temperature?: number;
}

export interface WhatsAppProviderConfig {
  provider: WhatsAppProviderId;
  /** Meta Cloud API fields */
  phoneNumberId?: string;
  tokenRef?: string;          // Vault key reference
  webhookVerifyToken?: string;
  /** Baileys QR Bridge fields */
  sessionId?: string;
  qrSessionActive?: boolean;
  /** Positioning hint for UI */
  tier: 'enterprise' | 'quick_connect';
}

export interface VoiceProviderConfig {
  provider: VoiceProviderId;
  apiKeyRef?: string;
  voiceId?: string;
}

export interface EmailProviderConfig {
  provider: EmailProviderId;
  apiKeyRef?: string;
  fromAddress?: string;
  fromName?: string;
}

export interface PaymentProviderConfig {
  provider: PaymentProviderId;
  /** Banregio SPEI */
  clabe?: string;
  beneficiary?: string;
  commercialName?: string;
  /** Stripe / Crypto */
  apiKeyRef?: string;
  contractAddress?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3: CONNECTOR TYPES (External SaaS Services)
// ─────────────────────────────────────────────────────────────────────────────

export type ConnectorId =
  | 'hubspot'
  | 'salesforce'
  | 'zoho_crm'
  | 'google_calendar'
  | 'outlook_calendar'
  | 'cal_com'
  | 'google_drive'
  | 'notion'
  | 'airtable';

export interface ConnectorConfig {
  connectorId: ConnectorId;
  enabled: boolean;
  oauthTokenRef?: string;     // Vault reference
  apiKeyRef?: string;
  webhookUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 4: TENANT RUNTIME MANIFEST
// The single bootstrapper object Hermes reads on startup.
// Eliminates multi-table queries per message.
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantRuntimeManifest {
  /** Unique tenant identifier */
  tenantSlug: string;
  tenantId: string;

  /** Subscription tier determines available capabilities */
  tier: SubscriptionTier;

  /** Enabled capabilities for this tenant */
  capabilities: CapabilityId[];

  /** Active channel adapters */
  activeAdapters: AdapterType[];

  /** Provider configurations (secrets stored as vault key refs) */
  providers: {
    llm?: LLMProviderConfig;
    whatsapp?: WhatsAppProviderConfig;
    voice?: VoiceProviderConfig;
    email?: EmailProviderConfig;
    payments?: PaymentProviderConfig[];
  };

  /** External service connectors */
  connectors?: ConnectorConfig[];

  /** Installed Knowledge Packs */
  knowledgePacks?: string[];

  /** Installed Domain Packs */
  domainPacks?: string[];

  /** Runtime meta */
  timezone?: string;
  locale?: string;
  createdAt?: string;
  manifestVersion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MANIFEST FACTORY & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

export class RuntimeManifestFactory {
  /** Create a minimal valid manifest for a new tenant */
  static createDefault(tenantSlug: string, tenantId: string, tier: SubscriptionTier = 'STARTER'): TenantRuntimeManifest {
    return {
      tenantSlug,
      tenantId,
      tier,
      capabilities: tier === 'STARTER'
        ? ['AI_AGENTS', 'CRM', 'TELEGRAM', 'KNOWLEDGE']
        : ['AI_AGENTS', 'CRM', 'WHATSAPP', 'TELEGRAM', 'VOICE', 'PAYMENTS', 'KNOWLEDGE', 'ANALYTICS'],
      activeAdapters: ['telegram', 'web_widget'],
      providers: {
        llm: {
          provider: 'ollama',
          model: 'llama3.1:8b',
          baseUrl: 'http://127.0.0.1:11434',
        }
      },
      connectors: [],
      knowledgePacks: [],
      domainPacks: [],
      manifestVersion: '4.2.0',
    };
  }

  /** Validate that required fields are present */
  static validate(manifest: Partial<TenantRuntimeManifest>): manifest is TenantRuntimeManifest {
    return !!(
      manifest.tenantSlug &&
      manifest.tenantId &&
      manifest.tier &&
      Array.isArray(manifest.capabilities) &&
      manifest.providers?.llm &&
      manifest.manifestVersion
    );
  }

  /** Check if a capability is enabled */
  static hasCapability(manifest: TenantRuntimeManifest, capability: CapabilityId): boolean {
    return manifest.capabilities.includes(capability);
  }

  /** Get the active WhatsApp provider tier label for UI display */
  static getWhatsAppTierLabel(manifest: TenantRuntimeManifest): string | null {
    const wp = manifest.providers.whatsapp;
    if (!wp) return null;
    if (wp.tier === 'enterprise') return 'Meta Cloud API (Enterprise)';
    return 'Quick-Connect QR (Pyme)';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL PROVIDER CATALOG (for Provider Marketplace UI)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProviderCatalogEntry {
  id: string;
  name: string;
  category: 'whatsapp' | 'llm' | 'voice' | 'email' | 'payments' | 'crm' | 'calendar';
  description: string;
  tier: 'enterprise' | 'quick_connect' | 'standard';
  recommended?: boolean;
  available: boolean;
  logoPlaceholder: string;
}

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  // WhatsApp
  { id: 'meta', name: 'Meta Cloud API', category: 'whatsapp', description: 'API oficial de Meta. Alta disponibilidad, SLA garantizado. Recomendado para Enterprise.', tier: 'enterprise', recommended: true, available: true, logoPlaceholder: 'WA' },
  { id: 'baileys', name: 'Baileys QR Bridge', category: 'whatsapp', description: 'Conexión rápida vía escaneo de QR con número personal. Ideal para pymes y pruebas.', tier: 'quick_connect', recommended: false, available: true, logoPlaceholder: 'QR' },
  { id: 'twilio', name: 'Twilio WhatsApp', category: 'whatsapp', description: 'API de WhatsApp via Twilio con soporte global y failover.', tier: 'enterprise', recommended: false, available: false, logoPlaceholder: 'TW' },
  { id: 'evolution_api', name: 'Evolution API', category: 'whatsapp', description: 'Open-source self-hosted WhatsApp bridge. Para equipos técnicos avanzados.', tier: 'quick_connect', recommended: false, available: false, logoPlaceholder: 'EV' },
  // LLM
  { id: 'ollama', name: 'Ollama (Local)', category: 'llm', description: 'Inferencia local 100% privada. llama3.1:8b, mistral, phi-3 y más.', tier: 'standard', recommended: true, available: true, logoPlaceholder: 'OL' },
  { id: 'openai', name: 'OpenAI', category: 'llm', description: 'GPT-4o, GPT-4o-mini. Requiere API Key propia del cliente.', tier: 'standard', recommended: false, available: true, logoPlaceholder: 'AI' },
  { id: 'anthropic', name: 'Anthropic Claude', category: 'llm', description: 'Claude Sonnet 4.5 / Opus. Alto razonamiento y contexto largo.', tier: 'standard', recommended: false, available: false, logoPlaceholder: 'AN' },
  { id: 'gemini', name: 'Google Gemini', category: 'llm', description: 'Gemini 1.5 Flash / Pro. Multimodal y rápido.', tier: 'standard', recommended: false, available: false, logoPlaceholder: 'GG' },
  // Voice
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'voice', description: 'Síntesis de voz ultra-realista. Voces propias clonadas.', tier: 'enterprise', recommended: true, available: true, logoPlaceholder: 'EL' },
  { id: 'cartesia', name: 'Cartesia', category: 'voice', description: 'TTS de baja latencia para Voice AI en tiempo real.', tier: 'enterprise', recommended: false, available: false, logoPlaceholder: 'CA' },
  // Email
  { id: 'resend', name: 'Resend', category: 'email', description: 'Transaccional email moderno para notificaciones y seguimientos.', tier: 'standard', recommended: true, available: true, logoPlaceholder: 'RS' },
  { id: 'postmark', name: 'Postmark', category: 'email', description: 'Email transaccional con alta entregabilidad.', tier: 'standard', recommended: false, available: false, logoPlaceholder: 'PM' },
  // Payments
  { id: 'banregio_spei', name: 'SPEI (Banregio)', category: 'payments', description: 'Cobros en Pesos Mexicanos vía SPEI. CLABE MXHUB Banregio.', tier: 'standard', recommended: true, available: true, logoPlaceholder: 'SP' },
  { id: 'thirdweb', name: 'Thirdweb / USDC', category: 'payments', description: 'Pagos en criptomonedas (USDC, MATIC) mediante contratos inteligentes.', tier: 'standard', recommended: false, available: true, logoPlaceholder: 'TW' },
  { id: 'stripe', name: 'Stripe', category: 'payments', description: 'Tarjetas internacionales y cobros recurrentes.', tier: 'standard', recommended: false, available: false, logoPlaceholder: 'ST' },
  { id: 'mercadopago', name: 'Mercado Pago', category: 'payments', description: 'Pagos en MXN vía OXXO, tarjeta y wallet.', tier: 'standard', recommended: false, available: false, logoPlaceholder: 'MP' },
  // CRM
  { id: 'hubspot', name: 'HubSpot CRM', category: 'crm', description: 'Sincronización bidireccional de contactos y deals con HubSpot.', tier: 'enterprise', recommended: true, available: false, logoPlaceholder: 'HS' },
  { id: 'salesforce', name: 'Salesforce', category: 'crm', description: 'Integración Enterprise con Salesforce CRM vía OAuth.', tier: 'enterprise', recommended: false, available: false, logoPlaceholder: 'SF' },
  { id: 'zoho_crm', name: 'Zoho CRM', category: 'crm', description: 'CRM completo para LATAM con integración nativa.', tier: 'standard', recommended: false, available: false, logoPlaceholder: 'ZO' },
  // Calendar
  { id: 'google_calendar', name: 'Google Calendar', category: 'calendar', description: 'Agenda citas y reuniones directamente desde Hermes.', tier: 'standard', recommended: true, available: false, logoPlaceholder: 'GC' },
  { id: 'cal_com', name: 'Cal.com', category: 'calendar', description: 'Agendamiento open-source compatible con Hermes.', tier: 'standard', recommended: false, available: false, logoPlaceholder: 'CC' },
];
