/**
 * ⚖️ Pandora's Academy — Deterministic Rubric Engine
 * apps/dashboard/src/lib/pandoras/core/domains/academy/assessment/rubric-engine.ts
 *
 * Core Principle: LLM (Hermes) proposes evaluation, but Rubric Engine is the deterministic authority.
 *
 * Responsibilities:
 * 1. Validates Hermes evaluation proposal against defined rubric criteria limits.
 * 2. Checks for critical fatal failures (any violation triggers instant failure).
 * 3. Calculates deterministic module scores and cross-cutting competency matrix.
 * 4. Determines whether the candidate passes or fails based on institutional policy.
 */

import {
  AcademyAssessment,
  HermesEvaluationProposal,
  AssessmentScoreResult,
  CrossCuttingCompetencyScores
} from '../types';

export class RubricEngine {
  /**
   * Deterministically evaluates an assessment score from Hermes's proposal.
   */
  static evaluateAssessment(
    assessment: AcademyAssessment,
    proposal: HermesEvaluationProposal
  ): AssessmentScoreResult {
    let rawScore = 0;
    let maxPossibleScore = 0;

    // 1. Calculate score strictly based on rubric criteria weights
    for (const criterion of assessment.rubricCriteria) {
      maxPossibleScore += criterion.maxScore;
      const proposedCriterionScore = proposal.criterionScores[criterion.id] ?? 0;
      // Clamp between 0 and criterion.maxScore
      const clampedScore = Math.max(0, Math.min(criterion.maxScore, proposedCriterionScore));
      rawScore += clampedScore;
    }

    // Normalized to 0 - 100
    const normalizedScore = maxPossibleScore > 0 
      ? Math.round((rawScore / maxPossibleScore) * 100)
      : Math.min(100, Math.max(0, proposal.proposedScore));

    // 2. Critical Failure Check (Fatal Flaw Rule)
    const hasCriticalFailure = (proposal.detectedCriticalFailures && proposal.detectedCriticalFailures.length > 0);
    const criticalFailureReason = hasCriticalFailure 
      ? proposal.detectedCriticalFailures.join(' | ') 
      : undefined;

    // If critical failure is present, score is capped and failed unconditionally
    const calculatedScore = hasCriticalFailure ? Math.min(normalizedScore, 40) : normalizedScore;
    const passed = !hasCriticalFailure && (calculatedScore >= assessment.passingThreshold);

    // 3. Normalize Cross-Cutting Competencies
    const competencyScores: CrossCuttingCompetencyScores = {
      riskManagement: this.clamp(proposal.competencyAssessment?.riskManagement ?? normalizedScore),
      decisionMaking: this.clamp(proposal.competencyAssessment?.decisionMaking ?? normalizedScore),
      escalationProtocol: this.clamp(proposal.competencyAssessment?.escalationProtocol ?? normalizedScore),
      entitySeparation: hasCriticalFailure && criticalFailureReason?.toLowerCase().includes('matriz') 
        ? 20 
        : this.clamp(proposal.competencyAssessment?.entitySeparation ?? normalizedScore),
      authorizationRigor: this.clamp(proposal.competencyAssessment?.authorizationRigor ?? normalizedScore),
      auditability: this.clamp(proposal.competencyAssessment?.auditability ?? normalizedScore),
      humanHandoff: this.clamp(proposal.competencyAssessment?.humanHandoff ?? normalizedScore),
    };

    return {
      assessmentId: assessment.id,
      rawAiFeedback: proposal.feedback,
      aiProposedScore: proposal.proposedScore,
      calculatedScore,
      competencyScores,
      hasCriticalFailure,
      criticalFailureReason,
      passed
    };
  }

  /**
   * Calculates overall readiness score across multiple module scores.
   */
  static calculateOverallReadiness(
    moduleScores: Record<string, number>,
    moduleWeights: Record<string, number>
  ): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [moduleId, score] of Object.entries(moduleScores)) {
      const weight = moduleWeights[moduleId] ?? 25;
      totalWeightedScore += score * (weight / 100);
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0;
    return Math.round(totalWeightedScore * (100 / totalWeight));
  }

  /**
   * Aggregates cross-cutting competencies across multiple evaluated assessments.
   */
  static aggregateCompetencies(
    scoresList: AssessmentScoreResult[]
  ): CrossCuttingCompetencyScores {
    if (scoresList.length === 0) {
      return {
        riskManagement: 0,
        decisionMaking: 0,
        escalationProtocol: 0,
        entitySeparation: 0,
        authorizationRigor: 0,
        auditability: 0,
        humanHandoff: 0,
      };
    }

    const sum = scoresList.reduce((acc, curr) => ({
      riskManagement: acc.riskManagement + curr.competencyScores.riskManagement,
      decisionMaking: acc.decisionMaking + curr.competencyScores.decisionMaking,
      escalationProtocol: acc.escalationProtocol + curr.competencyScores.escalationProtocol,
      entitySeparation: acc.entitySeparation + curr.competencyScores.entitySeparation,
      authorizationRigor: acc.authorizationRigor + curr.competencyScores.authorizationRigor,
      auditability: acc.auditability + curr.competencyScores.auditability,
      humanHandoff: acc.humanHandoff + curr.competencyScores.humanHandoff,
    }), {
      riskManagement: 0,
      decisionMaking: 0,
      escalationProtocol: 0,
      entitySeparation: 0,
      authorizationRigor: 0,
      auditability: 0,
      humanHandoff: 0,
    });

    const count = scoresList.length;
    return {
      riskManagement: Math.round(sum.riskManagement / count),
      decisionMaking: Math.round(sum.decisionMaking / count),
      escalationProtocol: Math.round(sum.escalationProtocol / count),
      entitySeparation: Math.round(sum.entitySeparation / count),
      authorizationRigor: Math.round(sum.authorizationRigor / count),
      auditability: Math.round(sum.auditability / count),
      humanHandoff: Math.round(sum.humanHandoff / count),
    };
  }

  private static clamp(val: number): number {
    return Math.max(0, Math.min(100, Math.round(val)));
  }
}
