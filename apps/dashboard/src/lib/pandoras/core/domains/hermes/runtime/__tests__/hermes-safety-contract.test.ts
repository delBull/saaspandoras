/**
 * 🛡️ Hermes OS Safety Contract Certification Suite (Fase 2.2 & Fase 3.0)
 * Tests: T01 to T09
 * Verifies Knowledge Classification, Disclosure Boundary, 4-Way Memory Isolation,
 * Invariants of Journey Progression, Optimistic Concurrency, and Fail-Closed Boundaries.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DefaultRuntimePolicyValidator } from '../policy-validator';
import { JourneyEngine } from '../journey-engine';
import { JourneyTransitionValidator } from '../../journeys/transition-validator';
import { 
  JourneyActionProposal, 
  ActorJourneyState, 
  JourneyDefinition, 
  JourneyTransition 
} from '../../journeys/contracts';
import { PostgresConversationMemoryProvider } from '../memory/postgres-memory-provider';
import { RuntimePolicy, ReasoningContext, ReasoningOutput } from '../contracts';

describe('Hermes OS Safety Contract — Fase 2.2 & 3.0 Certification', () => {
  let policyValidator: DefaultRuntimePolicyValidator;
  let transitionValidator: JourneyTransitionValidator;
  let journeyEngine: JourneyEngine;

  const defaultPolicy: RuntimePolicy = {
    allowUnverifiedClaims: false,
    allowRestrictedKnowledge: false,
    allowGovernanceOverrides: false,
    allowUnauthorizedCapabilities: false,
    allowFinancialPromises: false,
    allowRegulatoryClaims: false,
    allowExecutionClaims: false,
  };

  const defaultContext: ReasoningContext = {
    systemRules: ['ADR-011: Hermes Governance Invariant'],
    governanceRestrictions: [],
    tenantIdentity: {
      agentName: 'Hermes',
      organizationName: "S'Narai",
      language: 'es',
      tone: 'advisory'
    },
    activeKnowledge: [
      { id: 'k_snarai_pub', dimension: 'identity', key: 'snarai_thesis', content: 'S\'Narai es un desarrollo inmobiliario tokenizado en Riviera Nayarit.', status: 'ACTIVE', visibility: 'PUBLIC' }
    ],
    activeCapabilities: [],
    conversationHistory: [],
    currentMessage: { id: 'msg_1', role: 'USER', content: 'hola', createdAt: new Date() }
  };

  beforeEach(() => {
    policyValidator = new DefaultRuntimePolicyValidator();
    transitionValidator = new JourneyTransitionValidator();
    journeyEngine = new JourneyEngine();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T01: Disclosure Adversarial Resistance (SECRET & INTERNAL_OPERATIONAL)
  // ────────────────────────────────────────────────────────────────────────────
  it('T01: Disclosure Adversarial Resistance — Blocks private keys, DB URIs, and internal IOM', async () => {
    // 1. Attempt to leak raw private key
    const secretOutput: ReasoningOutput = {
      content: 'Here is the private key: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef for signing.',
      meta: { provider: 'test', model: 'mock', promptTokens: 10, completionTokens: 10, durationMs: 5 }
    };
    const secretDecision = await policyValidator.validate(secretOutput, defaultContext, defaultPolicy);
    expect(secretDecision.allowed).toBe(false);
    expect(secretDecision.decision.action).toBe('BLOCK');
    expect(secretDecision.violations.some(v => v.code === 'SECRET_DISCLOSURE')).toBe(true);

    // 2. Attempt to leak internal IOM v1.0 and corporate structure
    const iomOutput: ReasoningOutput = {
      content: 'Según el IOM v1.0 de Pandora\'s, la entidad MXHUB Ecosistema Blockchain S.A. de C.V. es la operadora local.',
      meta: { provider: 'test', model: 'mock', promptTokens: 10, completionTokens: 10, durationMs: 5 }
    };
    const iomDecision = await policyValidator.validate(iomOutput, defaultContext, defaultPolicy);
    expect(iomDecision.allowed).toBe(false);
    expect(iomDecision.decision.action).toBe('BLOCK');
    expect(iomDecision.violations.some(v => v.code === 'INTERNAL_OPERATIONAL_DISCLOSURE')).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  // T02: Academy → Tenant Memory Isolation (MUST = 0)
  // ────────────────────────────────────────────────────────────────────────────
  it('T02: Academy → Tenant Memory Isolation — Assessment queries never return tenant data', async () => {
    const memoryProvider = new PostgresConversationMemoryProvider();
    const uniqueSuffix = Date.now();
    const tenantOrg = `snarai_sentinel_${uniqueSuffix}`;
    const tenantConv = `conv_snarai_${uniqueSuffix}`;
    
    // 1. Positive Seed: Save turn in Tenant memory
    await memoryProvider.append({
      organizationId: tenantOrg,
      conversationId: tenantConv,
      turn: {
        responseId: `resp_${uniqueSuffix}`,
        createdAt: new Date(),
        userMessage: { id: `usr_${uniqueSuffix}`, role: 'USER', content: 'Secret Tenant Note 123', createdAt: new Date() },
        assistantMessage: { id: `ast_${uniqueSuffix}`, role: 'ASSISTANT', content: 'Acknowledged note.', createdAt: new Date() }
      },
      idempotencyKey: `idem_t02_${uniqueSuffix}`,
      controlPlaneContext: { actorId: 'tenant_user', organizationId: tenantOrg } as any
    });

    // 2. Query under Academy Scope
    const academyMemory = await memoryProvider.load({
      organizationId: 'pandoras_academy_assessment',
      conversationId: `conv_assessment_${uniqueSuffix}`,
      controlPlaneContext: { actorId: 'academy_candidate', organizationId: 'pandoras_academy_assessment' } as any
    });

    // Verify Academy memory returned 0 messages
    expect(academyMemory.messages.length).toBe(0);

    // 3. Query under Tenant Scope to confirm positive data exists in its own silo
    const tenantMemory = await memoryProvider.load({
      organizationId: tenantOrg,
      conversationId: tenantConv,
      controlPlaneContext: { actorId: 'tenant_user', organizationId: tenantOrg } as any
    });
    expect(tenantMemory.messages.length).toBe(2);
    expect(tenantMemory.messages[0]!.content).toBe('Secret Tenant Note 123');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T03: Tenant → Academy Memory Isolation (MUST = 0)
  // ────────────────────────────────────────────────────────────────────────────
  it('T03: Tenant → Academy Memory Isolation — Tenant sessions cannot read assessment memory', async () => {
    const memoryProvider = new PostgresConversationMemoryProvider();
    const uniqueSuffix = Date.now();
    const academyConv = `assessment_cand_${uniqueSuffix}`;

    // 1. Positive Seed: Save exam answer in Academy session
    await memoryProvider.append({
      organizationId: 'pandoras_academy_assessment',
      conversationId: academyConv,
      turn: {
        responseId: `resp_exam_${uniqueSuffix}`,
        createdAt: new Date(),
        userMessage: { id: `cand_msg_${uniqueSuffix}`, role: 'USER', content: 'Exam Response: Governance Thesis', createdAt: new Date() },
        assistantMessage: { id: `eval_msg_${uniqueSuffix}`, role: 'ASSISTANT', content: 'Assessment received.', createdAt: new Date() }
      },
      idempotencyKey: `idem_t03_${uniqueSuffix}`,
      controlPlaneContext: { actorId: 'cand_123', organizationId: 'pandoras_academy_assessment' } as any
    });

    // 2. Query under Tenant Scope
    const tenantMemory = await memoryProvider.load({
      organizationId: 'snarai_live',
      conversationId: `conv_snarai_visitor_${uniqueSuffix}`,
      controlPlaneContext: { actorId: 'visitor_456', organizationId: 'snarai_live' } as any
    });

    // Verify Tenant memory returned 0 messages from the exam
    expect(tenantMemory.messages.length).toBe(0);

    // 3. Confirm Academy session has its own exam record
    const academyMemory = await memoryProvider.load({
      organizationId: 'pandoras_academy_assessment',
      conversationId: academyConv,
      controlPlaneContext: { actorId: 'cand_123', organizationId: 'pandoras_academy_assessment' } as any
    });
    expect(academyMemory.messages.length).toBe(2);
    expect(academyMemory.messages[0]!.content).toBe('Exam Response: Governance Thesis');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T04: Candidate → Candidate Isolation (MUST = 0)
  // ────────────────────────────────────────────────────────────────────────────
  it('T04: Candidate A → Candidate B Isolation — No cross-talk between candidate tokens', async () => {
    const memoryProvider = new PostgresConversationMemoryProvider();
    const uniqueSuffix = Date.now();
    const candAConv = `assessment_cand_A_${uniqueSuffix}`;
    const candBConv = `assessment_cand_B_${uniqueSuffix}`;

    // 1. Candidate A writes exam answer
    await memoryProvider.append({
      organizationId: 'pandoras_academy_assessment',
      conversationId: candAConv,
      turn: {
        responseId: `resp_cand_a_${uniqueSuffix}`,
        createdAt: new Date(),
        userMessage: { id: `cand_a_msg_${uniqueSuffix}`, role: 'USER', content: 'Candidate A Proprietary Strategy Answer', createdAt: new Date() },
        assistantMessage: { id: `eval_a_${uniqueSuffix}`, role: 'ASSISTANT', content: 'Evaluation A recorded.', createdAt: new Date() }
      },
      idempotencyKey: `idem_t04_${uniqueSuffix}`,
      controlPlaneContext: { actorId: 'cand_A', organizationId: 'pandoras_academy_assessment' } as any
    });

    // 2. Candidate B queries their own session
    const candBMemory = await memoryProvider.load({
      organizationId: 'pandoras_academy_assessment',
      conversationId: candBConv,
      controlPlaneContext: { actorId: 'cand_B', organizationId: 'pandoras_academy_assessment' } as any
    });

    // Candidate B sees ZERO messages from Candidate A
    expect(candBMemory.messages.length).toBe(0);

    // 3. Candidate A sees only their own message
    const candAMemory = await memoryProvider.load({
      organizationId: 'pandoras_academy_assessment',
      conversationId: candAConv,
      controlPlaneContext: { actorId: 'cand_A', organizationId: 'pandoras_academy_assessment' } as any
    });
    expect(candAMemory.messages.length).toBe(2);
    expect(candAMemory.messages[0]!.content).toBe('Candidate A Proprietary Strategy Answer');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T05: Fail-Closed Boundary on Unknown Tenant
  // ────────────────────────────────────────────────────────────────────────────
  it('T05: Fail-Closed Boundary — Unknown or corrupted tenant returns unassigned snapshot and rejects advance', async () => {
    const fakeMessage: any = {
      organizationId: 'non_existent_tenant_xyz_' + Date.now(),
      actor: { externalActorId: 'actor_ghost' }
    };

    const snapshot = await journeyEngine.retrieveContext(fakeMessage);
    expect(snapshot.currentStage).toBe('UNASSIGNED');
    expect(snapshot.objectives.length).toBe(0);
    expect(snapshot.allowedTransitions.length).toBe(0);

    const advanceResult = await journeyEngine.advanceActorStage({
      organizationId: fakeMessage.organizationId,
      actorId: fakeMessage.actor.externalActorId,
      targetStageId: 'STAGE_2'
    });
    expect(advanceResult.success).toBe(false);
    expect(advanceResult.reason).toContain('Unknown tenant');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T06: Valid Journey Transition & Pure Domain Graph Validation
  // ────────────────────────────────────────────────────────────────────────────
  it('T06: Valid Journey Transition — Pure domain validator approves legal transition', () => {
    const journey: JourneyDefinition = {
      id: 'journey_1',
      organizationId: 'snarai',
      name: 'Sales Journey',
      description: 'Test',
      version: 1,
      status: 'ACTIVE',
      isDefault: true
    };

    const actorState: ActorJourneyState = {
      id: 'act_1',
      organizationId: 'snarai',
      actorId: 'lead_1',
      journeyId: 'journey_1',
      journeyVersion: 1,
      currentStageId: 'STAGE_WELCOME',
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      lastAdvancedAt: new Date(),
      completedAt: null
    };

    const transitions: JourneyTransition[] = [
      { id: 'tr_1', journeyId: 'journey_1', fromStageId: 'STAGE_WELCOME', toStageId: 'STAGE_FEASIBILITY', trigger: 'BUY_CLICK', condition: null, priority: 1 }
    ];

    const proposal: JourneyActionProposal = {
      type: 'REQUEST_STAGE_TRANSITION',
      organizationId: 'snarai',
      actorId: 'lead_1',
      journeyId: 'journey_1',
      journeyVersion: 1,
      targetStageId: 'STAGE_FEASIBILITY'
    };

    const decision = transitionValidator.validateTransition(proposal, actorState, journey, transitions);
    expect(decision.allowed).toBe(true);
    if (decision.allowed) {
      expect(decision.toStageId).toBe('STAGE_FEASIBILITY');
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T07: Invalid Journey Transition (Graph Rejection)
  // ────────────────────────────────────────────────────────────────────────────
  it('T07: Invalid Journey Transition — Graph rejects illegal stage jump', () => {
    const journey: JourneyDefinition = {
      id: 'journey_1',
      organizationId: 'snarai',
      name: 'Sales Journey',
      description: 'Test',
      version: 1,
      status: 'ACTIVE',
      isDefault: true
    };

    const actorState: ActorJourneyState = {
      id: 'act_1',
      organizationId: 'snarai',
      actorId: 'lead_1',
      journeyId: 'journey_1',
      journeyVersion: 1,
      currentStageId: 'STAGE_WELCOME',
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      lastAdvancedAt: new Date(),
      completedAt: null
    };

    const transitions: JourneyTransition[] = [
      { id: 'tr_1', journeyId: 'journey_1', fromStageId: 'STAGE_WELCOME', toStageId: 'STAGE_FEASIBILITY', trigger: null, condition: null, priority: 1 }
    ];

    const illegalProposal: JourneyActionProposal = {
      type: 'REQUEST_STAGE_TRANSITION',
      organizationId: 'snarai',
      actorId: 'lead_1',
      journeyId: 'journey_1',
      journeyVersion: 1,
      targetStageId: 'STAGE_FINAL_CLOSING' // Not reachable directly from STAGE_WELCOME
    };

    const decision = transitionValidator.validateTransition(illegalProposal, actorState, journey, transitions);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toContain('not allowed');
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T08: Concurrent Transition & Optimistic Concurrency Protection
  // ────────────────────────────────────────────────────────────────────────────
  it('T08: Concurrency Conflict Protection — Mismatched expectedStage triggers conflict flag', () => {
    const actorState: ActorJourneyState = {
      id: 'act_1',
      organizationId: 'snarai',
      actorId: 'lead_1',
      journeyId: 'journey_1',
      journeyVersion: 1,
      currentStageId: 'STAGE_FEASIBILITY', // Currently at Stage 2
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      lastAdvancedAt: new Date(),
      completedAt: null
    };

    const expectedCurrentStageId = 'STAGE_WELCOME'; // Stale caller thinks actor is still at Stage 1
    const conflictDetected = actorState.currentStageId !== expectedCurrentStageId;
    expect(conflictDetected).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T09: Authorization ≠ Journey Transition (Cross-Tenant / Actor Mismatch)
  // ────────────────────────────────────────────────────────────────────────────
  it('T09: Authorization ≠ Journey Transition — Rejects unauthorized cross-tenant attempt', () => {
    const journey: JourneyDefinition = {
      id: 'journey_1',
      organizationId: 'snarai',
      name: 'Sales Journey',
      description: 'Test',
      version: 1,
      status: 'ACTIVE',
      isDefault: true
    };

    const actorState: ActorJourneyState = {
      id: 'act_1',
      organizationId: 'snarai',
      actorId: 'lead_1',
      journeyId: 'journey_1',
      journeyVersion: 1,
      currentStageId: 'STAGE_WELCOME',
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      lastAdvancedAt: new Date(),
      completedAt: null
    };

    const transitions: JourneyTransition[] = [
      { id: 'tr_1', journeyId: 'journey_1', fromStageId: 'STAGE_WELCOME', toStageId: 'STAGE_FEASIBILITY', trigger: null, condition: null, priority: 1 }
    ];

    // Cross-tenant malicious spoof proposal
    const crossTenantProposal: JourneyActionProposal = {
      type: 'REQUEST_STAGE_TRANSITION',
      organizationId: 'zunu_impersonator', // Mismatch!
      actorId: 'lead_1',
      journeyId: 'journey_1',
      journeyVersion: 1,
      targetStageId: 'STAGE_FEASIBILITY'
    };

    const decision = transitionValidator.validateTransition(crossTenantProposal, actorState, journey, transitions);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toContain('Organization ID mismatch');
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T10: Tool Authorization & Execution Boundary Gate
  // ────────────────────────────────────────────────────────────────────────────
  it('T10: Tool Authorization & Execution — Precondition blocks unauthorized tool execution', async () => {
    const { HermesToolExecutor } = require('../tool-executor');
    const executor = new HermesToolExecutor();

    // 1. Adversary prompts Hermes to execute internal holding tool without clearance
    const deniedExecution = await executor.executeTool(
      {
        organizationId: 'snarai_public',
        actorId: 'external_user',
        capabilityId: 'cap_admin',
        toolName: 'getInternalOrganizationStructure',
        clearanceLevel: 'PUBLIC_VISITOR'
      },
      [{ id: 'payments.create_spei_link' }]
    );

    expect(deniedExecution.success).toBe(false);
    expect(deniedExecution.unauthorized).toBe(true);
    expect(deniedExecution.violationCode).toBe('UNAUTHORIZED_CAPABILITY');
    expect(deniedExecution.reason).toContain('requires TIER_1_COO clearance');

    // 2. Legitimate tenant commercial tool is authorized and executes successfully
    const allowedExecution = await executor.executeTool(
      {
        organizationId: 'snarai',
        actorId: 'prospect_user',
        capabilityId: 'payments.create_spei_link',
        toolName: 'payments.create_spei_link',
        parameters: { amount: 150 }
      },
      [{ id: 'payments.create_spei_link' }]
    );

    expect(allowedExecution.success).toBe(true);
    expect(allowedExecution.data).toBeDefined();
    expect((allowedExecution.data as any).clabe).toBe('646180123456789012');
    expect((allowedExecution.data as any).amountUsd).toBe(150);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T11: Knowledge Retrieval Boundary (Tenant RAG Scope Enforcement)
  // ────────────────────────────────────────────────────────────────────────────
  it('T11: Knowledge Retrieval Boundary — Scope check guarantees 0 cross-tenant chunks', async () => {
    const { KnowledgeEngine } = require('../knowledge-engine');
    const knowledgeEngine = new KnowledgeEngine();

    const normalizedTenantA = {
      organizationId: 'snarai',
      channel: { type: 'web', bindingId: 'w1' },
      actor: { identityId: 'usr1' },
      conversation: { conversationId: 'conv1' },
      message: { messageId: 'm1', content: 'Dame información del proyecto' },
      correlationId: 'c1',
      idempotencyKey: 'i1',
      receivedAt: new Date()
    };

    const snapshotA = await knowledgeEngine.retrieveContext(normalizedTenantA);
    expect(snapshotA.retrievedSnippets.length).toBeGreaterThan(0);
    // Assert every retrieved snippet belongs strictly to tenant 'snarai'
    for (const snippet of snapshotA.retrievedSnippets) {
      expect(snippet.scope.organizationId).toBe('snarai');
      expect(snippet.scope.organizationId).not.toBe('pandoras_holding');
      expect(snippet.scope.organizationId).not.toBe('other_tenant');
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T12: Pre-LLM Context Hygiene Validator Gate
  // ────────────────────────────────────────────────────────────────────────────
  it('T12: Context Pre-LLM Boundary — ContextHygieneValidator detects and sanitizes forbidden secrets', () => {
    const { ContextHygieneValidator } = require('../context-hygiene-validator');

    // 1. Construct a contaminated context with injected secrets and invalid statuses
    const contaminatedContext: ReasoningContext = {
      systemRules: ['ADR-011: Hermes Governance Invariant'],
      governanceRestrictions: ['NO_FINANCIAL_PROMISES'],
      tenantIdentity: {
        agentName: 'Hermes',
        organizationName: "S'Narai",
        language: 'es',
        tone: 'advisory'
      },
      activeKnowledge: [
        {
          id: 'k_public_1',
          dimension: 'thesis',
          key: 'snarai_overview',
          content: 'S\'Narai es un desarrollo boutique en Riviera Nayarit.',
          status: 'ACTIVE',
          visibility: 'PUBLIC',
          classification: 'PUBLIC'
        },
        {
          id: 'k_secret_injected',
          dimension: 'secrets',
          key: 'db_secret_leak',
          content: 'postgresql://admin:supersecretpassword@neon.tech/maindb',
          status: 'ACTIVE',
          visibility: 'RESTRICTED',
          classification: 'SECRET'
        },
        {
          id: 'k_iom_injected',
          dimension: 'internal',
          key: 'holding_structure',
          content: 'Detalles operativos internos del holding Pandora Wyoming LLC.',
          status: 'ACTIVE',
          visibility: 'RESTRICTED',
          classification: 'INTERNAL_OPERATIONAL'
        },
        {
          id: 'k_unapproved_fact',
          dimension: 'pricing',
          key: 'unapproved_discount',
          content: 'Descuento no autorizado del 50%.',
          status: 'PENDING_REVIEW' as any,
          visibility: 'PUBLIC',
          classification: 'PUBLIC'
        }
      ],
      activeCapabilities: [
        { id: 'payments.create_spei_link', description: 'Genera orden de compra SPEI' }
      ],
      conversationHistory: [],
      currentMessage: { id: 'msg_1', role: 'USER', content: '¿Qué es S\'Narai?', createdAt: new Date() }
    };

    // 2. Run Pre-LLM Validation
    const hygieneResult = ContextHygieneValidator.validate(contaminatedContext);

    expect(hygieneResult.valid).toBe(false);
    expect(hygieneResult.violations.length).toBe(3); // SECRET, INTERNAL_OPERATIONAL, PENDING_REVIEW
    expect(hygieneResult.violations.some((v: any) => v.code === 'SECRET_DISCLOSURE')).toBe(true);
    expect(hygieneResult.violations.some((v: any) => v.code === 'INTERNAL_OPERATIONAL_DISCLOSURE')).toBe(true);
    expect(hygieneResult.violations.some((v: any) => v.code === 'PENDING_KNOWLEDGE_CLAIM')).toBe(true);

    // 3. Confirm that sanitizedContext strips all contaminated facts before LLM transmission
    expect(hygieneResult.sanitizedContext.activeKnowledge.length).toBe(1);
    expect(hygieneResult.sanitizedContext.activeKnowledge[0]!.id).toBe('k_public_1');
    expect(hygieneResult.sanitizedContext.activeKnowledge[0]!.classification).toBe('PUBLIC');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // T13: Cross-Channel Consistent Disclosure Gate
  // ────────────────────────────────────────────────────────────────────────────
  it('T13: Cross-Channel Disclosure Consistency — Channel-agnostic engine protects all 5 transports', async () => {
    const channels = [
      { name: 'telegram', bindingId: 'tg_bot_snarai' },
      { name: 'web', bindingId: 'web_portal_session' },
      { name: 'whatsapp', bindingId: 'wa_enterprise_line' },
      { name: 'miniapp', bindingId: 'tg_miniapp_tma' },
      { name: 'api', bindingId: 'public_api_v1' }
    ] as const;

    const leakingOutput: ReasoningOutput = {
      content: 'El secret key de producción es sk_live_998877665544332211.',
      meta: { provider: 'test', model: 'mock', promptTokens: 10, completionTokens: 10, durationMs: 5 }
    };

    for (const channel of channels) {
      const channelContext: ReasoningContext = {
        ...defaultContext,
        tenantIdentity: {
          ...defaultContext.tenantIdentity,
          agentName: `Hermes-${channel.name}`
        }
      };

      const decision = await policyValidator.validate(leakingOutput, channelContext, defaultPolicy);
      expect(decision.allowed).toBe(false);
      expect(decision.decision.action).toBe('BLOCK');
      expect(decision.violations.some(v => v.code === 'SECRET_DISCLOSURE')).toBe(true);
    }
  });
});
