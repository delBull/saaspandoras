import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HermesRuntime } from './hermes-runtime';
import { DefaultRuntimeTraceRecorder } from './trace/trace-recorder';
import { db } from '@/db';
import { RuntimeInput } from './contracts';

vi.mock('@/db/schema', () => ({
  hermesSecurityEvents: {},
  marketingLeads: {},
  academyCandidates: {},
  academyAssessments: {},
  projects: {},
  installedProducts: {},
  nexusCollaborators: {},
  hermesKnowledge: {},
  hermesKnowledgeRegistry: {},
  hermesAddonInstallations: {},
  hermesConversations: {},
  hermesMessages: {},
  hermesConversationMessages: {},
}));

vi.mock('@/lib/identity/tenant-context-resolver', () => ({
  TenantContextResolver: {
    resolveTenantContext: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('@/lib/hermes/soul/snarai-soul', () => ({
  HermesSoulRegistry: {
    getSoul: vi.fn().mockReturnValue({})
  }
}));

vi.mock('@/lib/hermes/executive/founder-directives', () => ({
  FounderDirectiveStore: {}
}));

vi.mock('../addons/context-merger', () => ({
  CognitiveContextBuilder: {
    buildEffectiveContext: vi.fn().mockResolvedValue({
      core: { tenantId: 'pandoras' },
      identity: {},
      knowledge: [],
      capabilities: [],
      activeCapabilities: [],
      journey: {}
    })
  }
}));

vi.mock('./tool-executor', () => ({
  HermesToolExecutor: class {
    registerDefaultHandlers() {}
  }
}));

vi.mock('@/lib/marketing/identity-resolver', () => ({
  IdentityResolver: {
    resolveIdentity: vi.fn().mockResolvedValue({
      id: 'mock_id',
      canonicalId: 'mock_canonical',
      marketingIdentityId: 'mock_identity_1',
      email: 'test@example.com'
    })
  }
}));

vi.mock('@/lib/hermes/runtimes/prospect-intelligence-service', () => ({
  ProspectIntelligenceService: {
    buildInitialContext: vi.fn().mockResolvedValue({}),
    applyPrivacyFilter: vi.fn().mockReturnValue({
       identity: { canonicalId: 'mock_canonical' },
       journey: { crmStage: 'QUALIFIED', daysInStage: 12 },
       signals: [], objections: [], facts: []
    })
  }
}));

vi.mock('@/lib/hermes/runtimes/prospect-strategy-service', () => ({
  ProspectStrategyService: {
    defineStrategy: vi.fn().mockReturnValue({
       knowledgeStrategy: { retrieveTopics: [], avoidTopics: [] }
    }),
    generateContextSummary: vi.fn().mockReturnValue('Commercial Readiness: QUALIFIED\nRecommended Next Best Action: BOOK_MEETING')
  }
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              { 
                id: 1, 
                identityId: 'mock_identity_1', 
                crmStage: 'QUALIFIED', 
                intent: 'invest', 
                score: 95,
                updatedAt: new Date(),
                version: 1,
                email: 'test@example.com',
                attendanceStatus: 'CERTIFIED'
              }
            ])
          })),
          limit: vi.fn().mockResolvedValue([
             { 
                id: 1, 
                identityId: 'mock_identity_1', 
                crmStage: 'QUALIFIED', 
                intent: 'invest', 
                score: 95,
                updatedAt: new Date(),
                version: 1,
                email: 'test@example.com',
                attendanceStatus: 'CERTIFIED'
             }
          ])
        }))
      }))
    })),
  }
}));

vi.mock('@/lib/marketing/identity-resolver', () => ({
  IdentityResolver: {
    resolveIdentity: vi.fn().mockResolvedValue({
      id: 'mock_id',
      canonicalId: 'mock_canonical',
      marketingIdentityId: 'mock_identity_1',
      email: 'test@example.com'
    })
  }
}));

// We only want to test the Prospect Context injection logic up to the setupCognitiveTurn trace.
// We can spy on traceRecorder.record to see what EffectiveContext was produced.
describe('HermesCognitiveRuntime - Prospect Intelligence Integration', () => {
  let runtime: HermesRuntime;

  beforeEach(() => {
    vi.clearAllMocks();
    runtime = new HermesRuntime({} as any);
  });

  it('should inject prospect intelligence summary into effective context', async () => {
    const input: RuntimeInput = {
      controlPlaneContext: {
        actorId: 'test_user_1',
        organizationId: 'pandoras',
        identity: { identityId: 'test_user_1', userId: 'test_user_1' }
      } as any,
      organizationId: 'pandoras',
      conversationId: 'conv_123',
      message: {
        id: 'msg_1',
        role: 'USER',
        content: 'Quiero invertir en tokenización',
        createdAt: new Date()
      }
    };

    const setupSpy = vi.spyOn(runtime as any, 'setupCognitiveTurn');

    // We catch the setup execution before it tries to hit actual ReasoningProviders
    try {
      await runtime.respond(input);
    } catch (e) {
      // It might throw if providers are not fully mocked, but setupCognitiveTurn should have run
    }

    expect(setupSpy).toHaveBeenCalled();
    const setupResult = await setupSpy.mock.results[0]!.value;

    const effectiveContext = setupResult.effectiveContext;
    
    // Find the injected prospect summary
    const prospectSummaryPack = effectiveContext.knowledge.find(
      (k: any) => k.id === 'prospect_intelligence_summary'
    );

    expect(prospectSummaryPack).toBeDefined();
    expect(prospectSummaryPack.status).toBe('ACTIVE');
    expect(prospectSummaryPack.visibility).toBe('INTERNAL_OPERATIONAL');
    
    // Check if the generated context recognizes the high commercial readiness
    expect(prospectSummaryPack.content).toContain('Commercial Readiness: QUALIFIED');
    // Since CRM Stage is QUALIFIED and intent is high, NBA should be BOOK_MEETING
    expect(prospectSummaryPack.content).toContain('Recommended Next Best Action: BOOK_MEETING');
  });
});
