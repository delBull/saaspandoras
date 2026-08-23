/**
 * 🛡️ S'Narai Response Policy Gate (Milestone K25 / K25.5 Generalization)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/policy/snarai-response-policy-gate.ts
 *
 * Canonical S'Narai implementation backed by the Generalized TenantResponsePolicyGate.
 */

import { TenantResponsePolicyGate, PolicyEvaluationResult } from './tenant-response-policy';

export type SnaraiPolicyEvaluationResult = PolicyEvaluationResult;

export class SnaraiResponsePolicyGate {
  /**
   * Evaluates and sanitizes output specifically for S'Narai tenant
   */
  public static evaluate(content: string, userQuery?: string): SnaraiPolicyEvaluationResult {
    return TenantResponsePolicyGate.evaluate(content, 'snarai');
  }

  /**
   * Normalizes terminology to canonical S'Narai vocabulary
   */
  public static normalizeTerminology(text: string): string {
    return TenantResponsePolicyGate.applyTerminology(text, {
      '\\bCPs\\b': 'Títulos de Participación',
      '\\bCP\\b': 'Título de Participación',
      'Propiedad Fraccionada': 'Inversión Fraccionada',
      'rentas? hoteleras?': 'rentas vacacionales',
    });
  }
}
