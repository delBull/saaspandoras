import { GovernancePolicy } from '../../pandoras/core/contracts/pack-contracts';

export interface PolicyViolation {
  rule: string;
  severity: 'block' | 'warn' | 'escalate';
  reason: string;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  violations: PolicyViolation[];
  finalText: string;
  action: 'send' | 'block' | 'escalate' | 'add_disclaimer';
}

/**
 * B9: PolicyEnforcer
 * 
 * Evaluates a proposed LLM response against the tenant's dynamic GovernancePolicy
 * (loaded from `policy_pack` in DB). This is the enforcement layer for the Zero-Code
 * Onboarding governance model — each tenant's rules are respected independently.
 */
export class PolicyEnforcer {
  
  static enforce(
    proposedText: string,
    policies: GovernancePolicy,
    context: { tenantId: string; channel: string }
  ): PolicyEvaluationResult {
    const violations: PolicyViolation[] = [];
    let finalText = proposedText;
    const lower = proposedText.toLowerCase();

    // --- Rule 1: Financial Advice ---
    if (policies.financialAdvice === 'forbidden') {
      const financialKeywords = ['guaranteed return', 'profit guarantee', 'investment guarantee', 'secure your gains', 'risk-free'];
      const match = financialKeywords.find(k => lower.includes(k));
      if (match) {
        violations.push({
          rule: 'financialAdvice:forbidden',
          severity: 'block',
          reason: `Text contains forbidden financial claim: "${match}"`
        });
      }
    } else if (policies.financialAdvice === 'disclaimer_required') {
      const financialKeywords = ['return', 'profit', 'investment', 'yield'];
      const hasFinancialContent = financialKeywords.some(k => lower.includes(k));
      if (hasFinancialContent) {
        finalText = proposedText + '\n\n⚠️ *Este mensaje no constituye asesoramiento financiero regulado.*';
        violations.push({
          rule: 'financialAdvice:disclaimer_required',
          severity: 'warn',
          reason: 'Disclaimer appended to financial content'
        });
      }
    }

    // --- Rule 2: Promises ---
    if (policies.promises === 'forbidden') {
      const promiseKeywords = ['guarantee', 'te prometemos', 'sin duda', 'seguro que', '100%', 'never fails', 'i promise'];
      const match = promiseKeywords.find(k => lower.includes(k));
      if (match) {
        violations.push({
          rule: 'promises:forbidden',
          severity: 'block',
          reason: `Text contains a forbidden promise: "${match}"`
        });
      }
    }

    // --- Rule 3: Escalation Threshold ---
    const hardEscalationKeywords = ['lawsuit', 'sue', 'legal action', 'demanda', 'quiero recuperar mi dinero'];
    if (hardEscalationKeywords.some(k => lower.includes(k))) {
      violations.push({
        rule: `escalationThreshold:${policies.escalationThreshold}`,
        severity: 'escalate',
        reason: 'High-risk escalation keyword detected — routing to human'
      });
    }

    // --- Determine Final Action ---
    const hasBlock = violations.some(v => v.severity === 'block');
    const hasEscalate = violations.some(v => v.severity === 'escalate');

    if (hasBlock) {
      return { allowed: false, violations, finalText: '', action: 'block' };
    }
    if (hasEscalate) {
      return { allowed: false, violations, finalText: '', action: 'escalate' };
    }

    return {
      allowed: true,
      violations,
      finalText,
      action: violations.length > 0 ? 'add_disclaimer' : 'send'
    };
  }
}
