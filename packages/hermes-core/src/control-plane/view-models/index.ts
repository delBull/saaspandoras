export interface OrganizationOverviewView {
  organizationId: string;
  name: string;
  metrics: {
    activeGoals: number;
    activeMissions: number;
    pendingDecisions: number;
    installedPacks: number;
  };
  currentStrategicActivity?: {
    missionId: string;
    missionName: string;
    phase: string;
    progressPercentage: number;
    nextAction: string;
    status: 'Operational' | 'Awaiting Governance' | 'Blocked';
  };
  systemStatus?: 'NOT_CONFIGURED' | 'READY' | 'ATTENTION_REQUIRED';
  journeyStatus?: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'BLOCKED' | 'COMPLETED';
}

export interface MissionControlView {
  missionId: string;
  goalName: string;
  phase: string;
  pack: string;
  milestones: Array<{
    name: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  nextStrategicDecision?: {
    id: string;
    decision: string;
    reasonSummary: string;
    factors: Array<{
      type: string;
      source: string;
      value: string | boolean | number | unknown;
      status: 'COMPLETED' | 'ACTIVE' | 'INCOMPLETE' | 'AVAILABLE';
    }>;
  };
}

export interface GovernanceQueueView {
  organizationId: string;
  pendingIntents: Array<{
    intentId: string;
    missionId: string;
    missionName: string;
    strategyDecision: string;
    reasonSummary: string;
    intentType: string; // The proposed operational workflow (e.g. marketing.lead_generation.v1)
    budget?: string; // Derived from constraints
    authorityRequired?: string; // e.g. "Founder approval"
    consequence?: string; // e.g. "Execution OS will receive marketing.lead_generation.v1"
    pack: string;
    status: string;
  }>;
}

export interface ActivityAuditItemView {
  id: string;
  timestamp: Date;
  type: 'MISSION_EVENT' | 'STRATEGY_DECISION' | 'OPERATIONAL_INTENT' | 'GOVERNANCE' | 'EXECUTION';
  title: string;
  description: string;
  actor?: string;
  details?: Record<string, any>;
}

export interface ActivityAuditView {
  organizationId: string;
  missionId?: string;
  timeline: ActivityAuditItemView[];
}

export interface KnowledgeSourceView {
  id: string;
  title: string;
  type: 'DOCUMENT' | 'URL' | 'FAQ' | 'BUSINESS_INFO' | 'BUSINESS_RULE';
  status: 'CREATED' | 'PROCESSING' | 'READY' | 'FAILED';
  version: number;
  lastUpdated: Date;
  lastProcessedAt: Date | null;
  chunkCount?: number;
  canRetry: boolean;
}
