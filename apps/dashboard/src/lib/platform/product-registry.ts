/**
 * 🏛️ Pandora's Platform OS — Product Registry v3
 * lib/platform/product-registry.ts
 *
 * Single source of truth for all commercial products.
 * Governs: pipeline, capabilities, connectors, portal modules,
 *          onboarding, runtime defaults, pricing, and health checks.
 *
 * Add new products here. Never hardcode product logic elsewhere.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type PlanKey = 'sandbox' | 'starter' | 'growth' | 'enterprise';

export interface CapabilityDef {
  default: boolean;
  plans: PlanKey[];
}

export interface ConnectorDef {
  default: boolean;
  plans: PlanKey[];
}

export interface ProductPricing {
  price: number | null;
  currency: string;
  period: 'trial' | 'month' | 'year' | 'project' | 'custom';
}

export interface ProductDef {
  family: string;
  displayName: string;
  crmPipeline: string[];
  capabilities: Record<string, CapabilityDef>;
  connectors: Record<string, ConnectorDef>;
  portalModules: string[];
  onboardingSteps: string[];
  runtimeProfile: {
    defaultLLM?: string;
    defaultVoice?: string;
    requiredKnowledge?: string[];
    requiredIntegrations?: string[];
    healthChecks: string[];
  };
  pricing: Record<PlanKey, ProductPricing>;
}

export type ProductKey = keyof typeof PRODUCT_REGISTRY;

// ── Registry ─────────────────────────────────────────────────────────────────

export const PRODUCT_REGISTRY = {

  HERMES: {
    family: 'GROWTH_OS',
    displayName: 'Hermes Runtime',
    // CRM pipeline — ends at Closed Won. Infra takes over from there.
    crmPipeline: ['Lead', 'Qualified', 'Assessment', 'Proposal', 'Closed Won'],
    // Capabilities gated by plan
    capabilities: {
      identity:    { default: true,  plans: ['sandbox', 'starter', 'growth', 'enterprise'] },
      knowledge:   { default: true,  plans: ['sandbox', 'starter', 'growth', 'enterprise'] },
      runtime:     { default: true,  plans: ['sandbox', 'starter', 'growth', 'enterprise'] },
      analytics:   { default: false, plans: ['starter', 'growth', 'enterprise'] },
      voice:       { default: false, plans: ['growth', 'enterprise'] },
      multiagent:  { default: false, plans: ['enterprise'] },
    },
    // Connectors gated by plan
    connectors: {
      webchat:     { default: true,  plans: ['sandbox', 'starter', 'growth', 'enterprise'] },
      telegram:    { default: true,  plans: ['sandbox', 'starter', 'growth', 'enterprise'] },
      whatsapp:    { default: false, plans: ['starter', 'growth', 'enterprise'] },
      signalwire:  { default: false, plans: ['growth', 'enterprise'] },
      email:       { default: false, plans: ['starter', 'growth', 'enterprise'] },
    },
    // Portal modules — filtered at runtime by active capabilities
    portalModules: ['intelligence', 'knowledge', 'channels', 'voice', 'analytics', 'multiagent'],
    // Onboarding wizard steps
    onboardingSteps: [
      'starter_knowledge_wizard', // Wizard-built first Knowledge Pack
      'configure_prompt',         // System prompt & personality
      'connect_channels',         // Copy webhook URLs
      'test_agent',               // First live conversation
    ],
    runtimeProfile: {
      defaultLLM:            'gpt-4o-mini',
      defaultVoice:          'eleven_multilingual_v2',
      requiredKnowledge:     ['company_faq', 'contact_info'],
      requiredIntegrations:  [],
      healthChecks:          ['llm_ping', 'knowledge_loaded', 'channel_connected'],
    },
    pricing: {
      sandbox:    { price: 0,    currency: 'USD', period: 'trial'  },
      starter:    { price: 299,  currency: 'USD', period: 'month'  },
      growth:     { price: 699,  currency: 'USD', period: 'month'  },
      enterprise: { price: null, currency: 'USD', period: 'custom' },
    },
  },

  TOKENIZATION: {
    family: 'INFRASTRUCTURE',
    displayName: 'Tokenización RWA',
    crmPipeline: ['Lead', 'Qualified', 'MSA', 'Tier 1', 'Tier 2', 'Tier 3', 'Deploy'],
    capabilities: {
      blockchain:     { default: true, plans: ['sandbox', 'starter', 'growth', 'enterprise'] },
      dao:            { default: true, plans: ['sandbox', 'starter', 'growth', 'enterprise'] },
      marketplace:    { default: false, plans: ['growth', 'enterprise'] },
      cross_chain:    { default: false, plans: ['enterprise'] },
    },
    connectors: {
      stripe:  { default: true, plans: ['sandbox', 'starter', 'growth', 'enterprise'] },
      spei:    { default: true, plans: ['sandbox', 'starter', 'growth', 'enterprise'] },
    },
    portalModules: ['governance', 'portfolio', 'purchases', 'certificates', 'analytics'],
    onboardingSteps: ['configure_token', 'set_phases', 'deploy_contract', 'launch'],
    runtimeProfile: {
      requiredIntegrations:  ['blockchain_rpc'],
      healthChecks:          ['contract_deployed', 'dao_configured', 'rpc_connected'],
    },
    pricing: {
      sandbox:    { price: 0,    currency: 'USD', period: 'trial'  },
      starter:    { price: 999,  currency: 'USD', period: 'month'  },
      growth:     { price: 2499, currency: 'USD', period: 'month'  },
      enterprise: { price: null, currency: 'USD', period: 'custom' },
    },
  },

  MEDIA_CO: {
    family: 'GROWTH_OS',
    displayName: "Pandora's Media Co.",
    crmPipeline: ['Lead', 'Discovery', 'Proposal', 'Production', 'Retainer'],
    capabilities: {
      content:       { default: true, plans: ['project', 'retainer'] as any },
      distribution:  { default: false, plans: ['retainer'] as any },
      analytics:     { default: false, plans: ['retainer'] as any },
    },
    connectors: {},
    portalModules: ['content', 'calendar', 'analytics', 'billing'],
    onboardingSteps: ['brief', 'kick_off', 'first_delivery'],
    runtimeProfile: {
      healthChecks: ['brief_uploaded'],
    },
    pricing: {
      sandbox:    { price: 0,    currency: 'USD', period: 'trial'  },
      starter:    { price: 1500, currency: 'USD', period: 'project' },
      growth:     { price: 3500, currency: 'USD', period: 'month'  },
      enterprise: { price: null, currency: 'USD', period: 'custom' },
    },
  },

} as const satisfies Record<string, ProductDef>;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns portal modules visible to a client based on their active capabilities.
 * A module is visible if:
 *   1. It has no capability gate in the Registry, OR
 *   2. The client's active capabilities explicitly has it as `true`
 */
