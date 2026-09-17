export type IntelligenceClassification = 'FACT' | 'OBSERVATION' | 'INFERENCE';
export type IntelligenceSensitivity = 'NORMAL' | 'RESTRICTED';

export interface IntelligenceFact {
  id: string;
  category: 'identity' | 'journey' | 'behavior' | 'objection' | 'commercial';
  value: unknown;
  source: string;
  observedAt: Date;
  confidence: number;
  classification: IntelligenceClassification;
  sensitivity: IntelligenceSensitivity;
}

export interface ProspectIdentity {
  marketingIdentityId: string;
  canonicalId: string;
  email?: string;
  name?: string;
  wallet?: string;
  resolvedAt: Date;
}

export interface ProspectJourneyState {
  crmStage: string;
  academyStatus?: string;
  activeJourneyId?: string;
  currentStageId?: string;
  daysInStage: number;
}

export interface AssessmentSummary {
  programId: string;
  readinessScore: number;
  primaryGaps: string[];
  recommendedModules: string[];
  lastEvaluatedAt: Date;
}

export interface ProspectSignal {
  type: 'urgency' | 'price_sensitivity' | 'intent' | 'engagement';
  level: 'high' | 'medium' | 'low';
  context: string;
}

export interface ProspectObjection {
  category: 'price' | 'trust' | 'regulation' | 'timing' | 'other';
  description: string;
  status: 'active' | 'mitigated';
}

export interface ProspectStrategy {
  nextBestAction: 'QUALIFY' | 'BOOK_MEETING' | 'SEND_CASE_STUDY' | 'NURTURE' | 'WAIT';
  authorizedTopics: string[];
  restrictedTopics: string[];
  commercialObjective: string;
}

/**
 * The consolidated view of a prospect across all Pandoras verticals.
 * This is injected into the ExecutionManifest.
 */
export interface ProspectContext {
  identity: ProspectIdentity;
  journey: ProspectJourneyState;
  assessment?: AssessmentSummary;
  signals: ProspectSignal[];
  objections: ProspectObjection[];
  facts: IntelligenceFact[];
  strategy?: ProspectStrategy;
}
