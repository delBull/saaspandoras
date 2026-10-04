/**
 * 📜 Pandora's Academy — Certification Policy
 * apps/dashboard/src/lib/pandoras/core/domains/academy/certification/certification-policy.ts
 *
 * Defines the strict, deterministic conditions required for certification:
 * 1. Overall Readiness Score >= Program Passing Score (Default 80%).
 * 2. Zero Critical Fatal Failures across all modules.
 * 3. Every individual module score >= 70%.
 * 4. Entity Separation & Risk Management Competency >= 75%.
 */

import { AssessmentAttemptResult } from '../types';

export interface CertificationDecision {
  certified: boolean;
  decisionReason: string;
  recommendedAction: 'EMIT_CERTIFICATE' | 'RETAKE_ASSESSMENT' | 'REMEDIAL_COACHING';
}

export class CertificationPolicy {
  private static readonly MIN_OVERALL_SCORE = 80;
  private static readonly MIN_MODULE_SCORE = 70;
  private static readonly MIN_CORE_COMPETENCY = 75;

  /**
   * Evaluates if an attempt qualifies for institutional certification.
   */
  static evaluateCertification(attemptResult: AssessmentAttemptResult): CertificationDecision {
    // 1. Critical Failure Check
    if (attemptResult.criticalFailures && attemptResult.criticalFailures.length > 0) {
      return {
        certified: false,
        decisionReason: `Falla Fatal Crítica Detectada: ${attemptResult.criticalFailures.join('; ')}. No apto para la posición ejecutiva.`,
        recommendedAction: 'REMEDIAL_COACHING'
      };
    }

    // 2. Individual Module Scores Check
    for (const [moduleId, score] of Object.entries(attemptResult.moduleScores)) {
      if (score < this.MIN_MODULE_SCORE) {
        return {
          certified: false,
          decisionReason: `El puntaje en el módulo ${moduleId} (${score}%) está por debajo del umbral mínimo requerido (${this.MIN_MODULE_SCORE}%).`,
          recommendedAction: 'RETAKE_ASSESSMENT'
        };
      }
    }

    // 3. Core Competency Check (Entity Separation & Risk)
    if (attemptResult.crossCuttingCompetencies.entitySeparation < this.MIN_CORE_COMPETENCY) {
      return {
        certified: false,
        decisionReason: `La competencia de Blindaje y Separación de Entidades (${attemptResult.crossCuttingCompetencies.entitySeparation}%) no alcanza el mínimo de ${this.MIN_CORE_COMPETENCY}%.`,
        recommendedAction: 'RETAKE_ASSESSMENT'
      };
    }

    // 4. Overall Score Check
    if (attemptResult.overallReadinessScore < this.MIN_OVERALL_SCORE) {
      return {
        certified: false,
        decisionReason: `Puntaje global de preparación (${attemptResult.overallReadinessScore}%) inferior al umbral de aprobación (${this.MIN_OVERALL_SCORE}%).`,
        recommendedAction: 'RETAKE_ASSESSMENT'
      };
    }

    // Passed all institutional requirements!
    return {
      certified: true,
      decisionReason: `Aprobación con excelencia ejecutiva (${attemptResult.overallReadinessScore}%). Cumple con todos los estándares del IOM.`,
      recommendedAction: 'EMIT_CERTIFICATE'
    };
  }
}
