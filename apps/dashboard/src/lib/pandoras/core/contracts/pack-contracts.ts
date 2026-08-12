/**
 * Pack Contracts
 * Define la estructura de aplicaciones instalables (Packs) dentro de Pandora's OS.
 */

import { CapabilityId } from './capability-contracts';

export interface PackIdentity {
  voice: 'professional' | 'casual' | 'technical' | string;
  domain: string; // ej: 'real_estate', 'legal', 'finance'
  tone: string; // ej: 'premium advisory'
}

export interface SoulProfile {
  agentName: string;
  role: string;
  persona: string;
  tone: {
    warmth: 'high' | 'medium' | 'low';
    formality: 'formal' | 'neutral' | 'casual';
    emojiPolicy: 'none' | 'sparse' | 'liberal';
  };
  proactivity: {
    suggestsNextSteps: boolean;
    registersFollowUps: boolean;
    escalatesToHuman: boolean;
    legalDisclaimerMode?: string;
  };
  forbiddenClaims: string[];
}

export interface KnowledgeDefinition {
  companyName: string;
  industry: string;
  products: any[];
  pricing: any;
  faqs: { question: string; answer: string }[];
  objections: { trigger: string; responseStrategy: string }[];
  documents: { title: string; url: string }[];
}

export interface GovernancePolicy {
  financialAdvice: 'forbidden' | 'allowed' | 'disclaimer_required';
  promises: 'forbidden' | 'allowed';
  dataCollection: 'gdpr_strict' | 'standard';
  escalationThreshold: 'low' | 'medium' | 'high'; // low = escalates quickly
}

export type ClaimClassification = 'PUBLIC_FACT' | 'DOCUMENTED_CLAIM' | 'LEGAL_CLAIM' | 'FINANCIAL_CLAIM' | 'LIQUIDITY_CLAIM' | 'PERFORMANCE_CLAIM' | 'UNKNOWN';

export interface EvidenceClaim {
  claim: string;
  classification: ClaimClassification;
  sourceDocument?: string;
  isVerified: boolean;
  allowedResponse: string;
}

export interface DomainPackManifest extends PackManifest {
  soul: SoulProfile;
  knowledgeDef: KnowledgeDefinition;
  journeys: any[]; // references JourneyDefinition
  policies: GovernancePolicy;
  evidenceLayer?: EvidenceClaim[];
}

export interface PackActionDefinition {
  id: string;
  execution: {
    workflow?: string; // Nombre del workflow sugerido (el OS decide si lo usa)
    capability?: CapabilityId;
  };
}

export interface PackGoalTemplate {
  id: string;
  name: string;
  milestones: string[];
}

export interface PackMissionTemplate {
  template: string; // ID de la plantilla
  initialState: string;
}

export interface PackLifecycle {
  onInstall?: string[];
  onActivate?: string[];
  onUpgrade?: string[];
  onDeactivate?: string[];
  onUninstall?: string[];
}

/**
 * La declaración formal de un Pack.
 */
export interface PackManifest {
  id: string;
  name: string;
  version: string;
  type: 'organization-pack' | 'system-pack';
  requires: CapabilityId[]; // Capacidades necesarias del SO
  provides: string[]; // Qué roles/servicios provee
  
  identity?: PackIdentity;
  knowledge?: KnowledgeDefinition;
  
  goals: PackGoalTemplate[];
  missions: PackMissionTemplate[];
  actions: PackActionDefinition[];
  
  lifecycle?: PackLifecycle;
}

/**
 * Representa la instalación viva de un Pack dentro de una Organización.
 */
export interface InstalledPack {
  organizationId: string;
  packId: string;
  version: string;
  status: 'active' | 'inactive' | 'error';
  installedAt: string;
  configOverrides?: Record<string, any>;
}
