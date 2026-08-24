import { describe, it, expect } from 'vitest';
import { TenantAuthorityService } from '../tenant-authority';
import { CognitiveContextAdapter } from '../../runtime/context-adapter';
import { DefaultRuntimePolicyValidator } from '../../runtime/policy-validator';
import { ReasoningOutput, RuntimePolicy } from '../../runtime/contracts';

describe('🏛️ Hermes OS — Milestone K27.1 Tenant Authority & Knowledge Unavailable Invariants', () => {
  const strictPolicy: RuntimePolicy = {
    allowUnverifiedClaims: false,
    allowRestrictedKnowledge: false,
    allowGovernanceOverrides: false,
    allowUnauthorizedCapabilities: false,
    allowFinancialPromises: false,
    allowRegulatoryClaims: false,
    allowExecutionClaims: false,
  };

  it('K27.1-AUTH-01: Canonical resolution identifies tenant via slug or UUID', async () => {
    const canonical = await TenantAuthorityService.resolveCanonicalTenant('snarai');
    expect(canonical).not.toBeNull();
    expect(canonical?.projectSlug).toBe('snarai');
    expect(canonical?.canonicalOrgId).toBeDefined();
  });

  it('K27.1-AUTH-02: Non-existent tenant resolves to null (fail-closed)', async () => {
    const canonical = await TenantAuthorityService.resolveCanonicalTenant('non_existent_tenant_99999');
    expect(canonical).toBeNull();
  });

  it('K27.1-KNOW-01: ContextAdapter injects fail-closed restriction when knowledge is unavailable', () => {
    const mockEffectiveContext = {
      core: { tenantId: 'test_tenant', organizationName: 'Test Org' },
      knowledge: [],
      style: { tone: 'Formal', language: 'es' },
      activeCapabilities: [],
      intelligenceScores: [],
      knowledgeUnavailable: true,
    };

    const { reasoningContext } = CognitiveContextAdapter.adapt(
      mockEffectiveContext as any,
      [],
      { role: 'user', content: '¿Cuánto cuesta un token?' } as any
    );

    expect(reasoningContext.knowledgeUnavailable).toBe(true);
    expect(reasoningContext.governanceRestrictions.some(r => r.includes('KNOWLEDGE UNAVAILABLE'))).toBe(true);
  });

  it('K27.1-KNOW-02: PolicyValidator BLOCKS technical/financial/legal assertions when knowledge is unavailable', async () => {
    const validator = new DefaultRuntimePolicyValidator();

    const mockReasoningContext = {
      systemRules: [],
      governanceRestrictions: ['KNOWLEDGE UNAVAILABLE'],
      tenantIdentity: { agentName: 'Hermes', organizationName: 'Test Org' },
      activeKnowledge: [],
      activeCapabilities: [],
      knowledgeUnavailable: true,
      conversationHistory: [],
      currentMessage: { role: 'user', content: 'Dime los rendimientos y el precio' } as any,
    };

    const unbackedFinancialOutput: ReasoningOutput = {
      content: 'El precio del token es de $100 USD y genera rendimientos del 20% anual garantizado.',
      meta: { provider: 'mock', model: 'mock-k27', promptTokens: 50, completionTokens: 25, durationMs: 15 },
    };

    const result = await validator.validate(unbackedFinancialOutput, mockReasoningContext as any, strictPolicy);

    expect(result.decision.action).toBe('BLOCK');
    expect(result.violations.some(v => v.code === 'RESTRICTED_KNOWLEDGE' && v.message.includes('KNOWLEDGE_UNAVAILABLE'))).toBe(true);
  });

  it('K27.1-KNOW-03: PolicyValidator ALLOWS conversational greetings even when knowledge is unavailable', async () => {
    const validator = new DefaultRuntimePolicyValidator();

    const mockReasoningContext = {
      systemRules: [],
      governanceRestrictions: ['KNOWLEDGE UNAVAILABLE'],
      tenantIdentity: { agentName: 'Hermes', organizationName: 'Test Org' },
      activeKnowledge: [],
      activeCapabilities: [],
      knowledgeUnavailable: true,
      conversationHistory: [],
      currentMessage: { role: 'user', content: 'Hola buenos días' } as any,
    };

    const conversationalOutput: ReasoningOutput = {
      content: 'Hola, un gusto saludarte. Actualmente nuestro servicio de validación fáctica se encuentra en sincronización. ¿En qué más puedo orientarte?',
      meta: { provider: 'mock', model: 'mock-k27', promptTokens: 50, completionTokens: 25, durationMs: 12 },
    };

    const result = await validator.validate(conversationalOutput, mockReasoningContext as any, strictPolicy);

    expect(result.decision.action).toBe('ALLOW');
    expect(result.violations.length).toBe(0);
  });
});
