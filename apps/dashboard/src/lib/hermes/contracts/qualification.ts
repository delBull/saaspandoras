/**
 * Hermes Revenue Closer — Qualification Contracts
 * src/lib/hermes/contracts/qualification.ts
 *
 * Domain-agnostic qualification lifecycle and scoring contracts.
 * Strictly decoupled from vertical semantics (no unitId, propertyType, etc.).
 */

export type QualificationStage =
  | 'ANONYMOUS'
  | 'EXPLORING'
  | 'ENGAGED'
  | 'HIGH_INTENT'
  | 'READY_TO_BOOK'
  | 'HANDOFF_PENDING'
  | 'DISQUALIFIED';

export type BudgetTier = 'TIER_ENTRY' | 'TIER_MID' | 'TIER_PREMIUM' | 'TIER_INSTITUTIONAL';

export type DecisionRole = 'SOLE_DECISION_MAKER' | 'PARTNER_INVOLVED' | 'ADVISOR_RESEARCHER';

export interface QualificationContext {
  stage: QualificationStage;
  budgetTier?: BudgetTier;
  estimatedBudgetUsd?: number;
  purchaseHorizonDays?: number;
  decisionRole?: DecisionRole;
  confidenceScore: number; // 0.0 to 1.0
  identifiedNeeds: string[];
  keyObjectionsDetected: string[];
  evaluatedAt: string;
}

export interface QualificationEvaluation {
  leadId: string;
  previousStage: QualificationStage;
  newStage: QualificationStage;
  scoreDelta: number;
  totalScore: number;
  confidence: number;
  context: QualificationContext;
  shouldEscalate: boolean;
  reason: string;
}