export function getVisibleModules(
  product: ProductKey,
  activeCapabilities: Record<string, boolean>
): string[] {
  const def = PRODUCT_REGISTRY[product];
  return def.portalModules.filter(mod => {
    const cap = def.capabilities[mod as keyof typeof def.capabilities];
    if (!cap) return true; // No gate → always visible
    return activeCapabilities[mod] === true;
  });
}

/**
 * Returns the default capabilities map for a given product + plan.
 * Used by the Provisioning Engine when installing a product.
 */
export function getDefaultCapabilities(
  product: ProductKey,
  plan: PlanKey
): Record<string, boolean> {
  const def = PRODUCT_REGISTRY[product];
  const result: Record<string, boolean> = {};
  for (const [key, capDef] of Object.entries(def.capabilities)) {
    result[key] = (capDef as CapabilityDef).plans.includes(plan);
  }
  return result;
}

/**
 * Returns the default connectors map for a given product + plan.
 */
export function getDefaultConnectors(
  product: ProductKey,
  plan: PlanKey
): Record<string, boolean> {
  const def = PRODUCT_REGISTRY[product];
  const result: Record<string, boolean> = {};
  for (const [key, connDef] of Object.entries(def.connectors)) {
    result[key] = (connDef as ConnectorDef).plans.includes(plan);
  }
  return result;
}

/**
 * Auto-detects product from request origin URL.
 * Used by lead registration to auto-assign product_family + product.
 *
 * 🔒 S'Narai (project ID 2) is always TOKENIZATION — never overridden here.
 */
export function detectProductFromOrigin(origin: string | null): {
  productFamily: string;
  product: string;
} {
  if (!origin) return { productFamily: 'INFRASTRUCTURE', product: 'TOKENIZATION' };

  const HERMES_PATHS = ['/growth-os/hermes', '/hermes', 'growth-os/hermes'];
  if (HERMES_PATHS.some(p => origin.includes(p))) {
    return { productFamily: 'GROWTH_OS', product: 'HERMES' };
  }

  const MEDIA_PATHS = ['/media', '/pandoras-media', 'media-co'];
  if (MEDIA_PATHS.some(p => origin.includes(p))) {
    return { productFamily: 'GROWTH_OS', product: 'MEDIA_CO' };
  }

  // Default: Infrastructure / Tokenization (S'Narai, standard leads)
  return { productFamily: 'INFRASTRUCTURE', product: 'TOKENIZATION' };
}
