/**
 * 🎯 Pandora's Academy — Assessment Engine
 * apps/dashboard/src/lib/pandoras/core/domains/academy/assessment/assessment-engine.ts
 *
 * Orchestrator combining:
 * 1. Knowledge Snapshot freezing
 * 2. Candidate response handling
 * 3. Hermes AI proposal generation
 * 4. Deterministic Rubric Engine scoring
 * 5. Certification Policy decision
 */

import {
  AcademyProgram,
  AssessmentScoreResult,
  AssessmentAttemptResult,
  AcademyCertification
} from '../types';
import { COO_EXECUTIVE_PROGRAM } from '../curriculum/coo-program';
import { KnowledgeSnapshotManager } from '../snapshots/snapshot-manager';
import { HermesAcademyEvaluator } from './hermes-evaluator';
import { RubricEngine } from './rubric-engine';
import { CertificationPolicy } from '../certification/certification-policy';
import { CertificationService } from '../certification/certification-service';

export class AssessmentEngine {
  /**
   * Returns the official program curriculum.
   */
  static getProgram(programCode = 'COO_INTERNAL_V1'): AcademyProgram {
    if (programCode === 'COO_INTERNAL_V1') {
      return COO_EXECUTIVE_PROGRAM;
    }
    return COO_EXECUTIVE_PROGRAM;
  }

  /**
   * Initializes an assessment attempt by freezing a KnowledgeSnapshot.
   */
  static initializeAttempt(programCode = 'COO_INTERNAL_V1', candidateId: string) {
    const program = this.getProgram(programCode);
    const snapshot = KnowledgeSnapshotManager.createFullProgramSnapshot();
    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return {
      attemptId,
      program,
      candidateId,
      snapshot,
      status: 'IN_PROGRESS' as const,
      startedAt: new Date().toISOString()
    };
  }

  /**
   * Evaluates a single assessment question.
   */
  static async evaluateSingleAssessment(params: {
    assessmentId: string;
    candidateAnswer: string;
    snapshotId?: string;
  }): Promise<AssessmentScoreResult> {
    const program = COO_EXECUTIVE_PROGRAM;
    
    // Find assessment across all modules
    let targetAssessment = null;
    for (const mod of program.modules) {
      const found = mod.assessments.find(a => a.id === params.assessmentId);
      if (found) {
        targetAssessment = found;
        break;
      }
    }

    if (!targetAssessment) {
      throw new Error(`Assessment with ID ${params.assessmentId} not found.`);
    }

    const snapshot = KnowledgeSnapshotManager.createFullProgramSnapshot();

    // 1. Get Hermes AI evaluation proposal
    const proposal = await HermesAcademyEvaluator.evaluateAnswer({
      assessment: targetAssessment,
      snapshot,
      candidateAnswer: params.candidateAnswer
    });

    // 2. Compute deterministic score with RubricEngine
    return RubricEngine.evaluateAssessment(targetAssessment, proposal);
  }

  /**
   * Evaluates an entire completed exam and computes certification readiness.
   */
  static async evaluateFullAttempt(params: {
    attemptId: string;
    candidateId: string;
    candidateName?: string;
    programCode?: string;
    answers: Record<string, string>; // { [assessmentId]: answerText }
  }): Promise<{
    attemptResult: AssessmentAttemptResult;
    scores: AssessmentScoreResult[];
    certification?: AcademyCertification;
  }> {
    const program = this.getProgram(params.programCode);
    const snapshot = KnowledgeSnapshotManager.createFullProgramSnapshot();
    const scores: AssessmentScoreResult[] = [];
    const moduleScores: Record<string, number> = {};
    const moduleWeights: Record<string, number> = {};
    const allCriticalFailures: string[] = [];

    // Evaluate each module's assessments
    for (const mod of program.modules) {
      moduleWeights[mod.id] = mod.weightPercentage;
      const modAssessmentScores: number[] = [];

      for (const asm of mod.assessments) {
        const answer = params.answers[asm.id] || "No response provided.";
        
        // 1. Hermes AI proposal
        const proposal = await HermesAcademyEvaluator.evaluateAnswer({
          assessment: asm,
          snapshot,
          candidateAnswer: answer
        });

        // 2. Deterministic score
        const scoreResult = RubricEngine.evaluateAssessment(asm, proposal);
        scores.push(scoreResult);
        modAssessmentScores.push(scoreResult.calculatedScore);

        if (scoreResult.hasCriticalFailure && scoreResult.criticalFailureReason) {
          allCriticalFailures.push(`[${mod.title}] ${scoreResult.criticalFailureReason}`);
        }
      }

      // Average score for this module
      const modAvg = modAssessmentScores.length > 0
        ? Math.round(modAssessmentScores.reduce((a, b) => a + b, 0) / modAssessmentScores.length)
        : 0;
      moduleScores[mod.id] = modAvg;
    }

    // Calculate overall score & cross-cutting competencies
    const overallReadinessScore = RubricEngine.calculateOverallReadiness(moduleScores, moduleWeights);
    const crossCuttingCompetencies = RubricEngine.aggregateCompetencies(scores);

    const attemptResult: AssessmentAttemptResult = {
      attemptId: params.attemptId,
      programId: program.id,
      candidateId: params.candidateId,
      snapshotId: snapshot.id,
      status: allCriticalFailures.length > 0 || overallReadinessScore < program.passingScore ? 'FAILED' : 'PASSED',
      moduleScores,
      overallReadinessScore,
      crossCuttingCompetencies,
      criticalFailures: allCriticalFailures,
      certified: false,
      completedAt: new Date().toISOString()
    };

    // Evaluate Certification Policy
    const certDecision = CertificationPolicy.evaluateCertification(attemptResult);
    attemptResult.certified = certDecision.certified;

    let certification: AcademyCertification | undefined = undefined;
    if (certDecision.certified) {
      certification = CertificationService.issueCertification({
        programId: program.id,
        targetRole: program.targetRole,
        candidateId: params.candidateId,
        candidateName: params.candidateName,
        attemptResult
      });
      attemptResult.certificationId = certification.id;
    }

    return {
      attemptResult,
      scores,
      certification
    };
  }
}
