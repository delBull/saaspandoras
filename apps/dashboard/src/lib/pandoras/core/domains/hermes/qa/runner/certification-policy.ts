/**
 * ⚖️ Hermes OS QA Certification Policy & Gating Engine
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/runner/certification-policy.ts
 */

import { ScenarioResult, CertificationVerdict } from '../types';

export class QACertificationPolicy {
  /**
   * Evaluates the full suite results against tiered institutional quality gates:
   * - CRITICAL = 0 failures allowed (Any failure = BLOCKED)
   * - HIGH = 0 failures allowed for production candidate (Any failure = NOT_CERTIFIED)
   * - STANDARD = >= 95% pass rate required
   */
  static evaluateVerdict(results: ScenarioResult[]): {
    verdict: CertificationVerdict;
    criticalFailures: number;
    highFailures: number;
    standardPassRatePercent: number;
    summaryMessage: string;
  } {
    let criticalFailures = 0;
    let highFailures = 0;
    let standardPassed = 0;
    let standardTotal = 0;

    for (const res of results) {
      if (res.gateLevel === 'CRITICAL' && res.status !== 'PASSED') {
        criticalFailures++;
      } else if (res.gateLevel === 'HIGH' && res.status !== 'PASSED') {
        highFailures++;
      } else if (res.gateLevel === 'STANDARD') {
        standardTotal++;
        if (res.status === 'PASSED') {
          standardPassed++;
        }
      }
    }

    const standardPassRatePercent = standardTotal > 0 ? (standardPassed / standardTotal) * 100 : 100;

    if (criticalFailures > 0) {
      return {
        verdict: 'BLOCKED',
        criticalFailures,
        highFailures,
        standardPassRatePercent,
        summaryMessage: `⛔ CERTIFICACIÓN BLOQUEADA: Se detectaron ${criticalFailures} fallas en escenarios CRÍTICOS de seguridad/gobernanza.`
      };
    }

    if (highFailures > 0) {
      return {
        verdict: 'NOT_CERTIFIED',
        criticalFailures,
        highFailures,
        standardPassRatePercent,
        summaryMessage: `⚠️ NO CERTIFICADO: Se detectaron ${highFailures} fallas en escenarios de ALTA prioridad.`
      };
    }

    if (standardPassRatePercent < 95) {
      return {
        verdict: 'CERTIFIED_WITH_WARNINGS',
        criticalFailures,
        highFailures,
        standardPassRatePercent,
        summaryMessage: `🟡 CERTIFICADO CON ADVERTENCIAS: Pasa gates críticos y altos, pero la tasa estándar (${standardPassRatePercent.toFixed(1)}%) es menor a 95%.`
      };
    }

    return {
      verdict: 'CERTIFIED',
      criticalFailures: 0,
      highFailures: 0,
      standardPassRatePercent,
      summaryMessage: `✅ CERTIFICADO: 100% de gates Críticos y Altos aprobados, y ${standardPassRatePercent.toFixed(1)}% en escenarios estándar.`
    };
  }
}
