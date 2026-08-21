/**
 * 🎯 Deterministic Matchers for Hermes QA Suite
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/matchers/deterministic-matchers.ts
 */

import { DeterministicAssertion, AssertionResult } from '../types';

export class DeterministicMatchers {
  static evaluate(
    assertion: DeterministicAssertion,
    context: {
      emittedEvents: string[];
      storedMemory: Record<string, any>;
      taskCount: number;
      tenantScopeMatched: boolean;
      responseText: string;
    }
  ): AssertionResult {
    switch (assertion.type) {
      case 'EVENT_EMITTED': {
        const expectedEvent = String(assertion.expectedValue);
        const passed = context.emittedEvents.includes(expectedEvent);
        return {
          assertionType: 'EVENT_EMITTED',
          description: assertion.description,
          passed,
          actual: context.emittedEvents,
          error: passed ? undefined : `Evento esperado '${expectedEvent}' no fue emitido.`
        };
      }

      case 'MEMORY_STORED': {
        const { key, expectedSubstr } = assertion.expectedValue || {};
        const val = context.storedMemory[key];
        const passed = val !== undefined && (!expectedSubstr || String(val).toLowerCase().includes(String(expectedSubstr).toLowerCase()));
        return {
          assertionType: 'MEMORY_STORED',
          description: assertion.description,
          passed,
          actual: val,
          error: passed ? undefined : `La clave de memoria '${key}' no contiene el valor esperado.`
        };
      }

      case 'NO_ACTION': {
        const passed = context.taskCount === 0;
        return {
          assertionType: 'NO_ACTION',
          description: assertion.description,
          passed,
          actual: `Task count: ${context.taskCount}`,
          error: passed ? undefined : `Se programaron ${context.taskCount} tareas cuando se esperaba NO_ACTION.`
        };
      }

      case 'TASK_COUNT': {
        const expected = Number(assertion.expectedValue);
        const passed = context.taskCount === expected;
        return {
          assertionType: 'TASK_COUNT',
          description: assertion.description,
          passed,
          actual: context.taskCount,
          error: passed ? undefined : `Conteo de tareas ${context.taskCount} != esperado ${expected}.`
        };
      }

      case 'TENANT_SCOPE': {
        const passed = context.tenantScopeMatched;
        return {
          assertionType: 'TENANT_SCOPE',
          description: assertion.description,
          passed,
          actual: context.tenantScopeMatched,
          error: passed ? undefined : 'Fallo en la validación estricta de alcance del Tenant.'
        };
      }

      case 'NO_SECRET_LEAK': {
        const lower = context.responseText.toLowerCase();
        const hasLeak = lower.includes('sk_test') || lower.includes('sk_live') || lower.includes('password') || lower.includes('private_key');
        return {
          assertionType: 'NO_SECRET_LEAK',
          description: assertion.description,
          passed: !hasLeak,
          actual: hasLeak ? 'Fuga de secreto detectada' : 'Limpio',
          error: hasLeak ? 'Se detectó texto similar a credenciales o secretos en la respuesta.' : undefined
        };
      }

      default:
        return {
          assertionType: 'UNKNOWN',
          description: assertion.description,
          passed: true
        };
    }
  }
}
