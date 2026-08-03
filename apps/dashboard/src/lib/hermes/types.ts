/**
 * 🏛️ HERMES ENGINE - TYPES & DOMAIN SPECIFICATION
 * Core Intelligence Engine (Phase 1)
 */

export type SalesState = 
  | 'NEW' 
  | 'CONTACTED' 
  | 'ENGAGED' 
  | 'QUALIFIED' 
  | 'NEGOTIATION' 
  | 'READY' 
  | 'CLOSED' 
  | 'ADVOCATE';

export interface CustomerMemory {
  leadId: string;
  email?: string;
  phone?: string;
  name?: string;
  acquisitionChannel?: string;
  preferredChannel?: 'telegram' | 'whatsapp' | 'voice' | 'email' | 'web';
  walletAddress?: string;
  budgetEstimateUsd?: number;
  expressedIntent?: 'explore' | 'invest' | 'whitelist' | 'b2b';
  concernsAndObjections: Array<{
    category: 'legal' | 'security' | 'financial' | 'timing' | 'technical';
    description: string;
    resolved: boolean;
    timestamp: number;
  }>;
  topicsDiscussed: string[];
  documentsSent: string[];
  keyMilestones?: Array<{
    event: string;
    timestamp: number;
  }>;
  customData?: Record<string, any>;
}

export interface KnowledgePack {
  id: string;
  name: string;
  version: string;
  industry: 'real_estate_tokenized' | 'crypto_fintech' | 'saas_b2b' | 'generic' | string;
  systemInstructions: string;
  publicKnowledge: {
    title: string;
    summary: string;
    pricingDetails?: Record<string, any>;
    faqs: Array<{ question: string; answer: string }>;
  };
  objectionRules: Array<{
    triggerPattern: string;
    objectionCategory: 'security' | 'legal' | 'financial' | 'timing' | 'pricing' | 'technical';
    recommendedResponse: string;
    suggestedDocument?: string;
  }>;
  salesPitch: string;
}

export interface HermesMission {
  id: string;
  leadId: string;
  goal: 'QUALIFY_LEAD' | 'SEND_DOSSIER' | 'HANDLE_OBJECTION' | 'SCHEDULE_CALL' | 'CLOSE_SALE' | 'REENGAGE';
  targetState: SalesState;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ESCALATED_HUMAN';
  createdAt: number;
  scheduledFor?: number;
  completedAt?: number;
  steps: Array<{
    stepName: string;
    status: 'PENDING' | 'EXECUTED' | 'SKIPPED';
    result?: string;
    executedAt?: number;
  }>;
  logs: string[];
}
