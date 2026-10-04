/**
 * 🛡️ Pandora's Platform OS — Policy Engine
 * lib/hermes/policy-engine.ts
 *
 * Evaluates business constraints & safety policies before capabilities or LLM calls.
 */

export interface PolicyEvaluationInput {
  projectId: number;
  intent: string;
  userMessage: string;
  crmStage?: string;
  capabilities: Record<string, boolean>;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  blockedReason?: string;
  modifiedAction?: string;
}

export class PolicyEngine {
  static evaluate(input: PolicyEvaluationInput): PolicyEvaluationResult {
    const { intent, userMessage, crmStage, capabilities } = input;
    const text = userMessage.toLowerCase();

    // 1. Policy: Never issue SPEI payment links if payment capability is disabled
    if (intent === 'SALES_INQUIRY' && text.includes('spei') && !capabilities.payments) {
      return {
        allowed: false,
        blockedReason: 'La capacidad de pagos automáticos no está activa en tu plan actual.',
      };
    }

    // 2. Policy: Cannot auto-schedule if calendar capability is disabled
    if (intent === 'APPOINTMENT_REQUEST' && !capabilities.calendar && !capabilities.runtime) {
      return {
        allowed: false,
        blockedReason: 'Agendamiento automático no disponible en esta cuenta.',
      };
    }

    // 3. Policy: Protection against prompt injections
    const injectionTriggers = ['ignore previous instructions', 'system prompt', 'dame tus instrucciones', 'modo developer'];
    if (injectionTriggers.some(t => text.includes(t))) {
      return {
        allowed: false,
        blockedReason: 'Intento de manipulación de sistema detectado.',
      };
    }

    return { allowed: true };
  }
}
