/**
 * 🏛️ HERMES SDK — Authoring & Extension Framework
 * Allows third parties & authors to define Packs, Policies, Tools, Workflows, and Strategies.
 */

export interface VersionRequirement {
  runtime: string; // e.g. ">=1.0.0 <2.0.0"
}

export interface DomainPackManifest {
  id: string;
  name: string;
  version: string;
  industry: string;
  locales: string[];
  capabilities: string[];
  requiredTools: string[];
  requiredPolicies: string[];
  workflows: string[];
  defaultModels?: Record<string, string>;
  channels?: string[];
  permissions?: string[];
  compatibility: VersionRequirement;
}

export interface SDKDomainPack {
  manifest: DomainPackManifest;
  knowledge: {
    title: string;
    summary: string;
    faqs: Array<{ question: string; answer: string }>;
  };
  resources: Array<{
    id: string;
    name: string;
    type: 'pdf' | 'link' | 'video' | 'doc';
    url: string;
  }>;
  policies: Array<{
    id: string;
    description: string;
    ruleType: 'ALLOW' | 'DENY' | 'REQUIRES_APPROVAL';
    pattern?: string;
    priority?: number; // Core = 100, Pack = 50, Tenant = 25, Session = 10
  }>;
  objections: Array<{
    triggerPattern: string;
    category: string;
    response: string;
    suggestedResourceId?: string;
  }>;
  salesPitch: string;
  pricing?: Record<string, any>;
}

export interface SDKWorkflow {
  id: string;
  name: string;
  steps: Array<{
    id: string;
    type: 'ACTION' | 'WAIT' | 'CONDITION' | 'HUMAN_ESCALATION';
    config: Record<string, any>;
  }>;
}

export interface SDKStrategy {
  id: string;
  name: string;
  tone: 'CONSERVATIVE' | 'AGGRESSIVE' | 'URGENCY' | 'EDUCATIONAL';
  maxFollowups: number;
  discountThreshold?: number;
}

// SDK Helper functions
export function definePack(pack: SDKDomainPack): SDKDomainPack {
  return pack;
}

export function defineWorkflow(workflow: SDKWorkflow): SDKWorkflow {
  return workflow;
}

export function defineStrategy(strategy: SDKStrategy): SDKStrategy {
  return strategy;
}
