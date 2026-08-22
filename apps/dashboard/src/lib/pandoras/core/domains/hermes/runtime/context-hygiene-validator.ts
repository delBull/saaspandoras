/**
 * 🛡️ Pre-LLM Context Hygiene Validator (Phase 2.2 / 3.0 Gate T12)
 *
 * Inspects and sanitizes the ReasoningContext BEFORE it is compiled into a prompt
 * or transmitted to the LLM ReasoningProvider.
 *
 * Enforces:
 * 1. Zero-Secret Invariant: No raw private keys, API secrets, or DB strings in prompt context.
 * 2. Classification Invariant: No SECRET or INTERNAL_OPERATIONAL facts in tenant contexts.
 * 3. Status Invariant: Every fact entering the LLM MUST be explicitly 'ACTIVE'.
 */

import { ReasoningContext, GovernedKnowledgeFact, PolicyViolation } from './contracts';

export interface ContextHygieneOptions {
  /**
   * When true, allows INTERNAL_OPERATIONAL facts for cognitive reasoning (USE),
   * while SECRET raw keys remain unconditionally blocked.
   */
  allowInternalOperationalUse?: boolean;
}

export interface ContextHygieneResult {
  valid: boolean;
  violations: PolicyViolation[];
  sanitizedContext: ReasoningContext;
}

export class ContextHygieneValidator {
  private static readonly SECRET_REGEX = /(?:0x[a-fA-F0-9]{64}|sk_(?:live|test)_[a-zA-Z0-9]{12,}|postgresql:\/\/[^\s]+|password\s*=\s*[^\s]+)/i;

  public static validate(
    context: ReasoningContext,
    options: ContextHygieneOptions = {}
  ): ContextHygieneResult {
    const violations: PolicyViolation[] = [];
    const sanitizedFacts: GovernedKnowledgeFact[] = [];

    // 1. Inspect System Rules
    for (const rule of context.systemRules) {
      if (this.SECRET_REGEX.test(rule)) {
        violations.push({
          code: 'SECRET_DISCLOSURE',
          severity: 'BLOCK',
          message: 'Pre-LLM Hygiene: System rule contains raw cryptographic or database secret.',
          source: 'systemRules'
        });
      }
    }

    // 2. Inspect Active Knowledge Facts
    for (const fact of context.activeKnowledge) {
      let factRejected = false;

      // Status Hygiene
      if (fact.status !== 'ACTIVE') {
        violations.push({
          code: 'PENDING_KNOWLEDGE_CLAIM',
          severity: 'REDACT',
          message: `Pre-LLM Hygiene: Fact '${fact.key}' is not ACTIVE (status: ${fact.status}).`,
          source: fact.id
        });
        factRejected = true;
      }

      // Zero-Secret Invariant: SECRET classification or raw keys are UNCONDITIONALLY BLOCKED
      if (fact.classification === 'SECRET' || this.SECRET_REGEX.test(fact.content)) {
        violations.push({
          code: 'SECRET_DISCLOSURE',
          severity: 'BLOCK',
          message: `Pre-LLM Hygiene: Fact '${fact.key}' contains forbidden SECRET classification or raw keys.`,
          source: fact.id
        });
        factRejected = true;
      }

      // KNOW vs USE vs DISCLOSE: INTERNAL_OPERATIONAL permitted only if explicitly authorized for USE
      if (fact.classification === 'INTERNAL_OPERATIONAL') {
        if (!options.allowInternalOperationalUse) {
          violations.push({
            code: 'INTERNAL_OPERATIONAL_DISCLOSURE',
            severity: 'BLOCK',
            message: `Pre-LLM Hygiene: Fact '${fact.key}' contains INTERNAL_OPERATIONAL holding knowledge not authorized for tenant reasoning context.`,
            source: fact.id
          });
          factRejected = true;
        }
      }

      if (!factRejected) {
        sanitizedFacts.push(fact);
      }
    }

    const sanitizedContext: ReasoningContext = {
      ...context,
      activeKnowledge: sanitizedFacts
    };

    return {
      valid: violations.length === 0,
      violations,
      sanitizedContext
    };
  }
}
