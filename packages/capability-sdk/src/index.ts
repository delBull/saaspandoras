/**
 * @pandoras/capability-sdk — Capability Licensing & Gating Contract Engine
 * 
 * Contrato oficial de capacidades habilitables por Organización (Tenant).
 * Define el licenciamiento, dependencias y gating de módulos en Pandora's Platform OS.
 */

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

export type SubscriptionTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';

export interface CapabilityDefinition {
  id: CapabilityId;
  name: string;
  description: string;
  dependencies?: CapabilityId[];
  minTierRequired: SubscriptionTier;
  featureFlags?: string[];
}

export const CAPABILITY_REGISTRY: Record<CapabilityId, CapabilityDefinition> = {
  AI_AGENTS: {
    id: 'AI_AGENTS',
    name: 'Autonomous AI Agents',
    description: 'Instancias autónomas de Hermes para atención, ventas y operaciones',
    minTierRequired: 'STARTER'
  },
  CRM: {
    id: 'CRM',
    name: 'Memory Engine & CRM',
    description: 'Gestión relacional de prospectos, intenciones y notas de comportamiento',
    minTierRequired: 'STARTER'
  },
  VOICE: {
    id: 'VOICE',
    name: 'Voice AI & Telephony',
    description: 'Notas de voz sintéticas (ElevenLabs) y recepción telefónica',
    dependencies: ['AI_AGENTS'],
    minTierRequired: 'PROFESSIONAL'
  },
  PAYMENTS: {
    id: 'PAYMENTS',
    name: 'Commerce & SPEI Fastlane',
    description: 'Procesamiento de pagos en Pesos MXN (SPEI) o Web3 (USDC)',
    minTierRequired: 'STARTER'
  },
  MARKETPLACE: {
    id: 'MARKETPLACE',
    name: 'Public Marketplace Listing',
    description: 'Listado público en el directorio de inversión de Pandora\'s',
    dependencies: ['TOKENIZATION'],
    minTierRequired: 'ENTERPRISE'
  },
  TOKENIZATION: {
    id: 'TOKENIZATION',
    name: 'Tokenization & Smart Contracts',
    description: 'Emisión de Certificados de Participación en Blockchain',
    minTierRequired: 'ENTERPRISE'
  },
  DAO: {
    id: 'DAO',
    name: 'Governance & DAO Voting',
    description: 'Propuestas de gobernanza y votación ponderada por tokens',
    dependencies: ['TOKENIZATION'],
    minTierRequired: 'ENTERPRISE'
  },
  MEDIA: {
    id: 'MEDIA',
    name: 'Media Co Content Engine',
    description: 'Distribución y generación de piezas de marketing multimedia',
    minTierRequired: 'PROFESSIONAL'
  },
  ANALYTICS: {
    id: 'ANALYTICS',
    name: 'Behavioral & Conversion Analytics',
    description: 'Métricas de conversión de agentes, funnels y rendimiento de canal',
    minTierRequired: 'STARTER'
  },
  EMAIL: {
    id: 'EMAIL',
    name: 'Email Automated Campaigns',
    description: 'Notificaciones y seguimientos transaccionales por email',
    minTierRequired: 'STARTER'
  },
  WHATSAPP: {
    id: 'WHATSAPP',
    name: 'WhatsApp Business API',
    description: 'Canal de mensajería bidireccional mediante WhatsApp API',
    dependencies: ['AI_AGENTS'],
    minTierRequired: 'PROFESSIONAL'
  },
  TELEGRAM: {
    id: 'TELEGRAM',
    name: 'Telegram Bot Infrastructure',
    description: 'Canal de mensajería bidireccional mediante Telegram Bot API',
    dependencies: ['AI_AGENTS'],
    minTierRequired: 'STARTER'
  },
  KNOWLEDGE: {
    id: 'KNOWLEDGE',
    name: 'Knowledge Engine (RAG)',
    description: 'Inyección de PDFs, FAQs y documentos corporativos en agentes',
    dependencies: ['AI_AGENTS'],
    minTierRequired: 'STARTER'
  },
  VECTOR_MEMORY: {
    id: 'VECTOR_MEMORY',
    name: 'Long-Term Vector Memory',
    description: 'Memoria contextual de largo plazo para interacciones continuas',
    dependencies: ['AI_AGENTS', 'KNOWLEDGE'],
    minTierRequired: 'PROFESSIONAL'
  }
};

/**
 * Tiers preconfigurados de capacidades (Licensing Bundles)
 */
export const TIER_CAPABILITIES: Record<SubscriptionTier, CapabilityId[]> = {
  STARTER: ['AI_AGENTS', 'CRM', 'PAYMENTS', 'TELEGRAM', 'KNOWLEDGE', 'EMAIL', 'ANALYTICS'],
  PROFESSIONAL: ['AI_AGENTS', 'CRM', 'PAYMENTS', 'TELEGRAM', 'WHATSAPP', 'KNOWLEDGE', 'VECTOR_MEMORY', 'VOICE', 'MEDIA', 'EMAIL', 'ANALYTICS'],
  ENTERPRISE: ['AI_AGENTS', 'CRM', 'PAYMENTS', 'TELEGRAM', 'WHATSAPP', 'KNOWLEDGE', 'VECTOR_MEMORY', 'VOICE', 'MEDIA', 'EMAIL', 'ANALYTICS', 'TOKENIZATION', 'MARKETPLACE', 'DAO'],
  CUSTOM: []
};

/**
 * Capability Engine — Validador de licencias y dependencias
 */
export class CapabilityEngine {
  public static isCapabilitySupported(
    enabledCapabilities: CapabilityId[],
    target: CapabilityId
  ): boolean {
    if (!enabledCapabilities.includes(target)) return false;

    const def = CAPABILITY_REGISTRY[target];
    if (!def.dependencies || def.dependencies.length === 0) return true;

    // Verificar que todas las dependencias requeridas estén presentes
    return def.dependencies.every(dep => enabledCapabilities.includes(dep));
  }

  public static getCapabilitiesForTier(tier: SubscriptionTier): CapabilityId[] {
    return TIER_CAPABILITIES[tier] || [];
  }
}
