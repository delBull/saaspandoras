import { describe, it, expect } from 'vitest';
import { ContextHygieneValidator } from '../context-hygiene-validator';
import { CognitiveContextAdapter } from '../context-adapter';
import { ReasoningContext, RuntimeMessage } from '../contracts';

const dummyMsg: RuntimeMessage = {
  id: 'msg_t',
  role: 'USER',
  content: '¿Qué sabes?',
  createdAt: new Date(),
};

function buildFact(overrides: Record<string, any> = {}) {
  return {
    id: 'fact_1',
    dimension: 'identity',
    key: 'some_key',
    content: 'contenido operativo',
    status: 'ACTIVE',
    visibility: 'INTERNAL_OPERATIONAL',
    classification: 'INTERNAL_OPERATIONAL',
    ...overrides,
  };
}

describe('T12 Credential-Hygiene — fail-closed classification', () => {
  it('blocks CONFIDENTIAL facts when the actor is not authorized (defense-in-depth)', () => {
    const ctx = {
      systemRules: [],
      governanceRestrictions: [],
      tenantIdentity: { agentName: 'Hermes', organizationName: "Pandora's" },
      activeKnowledge: [buildFact({ id: 'c1', classification: 'CONFIDENTIAL', visibility: 'CONFIDENTIAL' })],
      activeCapabilities: [],
      interlocutor: { name: 'Lead', role: 'VIEWER', isBoss: false },
      conversationHistory: [],
      currentMessage: dummyMsg,
    } as any as ReasoningContext;

    const { sanitizedContext, violations } = ContextHygieneValidator.validate(ctx, {});
    expect(sanitizedContext.activeKnowledge).toHaveLength(0);
    expect(violations.some(v => v.code === 'CONFIDENTIAL_DISCLOSURE')).toBe(true);
  });

  it('permits CONFIDENTIAL facts when the actor is explicitly authorized', () => {
    const ctx = {
      systemRules: [],
      governanceRestrictions: [],
      tenantIdentity: { agentName: 'Hermes', organizationName: "Pandora's" },
      activeKnowledge: [buildFact({ id: 'c1', classification: 'CONFIDENTIAL', visibility: 'CONFIDENTIAL' })],
      activeCapabilities: [],
      interlocutor: { name: 'Marco', role: 'FOUNDER_BOSS', isBoss: true },
      conversationHistory: [],
      currentMessage: dummyMsg,
    } as any as ReasoningContext;

    const { sanitizedContext } = ContextHygieneValidator.validate(ctx, { allowConfidentialUse: true });
    expect(sanitizedContext.activeKnowledge).toHaveLength(1);
  });

  it('SECRET is unconditionally blocked even when CONFIDENTIAL is allowed', () => {
    const ctx = {
      systemRules: [],
      governanceRestrictions: [],
      tenantIdentity: { agentName: 'Hermes', organizationName: "Pandora's" },
      activeKnowledge: [buildFact({ id: 's1', classification: 'SECRET', visibility: 'SECRET' })],
      activeCapabilities: [],
      interlocutor: { name: 'Marco', role: 'FOUNDER_BOSS', isBoss: true },
      conversationHistory: [],
      currentMessage: dummyMsg,
    } as any as ReasoningContext;

    const { sanitizedContext } = ContextHygieneValidator.validate(ctx, {
      allowConfidentialUse: true,
      allowInternalOperationalUse: true,
    });
    expect(sanitizedContext.activeKnowledge).toHaveLength(0);
  });
});

describe('Context Adapter — unrecognized classification is NEVER treated as PUBLIC', () => {
  function publicActorContext(knowledge: any[]) {
    return {
      core: { tenantId: 'pandoras', role: 'VIEWER', identity: { name: 'Visitante' } },
      knowledge,
      activeCapabilities: [],
    } as any;
  }

  it('excludes a fact classified UNCLASSIFIED for a PUBLIC-level actor', () => {
    const effective = publicActorContext([
      buildFact({ id: 'u1', classification: 'UNCLASSIFIED', visibility: 'UNCLASSIFIED' }),
    ]);
    const { reasoningContext } = CognitiveContextAdapter.adapt(effective, [], dummyMsg);
    expect(reasoningContext.activeKnowledge.some(k => k.id === 'u1')).toBe(false);
  });

  it('still discloses a genuinely PUBLIC fact to a PUBLIC-level actor', () => {
    const effective = publicActorContext([
      buildFact({ id: 'p1', classification: 'PUBLIC', visibility: 'PUBLIC' }),
    ]);
    const { reasoningContext } = CognitiveContextAdapter.adapt(effective, [], dummyMsg);
    expect(reasoningContext.activeKnowledge.some(k => k.id === 'p1')).toBe(true);
  });
});
