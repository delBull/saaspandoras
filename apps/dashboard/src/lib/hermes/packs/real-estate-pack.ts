/**
 * Hermes Real Estate Pack — Vertical Domain Pack
 * src/lib/hermes/packs/real-estate-pack.ts
 *
 * Implements the domain pack for real estate developments.
 * Provides vocabulary, commercial concepts, and factory function for tenant manifests.
 *
 * Grounded on Client Approved Knowledge:
 * Never asserts universal legal truth; binds strictly to project data room.
 */

import { DomainPackManifest, SoulProfile, GovernancePolicy } from '../../pandoras/core/contracts/pack-contracts';
import { 
  ClientProjectKnowledge, 
  RealEstateDoctrineEngine, 
  RealEstateObjectionCategory, 
  RealEstatePropertyType 
} from './real-estate-doctrine';

export interface RealEstateUnitDefinition {
  identifier: string; // e.g. "Lote 14", "Depto 302"
  propertyType: RealEstatePropertyType;
  totalM2: number;
  builtM2?: number;
  priceUsd: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  features: string[];
}

export interface RealEstateTenantConfig {
  tenantId: string;
  developmentName: string;
  knowledge: ClientProjectKnowledge;
  inventory?: RealEstateUnitDefinition[];
  customAgentName?: string;
  customPersona?: string;
}

export const REAL_ESTATE_BASE_SOUL: SoulProfile = {
  agentName: "Hermes Asesor Comercial",
  role: "Especialista en Inversión Inmobiliaria",
  persona: "Profesional, transparente, analítico, seguro y orientado a resultados comerciales.",
  tone: {
    warmth: 'high',
    formality: 'neutral',
    emojiPolicy: 'sparse'
  },
  proactivity: {
    suggestsNextSteps: true,
    registersFollowUps: true,
    escalatesToHuman: true,
    legalDisclaimerMode: "Siempre referir dudas jurídicas o de garantías a los documentos oficiales del Data Room."
  },
  forbiddenClaims: [
    "prometer rendimientos financieros fijos o garantizados",
    "afirmar licencias o permisos que no consten en los documentos del Data Room",
    "ofrecer asesoría fiscal personalizada vinculante",
    "prometer fechas de entrega sin respaldo en contrato",
    "comprometer descuentos fuera de la política comercial aprobada",
    "inventar amenidades o especificaciones técnicas no registradas"
  ]
};

export const REAL_ESTATE_GOVERNANCE_POLICY: GovernancePolicy = {
  financialAdvice: 'disclaimer_required',
  promises: 'forbidden',
  dataCollection: 'standard',
  escalationThreshold: 'medium'
};

/**
 * Factory that creates a DomainPackManifest for any Real Estate development
 * based purely on configuration (Zero-Code Onboarding).
 */
export function createRealEstateDomainPack(config: RealEstateTenantConfig): DomainPackManifest {
  const { tenantId, developmentName, knowledge, customAgentName, customPersona } = config;

  const objectionCategories: RealEstateObjectionCategory[] = [
    'LEGAL_CERTAINTY',
    'CAPITAL_APPRECIATION',
    'DELIVERY_TIMELINE',
    'EXIT_LIQUIDITY',
    'MAINTENANCE_HOA'
  ];

  const resolvedObjections = objectionCategories.map((cat) => {
    const resolved = RealEstateDoctrineEngine.resolveObjection(cat, knowledge);
    return {
      trigger: cat.toLowerCase().replace(/_/g, ' '),
      responseStrategy: resolved.responseStrategy
    };
  });

  return {
    id: tenantId,
    name: `${developmentName} — Revenue Closer`,
    version: '1.0.0',
    type: 'organization-pack',
    requires: ['communication.route'],
    provides: ['concierge', 'sales', 'qualification', 'appointment'],
    goals: [],
    missions: [],
    actions: [],

    soul: {
      ...REAL_ESTATE_BASE_SOUL,
      agentName: customAgentName || REAL_ESTATE_BASE_SOUL.agentName,
      persona: customPersona || REAL_ESTATE_BASE_SOUL.persona
    },

    journeys: [
      {
        id: `${tenantId}_commercial_closing_journey`,
        name: `${developmentName} Commercial Closing Journey`,
        persona: customAgentName || 'Asesor Comercial',
        goal: 'Calificar prospecto y agendar sesión de cierre en Google Meet',
        playbookId: 'real_estate_commercial_playbook',
        allowedSkills: [],
        allowedTools: [],
        successCriteria: { targetEvent: 'DISCOVERY_CALL_SCHEDULED' },
        timeoutMinutes: 2880 // 48 hours
      }
    ],

    policies: REAL_ESTATE_GOVERNANCE_POLICY
  };
}

export * from './real-estate-doctrine';
