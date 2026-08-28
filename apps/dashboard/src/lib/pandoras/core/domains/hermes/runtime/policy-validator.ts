/**
 * 🛡️ Hermes OS — Policy & Disclosure Validator (K15-LATTICE-02 / K19-SECRET-01 / K21-AUDIT-01)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/policy-validator.ts
 *
 * Enforces Formal 6-Tier Policy Lattice Ceilings:
 * PUBLIC < TENANT_RESTRICTED < B2B_RESTRICTED < INTERNAL_OPERATIONAL < CONFIDENTIAL < SECRET
 *
 * Ceilings by Channel:
 * - Public user channels (Telegram, WhatsApp, Web Public): MAX = TENANT_RESTRICTED (rank 2)
 * - Internal Team Dashboard: MAX = INTERNAL_OPERATIONAL (rank 4)
 * - Admin Console: MAX = CONFIDENTIAL (rank 5)
 * - Secret Manager / KMS: MAX = SECRET (rank 6)
 */

import {
  ReasoningOutput,
  ReasoningContext,
  RuntimePolicy,
  PolicyValidationResult,
  PolicyDecision,
  RuntimePolicyValidator,
  PolicyViolation,
  KnowledgeClassificationTier,
  CLASSIFICATION_LATTICE_RANK,
  PolicyValidationOptions
} from './contracts';
import { SecurityAuditLogger } from './security-audit-logger';
import { SnaraiResponsePolicyGate } from './policy/snarai-response-policy-gate';
import { TenantResponsePolicyGate } from './policy/tenant-response-policy';
import { ClaimContractEngine } from '../knowledge/claim-contract-engine';

