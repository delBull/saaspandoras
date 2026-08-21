/**
 * 🧪 Hermes OS QA & Behavior Certification Matrix — Contracts & Types
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/types.ts
 */

export type ScenarioGateLevel = 'CRITICAL' | 'HIGH' | 'STANDARD';
export type RunnerExecutionMode = 'MOCK' | 'INTEGRATION' | 'CERTIFICATION';
export type ScenarioExecutionStatus = 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
export type CertificationVerdict = 'CERTIFIED' | 'CERTIFIED_WITH_WARNINGS' | 'NOT_CERTIFIED' | 'BLOCKED';

export interface TurnDialogue {
  role: 'USER' | 'SYSTEM';
  content: string;
  metadata?: {
    channel?: 'whatsapp' | 'telegram' | 'web' | 'portal';
    senderPhone?: string;
    senderTelegramId?: string;
    senderWallet?: string;
    claimedRole?: string;
    buttonCallbackId?: string;
  };
}

export interface DeterministicAssertion {
  type: 'EVENT_EMITTED' | 'MEMORY_STORED' | 'NO_ACTION' | 'TASK_COUNT' | 'TENANT_SCOPE' | 'NO_SECRET_LEAK';
  expectedValue: any;
  description: string;
}

export interface SemanticAssertion {
  type: 'CONTAINS_FACT' | 'ACKNOWLEDGES_UNCERTAINTY' | 'ADDRESSES_OBJECTION' | 'POLITE_REFUSAL' | 'LANGUAGE_ADAPTATION';
  criteria: string;
  description: string;
}

export interface PolicyAssertion {
  type: 'NO_FINANCIAL_PROMISE' | 'NO_CREDENTIAL_DISCLOSURE' | 'NO_CROSS_TENANT_CONTAMINATION' | 'NO_UNAUTHORIZED_ACTION';
  description: string;
}

export interface QAScenario {
  id: string; // 'E01', 'E02', ..., 'E34'
  title: string;
  category: 'GOVERNANCE' | 'MEMORY' | 'OBJECTIONS' | 'FOLLOW_UP' | 'INTERACTIVE' | 'FULL_FUNNEL' | 'SECURITY';
  gateLevel: ScenarioGateLevel;
  description: string;
  initialContext: {
    tenantId: string;
    tenantName: string;
    activeKnowledgeKeys?: string[];
    pendingKnowledgeKeys?: string[];
    userProfile?: Record<string, any>;
    existingHistory?: TurnDialogue[];
  };
  dialogueSequence: TurnDialogue[];
  deterministicAssertions: DeterministicAssertion[];
  semanticAssertions: SemanticAssertion[];
  policyAssertions: PolicyAssertion[];
}

export interface AssertionResult {
  assertionType: string;
  description: string;
  passed: boolean;
  actual?: any;
  error?: string;
}

export interface ScenarioResult {
  scenarioId: string;
  title: string;
  gateLevel: ScenarioGateLevel;
  category: string;
  status: ScenarioExecutionStatus;
  latencyMs: number;
  deterministicResults: AssertionResult[];
  semanticResults: AssertionResult[];
  policyResults: AssertionResult[];
  traceId?: string;
  failureReason?: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  passed: number;
  failed: number;
  passRatePercent: number;
}

export interface QACertificationReport {
  suiteVersion: string;
  runtimeVersion: string;
  evaluatorVersion: string;
  executionMode: RunnerExecutionMode;
  model: string;
  systemPromptHash: string;
  policyVersion: string;
  knowledgeSnapshotHash: string;
  gitCommit: string;
  timestamp: string;
  
  verdict: CertificationVerdict;
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  overallPassRatePercent: number;

  criticalFailuresCount: number;
  highFailuresCount: number;
  standardPassRatePercent: number;

  categoryBreakdown: Record<string, CategorySummary>;
  results: ScenarioResult[];
  summaryMessage: string;
}
