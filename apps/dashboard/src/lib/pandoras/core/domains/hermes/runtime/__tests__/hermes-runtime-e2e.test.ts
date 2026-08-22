/**
 * 🛡️ Hermes OS End-to-End Multichannel Runtime Certification (Milestone 4.0 E2E)
 *
 * Certifies the full end-to-end cognitive, identity, tool governance,
 * journey persistence, and disclosure pipeline across channels.
 */

import { describe, it, expect } from '@jest/globals';
import { ActorIdentityResolver } from '../identity/actor-identity-resolver';
import { ContextHygieneValidator } from '../context-hygiene-validator';
import { HermesToolExecutor } from '../tool-executor';
import { JourneyEngine } from '../journey-engine';
import { DefaultRuntimePolicyValidator } from '../policy-validator';
import { PostgresConversationMemoryProvider } from '../memory/postgres-memory-provider';
import { ReasoningContext, ReasoningOutput, RuntimePolicy } from '../contracts';

describe('Hermes OS End-to-End Multichannel Runtime Certification', () => {
  const defaultPolicy: RuntimePolicy = {
    allowUnverifiedClaims: false,
    allowRestrictedKnowledge: false,
    allowGovernanceOverrides: false,
    allowUnauthorizedCapabilities: false,
    allowFinancialPromises: false,
    allowRegulatoryClaims: false,
    allowExecutionClaims: false,
  };

  // ────────────────────────────────────────────────────────────────────────────
  // E2E-01: Full Multichannel Cognitive Pipeline (Inbound → Tool → Journey → Output)
  // ────────────────────────────────────────────────────────────────────────────
  it('E2E-01: Multichannel Full Cycle — Identity, Hygiene, Tool, Journey, and Disclosure in Live Session', async () => {
    const testUserTag = `tg_user_${Date.now()}`;

    // 1. Step 1: Channel Inbound & Identity Binding
    const identityResolver = new ActorIdentityResolver();
    const identity = await identityResolver.resolve({
      channelType: 'telegram',
      externalIdentifier: testUserTag,
      organizationId: 'snarai'
    });

    expect(identity).not.toBeNull();
    expect(identity!.actorId).toBe(`actor_telegram_${testUserTag}`);
    expect(identity!.organizationId).toBe('snarai');

    // 2. Step 2: Context Assembly & Pre-LLM Hygiene
    const context: ReasoningContext = {
      systemRules: ['ADR-011: Hermes Platform Invariant'],
      governanceRestrictions: [],
      tenantIdentity: {
        agentName: 'Hermes',
        organizationName: "S'Narai",
        language: 'es',
        tone: 'advisory'
      },
      activeKnowledge: [
        {
          id: 'k_snarai_thesis',
          dimension: 'thesis',
          key: 'snarai_intro',
          content: 'S\'Narai es un desarrollo inmobiliario tokenizado en Riviera Nayarit.',
          status: 'ACTIVE',
          visibility: 'PUBLIC',
          classification: 'PUBLIC'
        }
      ],
      activeCapabilities: [
        { id: 'payments.create_spei_link', description: 'Genera orden de compra SPEI' }
      ],
      conversationHistory: [],
      currentMessage: { id: 'msg_1', role: 'USER', content: 'Quiero invertir $50 USD vía SPEI', createdAt: new Date() }
    };

    const hygieneResult = ContextHygieneValidator.validate(context);
    expect(hygieneResult.valid).toBe(true);
    expect(hygieneResult.sanitizedContext.activeKnowledge.length).toBe(1);

    // 3. Step 3: Tool Execution through HermesToolExecutor
    const toolExecutor = new HermesToolExecutor();
    const toolResponse = await toolExecutor.executeTool(
      {
        organizationId: identity!.organizationId,
        actorId: identity!.actorId,
        capabilityId: 'payments.create_spei_link',
        toolName: 'payments.create_spei_link',
        parameters: { amount: 50 }
      },
      context.activeCapabilities
    );

    expect(toolResponse.success).toBe(true);
    expect((toolResponse.data as any).clabe).toBe('646180123456789012');

    // 4. Step 4: Advance Actor Journey Persistence
    const journeyEngine = new JourneyEngine();
    const advanceResult = await journeyEngine.advanceActorStage({
      organizationId: identity!.organizationId,
      actorId: identity!.actorId,
      targetStageId: 'Budget & Feasibility'
    });

    expect(advanceResult.success).toBe(true);
    expect(advanceResult.currentStageId).toBe('Budget & Feasibility');

    // 5. Step 5: Final Disclosure Output Validation
    const policyValidator = new DefaultRuntimePolicyValidator();
    const cleanOutput: ReasoningOutput = {
      content: 'Excelente. Hemos generado tu orden SPEI con CLABE 646180123456789012 por $50 USD. Tu etapa actual ha sido actualizada.',
      meta: { provider: 'test', model: 'mock', promptTokens: 20, completionTokens: 30, durationMs: 12 }
    };

    const policyDecision = await policyValidator.validate(cleanOutput, context, defaultPolicy);
    expect(policyDecision.allowed).toBe(true);
    expect(policyDecision.decision.action).toBe('ALLOW');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // E2E-02: Cross-Tenant Parameter Spoofing Rejection
  // ────────────────────────────────────────────────────────────────────────────
  it('E2E-02: Tool Parameter Scoping — Rejects tool invocation targeting foreign tenant', async () => {
    const toolExecutor = new HermesToolExecutor();
    const spoofedResponse = await toolExecutor.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'actor_tg_123',
        capabilityId: 'payments.create_spei_link',
        toolName: 'payments.create_spei_link',
        parameters: { targetOrgId: 'foreign_tenant_zunu', amount: 500 }
      },
      [{ id: 'payments.create_spei_link' }]
    );

    expect(spoofedResponse.success).toBe(false);
    expect(spoofedResponse.unauthorized).toBe(true);
    expect(spoofedResponse.reason).toContain('Cross-tenant parameter mismatch');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // E2E-03: KNOW vs USE vs DISCLOSE Multi-Layer Enforcement
  // ────────────────────────────────────────────────────────────────────────────
  it('E2E-03: KNOW vs USE vs DISCLOSE — Internal operational reasoning allowed for USE but blocked on DISCLOSE', async () => {
    const policyValidator = new DefaultRuntimePolicyValidator();

    // 1. Internal operational fact authorized for USE in operational context
    const operationalContext: ReasoningContext = {
      systemRules: ['ADR-011: Hermes Holding Invariant'],
      governanceRestrictions: [],
      tenantIdentity: { agentName: 'Hermes-Ops', organizationName: 'Holding-Wyoming' },
      activeKnowledge: [
        {
          id: 'k_iom_holding',
          dimension: 'internal',
          key: 'iom_wyoming_structure',
          content: 'El IOM v1.0 define la subsidiaria operadora MXHUB.',
          status: 'ACTIVE',
          visibility: 'RESTRICTED',
          classification: 'INTERNAL_OPERATIONAL'
        }
      ],
      activeCapabilities: [],
      conversationHistory: [],
      currentMessage: { id: 'm1', role: 'USER', content: '¿Cuál es la estructura interna?', createdAt: new Date() }
    };

    // Pre-LLM: Allowed for USE when allowInternalOperationalUse = true
    const hygieneAllowed = ContextHygieneValidator.validate(operationalContext, { allowInternalOperationalUse: true });
    expect(hygieneAllowed.valid).toBe(true);
    expect(hygieneAllowed.sanitizedContext.activeKnowledge.length).toBe(1);

    // Output: If model attempts to disclose the internal IOM to a public channel, Disclosure Gate BLOCKS it
    const leakingOutput: ReasoningOutput = {
      content: 'La entidad MXHUB Ecosistema Blockchain S.A. de C.V. es la operadora según el IOM v1.0.',
      meta: { provider: 'test', model: 'mock', promptTokens: 10, completionTokens: 10, durationMs: 5 }
    };

    const outputDecision = await policyValidator.validate(leakingOutput, operationalContext, defaultPolicy);
    expect(outputDecision.allowed).toBe(false);
    expect(outputDecision.decision.action).toBe('BLOCK');
    expect(outputDecision.violations.some(v => v.code === 'INTERNAL_OPERATIONAL_DISCLOSURE')).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // E2E-04: Fail-Closed Boundary on Unknown Identity / Tenant
  // ────────────────────────────────────────────────────────────────────────────
  it('E2E-04: Resilience & Fail-Closed — Corrupted identity returns null without demo fallbacks', async () => {
    const identityResolver = new ActorIdentityResolver();
    const identity = await identityResolver.resolve({
      channelType: 'telegram',
      externalIdentifier: 'tg_user_ghost',
      organizationId: `unknown_org_${Date.now()}`
    });

    expect(identity).toBeNull();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // E2E-05: Integrated HermesRuntime Pipeline Execution (Kernel Orchestrator)
  // ────────────────────────────────────────────────────────────────────────────
  it('E2E-05: Runtime Orchestration — HermesRuntime.respond() executes full cognitive turn with DB read-back', async () => {
    const { HermesRuntime } = require('../hermes-runtime');
    const { MockReasoningProvider } = require('../reasoning-providers');
    const { PostgresConversationMemoryProvider } = require('../memory/postgres-memory-provider');

    const conversationId = `conv_e2e_${Date.now()}`;
    const actorId = `actor_e2e_${Date.now()}`;
    const controlPlaneContext = { actorId, organizationId: 'snarai' };

    const mockProvider = new MockReasoningProvider('Bienvenido a S\'Narai. ¿Deseas conocer la tesis de inversión?');
    const memoryProvider = new PostgresConversationMemoryProvider();
    const runtime = new HermesRuntime(mockProvider, memoryProvider);

    // 1. Execute Turn via HermesRuntime kernel
    const runtimeResponse = await runtime.respond({
      organizationId: 'snarai',
      conversationId,
      message: {
        id: `msg_e2e_${Date.now()}`,
        role: 'USER',
        content: 'Hola Hermes, quiero información de S\'Narai',
        createdAt: new Date()
      },
      controlPlaneContext
    });

    expect(runtimeResponse).toBeDefined();
    expect(runtimeResponse.organizationId).toBe('snarai');
    expect(runtimeResponse.content).toContain('S\'Narai');
    expect(runtimeResponse.responseId).toBeDefined();

    // 2. Physical DB Read-Back from Neon PostgreSQL
    const loadedMemory = await memoryProvider.load({
      organizationId: 'snarai',
      conversationId,
      controlPlaneContext
    });

    expect(loadedMemory).toBeDefined();
    expect(loadedMemory.messages.length).toBe(2);
    expect(loadedMemory.messages[0]!.content).toBe('Hola Hermes, quiero información de S\'Narai');
    expect(loadedMemory.messages[1]!.content).toContain('S\'Narai');
  });
});