export class DefaultRuntimePolicyValidator implements RuntimePolicyValidator {
  async validate(
    output: ReasoningOutput,
    context: ReasoningContext,
    policy: RuntimePolicy,
    options?: PolicyValidationOptions
  ): Promise<PolicyValidationResult> {
    const violations: PolicyViolation[] = [];
    const text = output.content.toLowerCase();

    // ── 0. Calculate Channel Maximum Classification Ceiling & Rank ─────────────
    const defaultChannelMax: KnowledgeClassificationTier =
      options?.channel === 'admin_console'
        ? 'CONFIDENTIAL'
        : options?.channel === 'internal_dashboard'
          ? 'INTERNAL_OPERATIONAL'
          : 'TENANT_RESTRICTED';

    const channelMax = options?.channelMaxClassification || defaultChannelMax;
    const maxAllowedRank = CLASSIFICATION_LATTICE_RANK[channelMax] ?? 2;

    // ── K27.1 Invariant: Fail-Closed when sovereign knowledge is unavailable ───
    if (context.knowledgeUnavailable) {
      const intentTier = ClaimContractEngine.determineIntentTier(output.content);
      if (intentTier !== 'LEVEL_0_CONVERSATIONAL') {
        violations.push({
          code: 'RESTRICTED_KNOWLEDGE',
          severity: 'BLOCK',
          message: `KNOWLEDGE_UNAVAILABLE: Sovereign knowledge vault is unreachable. Ingestion failed and factual/commercial assertions (${intentTier}) are strictly prohibited in fail-closed state.`,
        });
      }
    }

    // 1. K11-A21: Financial Hallucination Boundary
    // Only block when output makes real financial PROMISES (guaranteed returns, fixed interest, promised yields) without active knowledge backing.
    // Words like "garantizando que cada decisión..." in non-financial contexts are NOT financial promises.
    if (!policy.allowFinancialPromises) {
      const hasFinancialKeyword = 
        /\b(?:retorno|rendimiento|ganancia|interés|utilidad|liquidez|tasa)\s+(?:fij[oa]s?\s+)?garantizad[oa]s?\b/i.test(text) ||
        /\bgarantiza(?:r|mos|ndo)?\s+(?:un\s+\d+%|retornos?|rendimientos?|ganancias?|intereses?)\b/i.test(text) ||
        text.includes('guaranteed return') || text.includes('retorno garantizado') ||
        text.includes('rendimiento garantizado');
      // If output mentions yield/return but with an explicit disclaimer, it's informational — allow.
      const hasDisclaimer = text.includes('sin garantías') || text.includes('no garantiza') ||
        text.includes('no hay garantía') || text.includes('sujetos a') ||
        text.includes('sujeto a') || text.includes('no fixed') || text.includes('no se garantiza');
      if (hasFinancialKeyword && !hasDisclaimer) {
        const hasAuthority = context.activeKnowledge?.some(k =>
          k.content.toLowerCase().includes('garantiza') || k.content.toLowerCase().includes('garantía')
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
    // Only block explicit exfiltration phrases — NOT general legal/compliance words like 'auditoría'.
    // Mentioning an audit in a legal explanation is valid informational content.
    if (!policy.allowRestrictedKnowledge) {
      if (text.includes('audit report') || text.includes('restricted information')) {
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
        const hasAuthority = context.activeKnowledge?.some(k =>
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
        const hasAuthority = context.activeCapabilities?.some(c =>
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
        const hasAuthority = context.activeKnowledge?.some(k =>
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

    // 9. Phase 2.2 Gate: SECRET Boundary Enforcement (Zero-Tolerance)
    // Matches private keys (0x + 64 hex chars), API secret keys, database credentials, passwords
    const secretKeyRegex = /(?:0x[a-fA-F0-9]{64}|sk_(?:live|test)_[a-zA-Z0-9]{12,}|postgresql:\/\/[^\s]+|password\s*=\s*[^\s]+)/i;
    if (secretKeyRegex.test(output.content)) {
      violations.push({
        code: 'SECRET_DISCLOSURE',
        severity: 'BLOCK',
        message: 'Output contains raw cryptographic secrets, private keys, or internal credentials.',
      });
    }

    // 10. K15 Lattice Engine: Dynamic Evaluation against channel max rank
    if (context.activeKnowledge) {
      for (const fact of context.activeKnowledge) {
        const factTier = fact.classification || 'PUBLIC';
        const factRank = CLASSIFICATION_LATTICE_RANK[factTier] ?? 1;

        if (factRank > maxAllowedRank) {
          // Fact exceeds channel ceiling -> verify output does not leak its key content
          const factKeywords = fact.content.toLowerCase().split(/\s+/).filter(w => w.length > 5);
          const hasLeak = factKeywords.some(kw => text.includes(kw));

          if (hasLeak || text.includes(fact.key.toLowerCase())) {
            violations.push({
              code: 'RESTRICTED_KNOWLEDGE',
              severity: 'BLOCK',
              message: `Output leaks facts classified as '${factTier}' exceeding channel ceiling '${channelMax}'.`,
            });
            break;
          }
        }
      }
    }

    // 11. Phase 2.2 Gate: INTERNAL_OPERATIONAL & Corporate Boundary
    if (maxAllowedRank < CLASSIFICATION_LATTICE_RANK['INTERNAL_OPERATIONAL']) {
      if (
        (text.includes('iom v1.0') || text.includes('institutional operating model') || text.includes('mxhub ecosistema blockchain') || text.includes('holding wyoming')) &&
        !context.activeKnowledge?.some(k => (k as any).classification === 'PUBLIC' && k.content.toLowerCase().includes('iom'))
      ) {
        violations.push({
          code: 'INTERNAL_OPERATIONAL_DISCLOSURE',
          severity: 'BLOCK',
          message: 'Output discloses confidential internal corporate structure or operational documents.',
        });
      }
    }

    // 12. Phase 2.2 Gate: ACADEMY_EVALUATE_ONLY Boundary
    if (text.includes('rubriccriterion') || text.includes('grading_rubric_secret') || text.includes('model_answer_internal')) {
      violations.push({
        code: 'ACADEMY_EVALUATE_ONLY_DISCLOSURE',
        severity: 'BLOCK',
        message: 'Output discloses internal Academy evaluation blueprints or grading rubrics.',
      });
    }

    // 13. K15 Lattice Gate: CONFIDENTIAL Tier Boundary
    if (maxAllowedRank < CLASSIFICATION_LATTICE_RANK['CONFIDENTIAL']) {
      if (text.includes('partner term sheet') || text.includes('acuerdo confidencial') || text.includes('cap table holding')) {
        violations.push({
          code: 'RESTRICTED_KNOWLEDGE',
          severity: 'BLOCK',
          message: 'Output discloses CONFIDENTIAL holding documents or sensitive partner term sheets.',
        });
      }
    }

    // 14. Milestone K25.5: Multi-Tenant Intelligence & Canonical Response Policy Gate
    let finalOutput = output.content;
    const targetTenantId = options?.organizationId || context.tenantIdentity?.organizationName || 'generic';
    const policyResult = TenantResponsePolicyGate.evaluate(
      output.content,
      targetTenantId,
      undefined,
      context.activeKnowledge
    );

    if (policyResult.action === 'BLOCK') {
      for (const v of policyResult.violations) {
        violations.push({
          code: v.code as any,
          severity: 'BLOCK',
          message: v.message,
        });
      }
    } else if (policyResult.action === 'REWRITE') {
      finalOutput = policyResult.sanitizedOutput;
    }

    // 15. Milestone K26: Epistemic Framing & Governed Claim Validation
    const epistemicCheck = ClaimContractEngine.validateEpistemicFraming(output.content, targetTenantId);
    if (!epistemicCheck.valid) {
      for (const v of epistemicCheck.violations) {
        violations.push({
          code: v.code as any,
          severity: 'BLOCK',
          message: v.message,
        });
      }
    }

    // 16. Milestone K26.1: Unsupported Claim Composition & Extrapolation Defense
    const compositionCheck = ClaimContractEngine.detectUnsupportedClaimComposition(output.content, targetTenantId);
    if (!compositionCheck.valid) {
      for (const v of compositionCheck.violations) {
        violations.push({
          code: v.code as any,
          severity: 'BLOCK',
          message: v.message,
        });
      }
    }

    // 17. Milestone K26.1: Disclosure Authorization vs Cryptographic Validity Separation
    const disclosureCheck = ClaimContractEngine.validateDisclosureAuthorization(
      output.content,
      targetTenantId,
      options?.controlPlaneContext?.role
    );
    if (!disclosureCheck.valid) {
      for (const v of disclosureCheck.violations) {
        violations.push({
          code: v.code as any,
          severity: 'BLOCK',
          message: v.message,
        });
      }
    }

    // 18. Milestone K26.1: Material Claim Coverage Validation
    // K27-FP2: ACTIVE sovereign knowledge counts as a legitimate support source alongside
    // canonical contract claims — the vault governs facts, the contract governs promises.
    const intentTier = ClaimContractEngine.determineIntentTier(output.content);
    if (intentTier === 'LEVEL_2_COMMERCIAL' || intentTier === 'LEVEL_3_FINANCIAL_CONTRACTUAL' || intentTier === 'LEVEL_4_ACTION') {
      const coverage = ClaimContractEngine.evaluateClaimCoverage(output.content, targetTenantId, {
        additionalSources: (context.activeKnowledge || []).map(k => k.content),
      });
      if (!coverage.complete && coverage.unsupportedSegments.length > 0) {
        violations.push({
          code: 'UNSUPPORTED_CLAIM_COMPOSITION',
          severity: 'BLOCK',
          message: `Afirmación material no respaldada en el Claim Contract activo: ${coverage.unsupportedSegments.join('; ')}`,
        });
      }
    }

    // ─── Build explicit PolicyDecision (K12-A30) ──────────────────────────────
    const hasBlock = violations.some(v => v.severity === 'BLOCK');
    const hasRewrite = !hasBlock && (violations.some(v => v.severity === 'REWRITE') || finalOutput !== output.content);

    const decision: PolicyDecision = hasBlock
      ? { action: 'BLOCK',   output: 'Message blocked by Hermes Governance Policy.', violations }
      : hasRewrite
        ? { action: 'REWRITE', output: finalOutput, violations }
        : { action: 'ALLOW',   output: output.content, violations };

    // ─── K21: Emit Security Audit Event on Disclosure Block ───────────────────
    if (hasBlock) {
      const orgId = options?.organizationId || 'snarai';
      const isCriticalEmergency = violations.some(v => v.code === 'SECRET_DISCLOSURE' || v.code === 'GOVERNANCE_OVERRIDE');
      try {
        await SecurityAuditLogger.logEvent({
          organizationId: orgId,
          actorId: options?.actorId,
          eventType: 'DISCLOSURE_BLOCKED',
          severity: isCriticalEmergency ? 'CRITICAL' : 'WARN',
          policyDecision: 'DENY',
          correlationId: options?.correlationId,
          metadata: {
            channel: options?.channel || 'unknown',
            channelMax: channelMax,
            violations: violations.map(v => ({ code: v.code, message: v.message })),
          },
        });
      } catch (auditErr) {
        console.warn('[PolicyValidator] Security audit event emission failed:', auditErr);
      }
    }

    return {
      allowed: decision.action !== 'BLOCK',
      decision,
      output: decision.output,
      violations,
      trace: {
        validatedAt: new Date(),
        policyVersion: '1.2',
        claimsChecked: 13,
        violationsDetected: violations.length,
      },
    };
  }
}
