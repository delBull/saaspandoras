import { NormalizedInboundMessage } from '../../channels/normalized-message';

// ---------------------------------------------------------
// Core Enums & Types for the Cognitive Layering Model (6.6.0)
// ---------------------------------------------------------

export type KnowledgeScope = 'GLOBAL' | 'PLATFORM' | 'ORGANIZATION' | 'PROJECT';
export type MemoryProvenance = 'USER_STATED' | 'SYSTEM_INFERRED' | 'SYSTEM_KNOWN';
export type AuthorityLevel = 'PROPOSAL' | 'MEDIUM' | 'HIGH' | 'MAXIMUM';

export interface IdentityPack {
  agentName: string;
  organizationName: string;
  brand?: {
    name: string;
    tone: string;
    language: string;
  };
  contact?: Record<string, string>;
}

export interface SoulPack {
  mission: string[];
  personality: string[];
  principles: string[];
  communication: string[];
  escalationRules: string[];
}

export interface PolicyPack {
  prohibitedActions: string[];
  requiredDisclosures: string[];
  hardEscalationTriggers: Record<string, string>;
}

export interface KnowledgeSnapshot {
  retrievedSnippets: Array<{
    content: string;
    scope: KnowledgeScope;
    relevanceScore: number;
    sourceDocument: string;
    organizationId?: string; // Used for C5.25 Scope Validation
    projectId?: string;      // Used for C5.25 Scope Validation
  }>;
}

export interface MemorySnapshot {
  episodic: Array<{ event: string; timestamp: string }>;
  semantic: Array<{ fact: string; provenance: MemoryProvenance }>;
  userProfile: Record<string, any>;
  conversationalSummary?: string;
}

export interface JourneySnapshot {
  journeyId: string;
  currentStage: string;
  objectives: string[];
  allowedTransitions: string[];
}

export interface ConversationContext {
  // 1. Cognitive Packs
  identity: IdentityPack;
  soul: SoulPack;
  policy: PolicyPack;
  knowledge: KnowledgeSnapshot;
  memory: MemorySnapshot;
  journey: JourneySnapshot;

  // 2. Base Resolution Data
  channel: {
    type: string;
    bindingId: string;
  };
  actor: {
    externalId: string;
  };
  organization: {
    organizationId: string;
    projectId?: string;
  };
  conversation: {
    conversationId: string;
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  };
}
