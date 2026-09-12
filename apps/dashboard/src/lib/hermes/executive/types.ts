/**
 * 🏛️ Hermes Executive Sovereign Plane — Core Types & Capabilities
 * apps/dashboard/src/lib/hermes/executive/types.ts
 *
 * Implements granular Founder Capabilities (Role ≠ Capability),
 * Executive Directives (Founder Memory), and Executive Briefings (Tier 0 Intelligence).
 */

export type FounderCapability =
  | 'FOUNDER_INTELLIGENCE'     // Tier 0: Daily briefings, synthesis, anomaly detection, cross-system reasoning
  | 'FOUNDER_READ'             // Tier 1: Deep inspection of tenants, logs, schema parity, code, CRM leads
  | 'FOUNDER_OPERATOR'         // Tier 2: RBAC promotions/demotions, tenant prompt tuning, quota adjustments
  | 'FOUNDER_CODE_EXECUTION'   // Tier 3 (Code): Sandboxed diagnosis, test validation, patch proposal for approval
  | 'FOUNDER_FINANCIAL';       // Tier 3 (Finance): Pre-flight payload builder for EIP-712 / SIWE Founder Signature

export const ALL_FOUNDER_CAPABILITIES: FounderCapability[] = [
  'FOUNDER_INTELLIGENCE',
  'FOUNDER_READ',
  'FOUNDER_OPERATOR',
  'FOUNDER_CODE_EXECUTION',
  'FOUNDER_FINANCIAL',
];

export type DirectiveCategory =
  | 'PRODUCT_POLICY'
  | 'INFRASTRUCTURE_PREFERENCE'
  | 'VENDOR_RESTRICTION'
  | 'TENANT_OVERRIDE'
  | 'GENERAL_STRATEGY';

export interface ExecutiveDirective {
  id: string;
  text: string;
  category: DirectiveCategory;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy: string;
  channel: 'telegram' | 'whatsapp' | 'nexus' | 'web';
  createdAt: string;
  authoritative: boolean;
  metadata?: Record<string, any>;
}

export interface ExecutiveBriefing {
  generatedAt: string;
  headline: string;
  attentionItems: string[];
  recentLeadsSummary: {
    total24h: number;
    highIntentCount: number;
    sampleNames: string[];
  };
  calendarSummary: {
    appointmentsToday: number;
    nextSlots: string[];
  };
  tenantsPulse: {
    activeTenantsCount: number;
    items: { slug: string; name: string; status: string; note: string }[];
  };
  systemHealth: {
    status: 'HEALTHY' | 'WARNING' | 'ALERT';
    recentErrorsCount: number;
    note: string;
  };
  activeDirectivesCount: number;
  rawMarkdown: string;
}

// ---------------------------------------------------------------------------
// Tier 2: Multi-Step Planner & Operational Execution Contracts
// ---------------------------------------------------------------------------

export type ExecutiveActionType =
  | 'TOPUP_CREDITS'           // Deposit compute credits into hermes_tenant_credits
  | 'SET_COLLABORATOR_ROLE'   // Promote, demote or grant permissions in nexus_collaborators
  | 'INVITE_COLLABORATOR'     // Provision and invite new collaborator to Nexus
  | 'SET_TENANT_STATUS';      // Toggle tenant active/paused status in projects

export interface ExecutivePlan {
  id: string;
  action: ExecutiveActionType;
  title: string;
  description: string;
  target: string;
  payload: Record<string, any>;
  blastRadius: 'LOW' | 'MEDIUM' | 'HIGH';
  requiredCapability: FounderCapability;
  status: 'PENDING_CONFIRMATION' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  createdAt: number;
  expiresAt: number; // TTL (e.g. 15 minutes)
  executedAt?: number;
  executionResult?: {
    success: boolean;
    message: string;
    data?: any;
  };
}

export type ParsedExecutiveIntent =
  | { type: 'CONFIRMATION'; raw: string }
  | { type: 'CANCELLATION'; raw: string }
  | { type: 'CAPABILITIES_HELP'; raw: string }
  | { type: 'FOUNDER_IDENTITY_QUERY'; raw: string }
  | {
      type: 'OPERATIONAL_ACTION';
      action: ExecutiveActionType;
      target: string;
      payload: Record<string, any>;
      title: string;
      description: string;
      blastRadius: 'LOW' | 'MEDIUM' | 'HIGH';
    }
  | {
      type: 'FINANCIAL_PROPOSAL';
      action: 'USDC_DISTRIBUTION' | 'TREASURY_TRANSFER';
      tenantId: string;
      recipient: string;
      amountUsd: number;
      purpose: string;
    }
  | {
      type: 'FINANCIAL_SIGNATURE';
      proposalId: string;
      signature: string;
    }
  | {
      type: 'CODE_DIAGNOSIS';
      rawError: string;
    }
  | {
      type: 'CODE_APPROVAL';
      proposalId: string;
    }
  | { type: 'NONE' };

