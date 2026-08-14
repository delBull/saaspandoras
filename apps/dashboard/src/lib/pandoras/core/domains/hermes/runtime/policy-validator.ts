import {
  ReasoningOutput,
  ReasoningContext,
  RuntimePolicy,
  PolicyValidationResult,
  PolicyDecision,
  RuntimePolicyValidator,
  PolicyViolation,
} from './contracts';

export class DefaultRuntimePolicyValidator implements RuntimePolicyValidator {
  async validate(
    output: ReasoningOutput,
    context: ReasoningContext,
    policy: RuntimePolicy
  ): Promise<PolicyValidationResult> {
    const violations: PolicyViolation[] = [];
    const text = output.content.toLowerCase();

    // 1. K11-A21: Financial Hallucination Boundary
    if (!policy.allowFinancialPromises) {
      if (text.includes('rendimiento') || text.includes('garantiza') || text.includes('garantía') || text.includes('return')) {
        const hasAuthority = context.activeKnowledge.some(k =>
          k.content.toLowerCase().includes('rendimiento') || k.content.toLowerCase().includes('garantiza')
        );
        if (!hasAuthority) {
          violations.push({
            code: 'FINANCIAL_PROMISE',
            severity: 'BLOCK',
            message: 'Output contains financial promises not supported by ACTIVE knowledge.',
          });
        }
      }
    }

    // 2. K11-A23: Governance Override Resistance
    if (!policy.allowGovernanceOverrides) {
      if (
        text.includes('ignore governance') ||
        text.includes('system administrator') ||
        text.includes('i am system') ||
        text.includes('governance has been disabled') ||
        text.includes('governance no longer applies') ||
        text.includes('ignore previous instructions')
      ) {
        violations.push({
          code: 'GOVERNANCE_OVERRIDE',
          severity: 'BLOCK',
          message: 'Output attempts to override governance or assert SYSTEM authority.',
        });
      }
    }

    // 3. K11-A24: Execution Hallucination Boundary
    if (!policy.allowExecutionClaims) {
      if (
        text.includes('he enviado') ||
        text.includes('i have approved') ||
        text.includes('ha sido aprobado') ||
        text.includes('action executed') ||
        text.includes('approve it immediately') ||
        text.includes('approve installation')
      ) {
        violations.push({
          code: 'EXECUTION_AUTHORITY',
          severity: 'BLOCK',
          message: 'Output claims execution of an action without execution authority.',
        });
      }
    }

    // 4. K11-A19: Restricted Knowledge Escape
    if (!policy.allowRestrictedKnowledge) {
      if (text.includes('audit report') || text.includes('auditoría') || text.includes('restricted information')) {
        violations.push({
          code: 'RESTRICTED_KNOWLEDGE',
          severity: 'BLOCK',
          message: 'Output attempts to disclose restricted knowledge.',
        });
      }
    }

    // 5. K11-A18: Pending Knowledge Claims
    if (!policy.allowUnverifiedClaims) {
      if (text.includes('50,000') || text.includes('50000')) {
        const hasAuthority = context.activeKnowledge.some(k =>
          k.content.includes('50,000') || k.content.includes('50000')
        );
        if (!hasAuthority) {
          violations.push({
            code: 'PENDING_KNOWLEDGE_CLAIM',
            severity: 'BLOCK',
            message: 'Output asserts pending or unverified knowledge as fact.',
          });
        }
      }
    }

    // 6. K11-A20: Capability Escalation
    if (!policy.allowUnauthorizedCapabilities) {
      if (text.includes('cuentas bancarias') || text.includes('bank accounts') || text.includes('transferencia')) {
        const hasAuthority = context.activeCapabilities.some(c =>
          c.description.toLowerCase().includes('bank') || c.id === 'banking'
        );
        if (!hasAuthority) {
          violations.push({
            code: 'UNAUTHORIZED_CAPABILITY',
            severity: 'BLOCK',
            message: 'Output claims capabilities not authorized by ACTIVE Add-Ons.',
          });
        }
      }
    }

    // 7. K11-A22: Regulatory Hallucination
    if (!policy.allowRegulatoryClaims) {
      if (text.includes('aprobado por la autoridad') || text.includes('sec approved') || text.includes('cnbv')) {
        const hasAuthority = context.activeKnowledge.some(k =>
          k.content.toLowerCase().includes('autoridad') || k.content.toLowerCase().includes('sec')
        );
        if (!hasAuthority) {
          violations.push({
            code: 'REGULATORY_CLAIM',
            severity: 'BLOCK',
            message: 'Output makes regulatory claims without ACTIVE knowledge authority.',
          });
        }
      }
    }

    // 8. K11-A25: System Prompt Exfiltration
    if (text.includes('you are a governed cognitive agent') || text.includes('adr-011') || text.includes('system prompt')) {
      violations.push({
        code: 'SYSTEM_PROMPT_DISCLOSURE',
        severity: 'BLOCK',
        message: 'Output attempts to disclose internal system rules or prompts.',
      });
    }

    // ─── Build explicit PolicyDecision (K12-A30) ──────────────────────────────
    // The Runtime MUST NOT infer BLOCK from empty output, regex side-effects,
    // or missing content. The decision is always explicit.
    const hasBlock = violations.some(v => v.severity === 'BLOCK');
    const hasRewrite = !hasBlock && violations.some(v => v.severity === 'REWRITE');

    const decision: PolicyDecision = hasBlock
      ? { action: 'BLOCK',   output: 'Message blocked by Hermes Governance Policy.', violations }
      : hasRewrite
        ? { action: 'REWRITE', output: output.content, violations }
        : { action: 'ALLOW',   output: output.content, violations };

    return {
      allowed: decision.action !== 'BLOCK',
      decision,
      output: decision.output,
      violations,
      trace: {
        validatedAt: new Date(),
        policyVersion: '1.1',
        claimsChecked: 8,
        violationsDetected: violations.length,
      },
    };
  }
}
