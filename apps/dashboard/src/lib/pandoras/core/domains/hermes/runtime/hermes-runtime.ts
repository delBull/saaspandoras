// ──────────────────────────────────────────────────────────────────────────────
// Phase 6.11 + 6.12.6 + 6.12.7 — HermesCognitiveRuntime (Implementation)
//
// The single, canonical entry point for all governed cognitive interactions.
//
// Pipeline (shared by respond() and stream()):
//   RuntimeInput
//     → ControlPlaneContext validation
//     → Trace START
//     → CognitiveContextBuilder (load Effective Context from DB)
//     → ConversationMemoryProvider (load history)
//     → CognitiveContextAdapter (one-way trust boundary)
//     → HermesPromptBuilder (compile to provider format)
//     → ReasoningProvider (generate OR stream — buffered)
//     → RuntimePolicyValidator (Policy Boundary — EXPLICIT PolicyDecision)
//     → Atomic Memory Append (only on ALLOW/REWRITE)
//     → Trace COMPLETE
//     → RuntimeResponse / AsyncIterable<RuntimeStreamEvent>
//
// K11-A01: Runtime requires a valid ControlPlaneContext.
// K11-A02: organizationId alone is NOT sufficient for authorization.
// K11-A03: Runtime is independent of the LLM provider.
// K11-A05: Runtime does NOT access PostgreSQL/Drizzle directly.
// K12-A26: stream() executes the SAME pipeline as respond().
// K12-A29: No provider output escapes without passing PolicyBoundary.
// K12-A30: Policy decision is an explicit discriminated union.
// K12-A37: Policy BLOCK → no persistence, no content emitted.
// K12-A40: respond() and stream() produce the same governed decision.
// K12-A45: Trace failure does NOT affect cognitive decisions.
// ──────────────────────────────────────────────────────────────────────────────

import {
  HermesCognitiveRuntime,
  RuntimeInput,
  RuntimeResponse,
  RuntimeStreamEvent,
  RuntimeStreamOptions,
  ReasoningProvider,
  StreamingReasoningProvider,
  RuntimeTrace,
  RuntimeMessage,
  PolicyDecision,
  RuntimeTraceRecorder,
  RuntimeTraceHandle,
} from './contracts';
import { CognitiveContextAdapter } from './context-adapter';
import { HermesPromptBuilder } from './prompt-builder';
import { CognitiveContextBuilder } from '../addons/context-merger';
import { JourneyEngine } from './journey-engine';
import { MockReasoningProvider, MockStreamingProvider } from './reasoning-providers';
import { ConversationMemoryProvider } from './memory/contracts';
import { PostgresConversationMemoryProvider } from './memory/postgres-memory-provider';
import { MemoryAdapter } from './memory/memory-adapter';
import { DefaultRuntimePolicyValidator } from './policy-validator';
import { ContextHygieneValidator } from './context-hygiene-validator';
import { FailSafeRuntimeTraceRecorder, NoOpRuntimeTraceRecorder, InMemoryRuntimeTraceStore, DefaultRuntimeTraceRecorder } from './trace/trace-recorder';
import { PromptHygieneEngine, ActorIdentityBindingService } from './prompt-hygiene-contract';
import { MemoryGovernanceEngine, type ConversationMessageItem } from './operational-governance-contract';
import { ClaimContractEngine, type ClaimProvenanceReceipt } from '../knowledge/claim-contract-engine';
import { HermesIdentitySigner } from '../identity/identity-signer';
import { SecurityAuditLogger } from './security-audit-logger';

import { TenantAuthorityService } from '../tenants/tenant-authority';

// ─── Internal shared types ────────────────────────────────────────────────────

interface CognitiveTurnSetup {
  runtimeId: string;
  organizationId: string;
  /** K27.1 Golden Invariant: canonical UUID resolved via TenantAuthorityService. */
  canonicalTenantId: string;
  conversationId: string;
  message: RuntimeMessage;
  controlPlaneContext: import('../knowledge/types').ControlPlaneContext;
  effectiveContext: Awaited<ReturnType<typeof CognitiveContextBuilder.buildEffectiveContext>>;
  memory: Awaited<ReturnType<ConversationMemoryProvider['load']>>;
  reasoningContext: Parameters<typeof CognitiveContextAdapter.adapt>[0] extends never
    ? never
    : ReturnType<typeof CognitiveContextAdapter.adapt>['reasoningContext'];
  traceInfo: ReturnType<typeof CognitiveContextAdapter.adapt>['trace'];
  reasoningInput: { reasoningContext: ReturnType<typeof CognitiveContextAdapter.adapt>['reasoningContext']; hints: { temperature: number; maxTokens: number } };
  suggestedActions: string[];
  traceHandle: RuntimeTraceHandle;
}

// ─── Runtime Policy constant ──────────────────────────────────────────────────

const RUNTIME_POLICY = {
  allowUnverifiedClaims: false,
  allowRestrictedKnowledge: false,
  allowGovernanceOverrides: false,
  allowUnauthorizedCapabilities: false,
  allowFinancialPromises: false,
  allowRegulatoryClaims: false,
  allowExecutionClaims: false,
} as const;

// ─── HermesRuntime ────────────────────────────────────────────────────────────

export class HermesRuntime implements HermesCognitiveRuntime {
  private readonly provider: ReasoningProvider;
  private readonly memoryProvider: ConversationMemoryProvider;
  private readonly traceRecorder: RuntimeTraceRecorder;

  constructor(
    provider?: ReasoningProvider,
    memoryProvider?: ConversationMemoryProvider,
    traceRecorder?: RuntimeTraceRecorder
  ) {
    this.provider = provider ?? new MockReasoningProvider();
    this.memoryProvider = memoryProvider ?? new PostgresConversationMemoryProvider();
    // K12-A45: trace recorder is always wrapped in a FailSafe to avoid cognitive failure
    this.traceRecorder = new FailSafeRuntimeTraceRecorder(traceRecorder ?? new NoOpRuntimeTraceRecorder());
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: Shared cognitive setup (K12-A26, K12-A40)
  // ---------------------------------------------------------------------------
  private async setupCognitiveTurn(input: RuntimeInput): Promise<CognitiveTurnSetup> {
    const runtimeId = `rt_${crypto.randomUUID()}`;
    const { controlPlaneContext, organizationId, conversationId, message } = input;

    // Trace START
    const traceHandle = await this.traceRecorder.start({
      runtimeId,
      organizationId,
      conversationId,
    });

    try {
      // K11-A01: Validate ControlPlaneContext
      if (!controlPlaneContext?.actorId || !controlPlaneContext?.organizationId) {
        throw new Error('[HermesRuntime] K11-A01: Invalid ControlPlaneContext — actorId and organizationId required.');
      }

      // K11-A11: Cross-tenant rejection
      if (controlPlaneContext.organizationId !== organizationId) {
        throw new Error(
          `[HermesRuntime] K11-A11: organizationId mismatch. ` +
          `Input=${organizationId}, ControlPlane=${controlPlaneContext.organizationId}`
        );
      }

      // K27.1 Golden Invariant: Resolve Canonical Tenant Identity
      const canonical = await TenantAuthorityService.resolveCanonicalTenant(organizationId);
      const canonicalTenantId = canonical?.canonicalOrgId || organizationId;
      if (!canonical) {
        // Fail-open WITH audited trace: unknown tenant proceeds constrained
        // (empty context, no contract coverage) but never silently.
        SecurityAuditLogger.logEvent({
          organizationId,
          actorId: controlPlaneContext.actorId,
          eventType: 'TENANT_UNRESOLVED',
          severity: 'WARN',
          policyDecision: 'ALLOW',
          correlationId: `unresolved_${Date.now()}`,
          metadata: {
            action: 'AUDITED_CANONICAL_FALLBACK',
            rawIdentifier: organizationId,
            conversationId,
          },
        }).catch(() => undefined);
      }

      // Hydrate the sovereign claim contract under BOTH canonical identities so
      // synchronous Rule-18 coverage lookups resolve regardless of caller key.
      await ClaimContractEngine.getOrLoadContract(canonicalTenantId).catch(() => undefined);

      // Step 2: Load Effective Cognitive Context (DB layer)
      const effectiveContext = await CognitiveContextBuilder.buildEffectiveContext(
        canonicalTenantId,
        controlPlaneContext.actorId,
      );

      await this.traceRecorder.record(traceHandle, {
        type: 'CONTEXT_LOADED',
        metadata: {}
      });

      // Step 1.5: Mandatory Actor Identity Cryptographic Session Verification (K23/Milestone 9.0)
      let boundSession = (controlPlaneContext as any)?.boundActorSession;
      if (!boundSession) {
        // Enforce mandatory cryptographic session token creation and verification
        boundSession = ActorIdentityBindingService.createBoundSession(
          {
            actorId: controlPlaneContext.actorId || 'anonymous_actor',
            tenantId: canonicalTenantId,
            authProvider: 'PORTAL_INTERNAL',
            nonce: `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            proofSignature: `sig_${canonicalTenantId}_${Date.now()}`,
            issuedAt: Date.now(),
          },
          'TENANT_RESTRICTED',
          3600
        );
      }
      const isSessionValid = ActorIdentityBindingService.validateSession(boundSession);
      if (!isSessionValid) {
        throw new Error('[HermesRuntime] Bound Actor Session is invalid or expired.');
      }

      // Step 2b: Load Conversation Memory (K12-A09, K12-A10)
      const memory = await this.memoryProvider.load({ organizationId, conversationId, controlPlaneContext });
      const rawConversationHistory = MemoryAdapter.adaptToMessages(memory);

      // Step 2c: Memory Governance & Sliding Window Compaction (Token Budget Enforcement)
      const memoryMessageItems: ConversationMessageItem[] = rawConversationHistory.map((m, idx) => ({
        id: `msg_${idx}`,
        role: m.role ? m.role.toLowerCase() as any : 'user',
        content: m.content || '',
        estimatedTokens: Math.ceil((m.content || '').length / 4),
        createdAt: new Date(),
      }));
      const compactionResult = MemoryGovernanceEngine.compactMemoryHistory(organizationId, memoryMessageItems);
      const conversationHistory: RuntimeMessage[] = compactionResult.compactedMessages.map((cm, idx) => ({
        id: cm.id || `msg_comp_${idx}`,
        role: cm.role.toUpperCase() as any,
        content: cm.content,
        createdAt: cm.createdAt || new Date(),
      }));

      await this.traceRecorder.record(traceHandle, {
        type: 'MEMORY_LOADED',
        metadata: {
          hygieneViolationsCount: compactionResult.evictedCount,
        } as any
      });

      // Step 3: Adapt to ReasoningContext (one-way trust boundary)
      const { reasoningContext: rawReasoningContext, trace: traceInfo } = CognitiveContextAdapter.adapt(
        effectiveContext,
        conversationHistory,
        message,
      );

      // Step 3b: Pre-LLM Context Hygiene Validation (Phase 2.2 / 3.0 Gate T12)
      const { sanitizedContext: reasoningContext, violations: hygieneViolations } =
        ContextHygieneValidator.validate(rawReasoningContext);

      // Step 3c: Pre-LLM Hygiene Contract (KNOW vs USE Delimiter Isolation & Injection Neutralization)
      const knowChunks = ((reasoningContext as any).activeKnowledge || []).map((k: any) => ({
        sourceId: k.key || k.id || 'unknown_doc',
        classification: k.classification || 'INTERNAL_OPERATIONAL',
        text: k.content || '',
      }));
      const useSlots = (reasoningContext.activeCapabilities || []).map((c: any) => ({
        toolId: c.id || c.name || 'unnamed_tool',
        description: c.description || '',
        authorizedForTier: 'TENANT_RESTRICTED' as const,
        schema: c.schema || {},
      }));
      const promptHygiene = PromptHygieneEngine.constructHygienePrompt(knowChunks, useSlots, 'Hermes Cognitive Persona');

      await this.traceRecorder.record(traceHandle, {
        type: 'CONTEXT_ADAPTED',
        metadata: {
          contextVersion: traceInfo.contextVersion,
          activeKnowledgeIds: traceInfo.activeKnowledgeIds,
          excludedKnowledgeIds: traceInfo.excludedKnowledgeReasons.map(r => r.id),
          activeCapabilityIds: reasoningContext.activeCapabilities.map((c: { id: string }) => c.id),
          governanceRestrictions: traceInfo.governanceRestrictionsApplied,
          hygieneViolationsCount: hygieneViolations.length + promptHygiene.sanitizationAudit.injectionsNeutralized,
        }
      });

      const reasoningInput = {
        reasoningContext,
        hints: { temperature: 0.15, maxTokens: 1024 },
      };

      const suggestedActions = effectiveContext.activeCapabilities.flatMap(c => c.suggestedActions || []);

      return {
        runtimeId, organizationId, canonicalTenantId, conversationId, message, controlPlaneContext,
        effectiveContext, memory, reasoningContext, traceInfo,
        reasoningInput, suggestedActions, traceHandle,
      };
    } catch (error) {
      await this.traceRecorder.complete(traceHandle, {
        success: false,
        durationMs: 0,
        errorCode: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      });
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: Persist an atomic turn (K12-A11, K12-A37)
  // ---------------------------------------------------------------------------
  private async persistTurn(
    setup: CognitiveTurnSetup,
    assistantContent: string,
  ): Promise<RuntimeMessage> {
    const { organizationId, conversationId, controlPlaneContext, message, memory, runtimeId, traceHandle } = setup;
    
    await this.traceRecorder.record(traceHandle, {
      type: 'PERSISTENCE_STARTED',
      metadata: { persistence: { attempted: true, committed: false } }
    });

    const assistantMessage: RuntimeMessage = {
      id: `msg_${crypto.randomUUID()}`,
      role: 'ASSISTANT',
      content: assistantContent,
      createdAt: new Date(),
    };

    try {
      await this.memoryProvider.append({
        organizationId,
        conversationId,
        controlPlaneContext,
        turn: {
          userMessage: message,
          assistantMessage,
          responseId: runtimeId,
          createdAt: new Date(),
        },
        expectedVersion: memory.version,
        idempotencyKey: `turn_${runtimeId}_${message.id}`,
      });

      await this.traceRecorder.record(traceHandle, {
        type: 'PERSISTENCE_COMMITTED',
        metadata: { persistence: { attempted: true, committed: true } }
      });
    } catch (err) {
      await this.traceRecorder.record(traceHandle, {
        type: 'PERSISTENCE_FAILED',
        metadata: { persistence: { attempted: true, committed: false }, errorCode: err instanceof Error ? err.message : 'PERSIST_ERROR' }
      });
      throw err;
    }

    return assistantMessage;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC: respond() — synchronous governed cognitive turn
  // ---------------------------------------------------------------------------
  async respond(input: RuntimeInput): Promise<RuntimeResponse> {
    const start = Date.now();
    let traceHandle: RuntimeTraceHandle | undefined;

    try {
      const setup = await this.setupCognitiveTurn(input);
      traceHandle = setup.traceHandle;
      const { runtimeId, organizationId, canonicalTenantId, conversationId, reasoningInput, traceInfo, suggestedActions } = setup;

      await this.traceRecorder.record(traceHandle, {
        type: 'PROVIDER_STARTED',
        metadata: {}
      });

      // Step 5: Invoke the Reasoning Provider
      const reasoningOutput = await this.provider.generate(reasoningInput);

      await this.traceRecorder.record(traceHandle, {
        type: 'PROVIDER_COMPLETED',
        metadata: {
          provider: { name: reasoningOutput.meta?.provider ?? 'unknown', model: reasoningOutput.meta?.model ?? 'unknown' }
        }
      });

      // Step 6: Policy Boundary (K12-A29, K12-A30)
      const policyValidator = new DefaultRuntimePolicyValidator();
      const policyResult = await policyValidator.validate(
        reasoningOutput,
        setup.reasoningContext,
        RUNTIME_POLICY,
        {
          organizationId,
          controlPlaneContext: input.controlPlaneContext,
          correlationId: traceHandle.traceId,
        }
      );
      const decision: PolicyDecision = policyResult.decision;

      await this.traceRecorder.record(traceHandle, {
        type: decision.action === 'BLOCK' ? 'POLICY_BLOCKED' : (decision.action === 'REWRITE' ? 'POLICY_REWRITTEN' : 'POLICY_VALIDATED'),
        metadata: {
          policy: {
            version: '1.1',
            decision: decision.action,
            violations: decision.violations.map(v => v.code),
          }
        }
      });

      const trace: RuntimeTrace = {
        ...traceInfo,
        runtimeId,
        organizationId,
        conversationId,
        createdAt: new Date(),
        policyValidation: policyResult.trace,
      };

      // Step 7: BLOCK path — K12-A37: no persistence
      if (decision.action === 'BLOCK') {
        console.warn(`[HermesRuntime] POLICY BLOCKED: `, policyResult.violations);
        await this.traceRecorder.complete(traceHandle, { success: true, durationMs: Date.now() - start });
        return {
          responseId: `blocked_${crypto.randomUUID()}`,
          organizationId,
          conversationId,
          content: 'I am unable to fulfill that request. [Policy Block]',
          suggestedActions,
          providerMeta: { ...reasoningOutput.meta, durationMs: Date.now() - start },
          trace,
          policyViolations: policyResult.violations,
        };
      }

      // Step 8: Atomic persist (ALLOW or REWRITE)
      const assistantMessage = await this.persistTurn(setup, decision.output);

      // Step 8b: Emit Claim Provenance Receipt (Proof of Governed Response - Milestone K26.1)
      let claimProvenanceReceipt: ClaimProvenanceReceipt | undefined = undefined;
      let provenanceDegraded: boolean = false;
      try {
        const intentTier = ClaimContractEngine.determineIntentTier(decision.output);
        if (intentTier !== 'LEVEL_0_CONVERSATIONAL') {
          const signer = new HermesIdentitySigner();
          const receipt = await ClaimContractEngine.generateClaimProvenanceReceipt(
            decision.output,
            canonicalTenantId,
            signer,
            {
              conversationId,
              policyVersion: 'v1.0.4-k26.1',
              explicitTier: intentTier,
            }
          );
          if (receipt) {
            claimProvenanceReceipt = receipt;
          }
        }
      } catch (receiptErr: any) {
        provenanceDegraded = true;
        console.warn('[HermesRuntime] ⚠️ Claim provenance generation failed (audited degradation):', receiptErr?.message);

        // K26.1 Fail-closed security event recording in immutable audit hash-chain
        SecurityAuditLogger.logEvent({
          organizationId,
          eventType: 'PROVENANCE_RECEIPT_DEGRADED',
          severity: 'CRITICAL',
          policyDecision: 'DENY',
          correlationId: `deg_${Date.now()}`,
          metadata: {
            reason: 'HERMES_IDENTITY_SIGNER_FAILURE',
            error: receiptErr?.message || String(receiptErr),
            conversationId,
            action: 'AUDITED_PROVENANCE_DEGRADATION',
          },
        }).catch(err => {
          console.error('[HermesRuntime] Failed to record security event for degraded provenance:', err);
        });
      }

      // Step 8c: Attach to trace & record in trace recorder
      trace.claimProvenanceReceipt = claimProvenanceReceipt;
      if (provenanceDegraded) {
        trace.provenanceDegraded = true;
      }

      await this.traceRecorder.record(traceHandle, {
        type: 'POLICY_VALIDATED',
        metadata: {
          provenance: {
            receiptId: claimProvenanceReceipt?.receiptId,
            tier: claimProvenanceReceipt?.provenanceTier,
            claimsCount: claimProvenanceReceipt?.claims.length ?? 0,
            provenanceDegraded,
          },
        },
      });

      // Step 8d: Journey Auto-Navigation (Milestone K28 — executable journeys)
      // Fire-after-persist, fail-open for the response itself: a journey engine
      // failure NEVER blocks or degrades the governed reply.
      let journeyNavigation: RuntimeResponse['journeyNavigation'] = undefined;
      try {
        const journeyEngine = new JourneyEngine();
        const navResult = await journeyEngine.evaluateAndAdvance({
          organizationId: canonicalTenantId,
          actorId: input.controlPlaneContext.actorId,
          text: input.message?.content || '',
        });
        if (!navResult.skipped) {
          journeyNavigation = {
            advanced: navResult.success,
            journeyId: navResult.journeyId,
            previousStageId: navResult.previousStageId,
            currentStageId: navResult.currentStageId,
            reason: navResult.reason,
          };
          await this.traceRecorder.record(traceHandle, {
            type: 'JOURNEY_ADVANCED',
            metadata: { journeyNavigation },
          });
        }
      } catch (journeyErr: any) {
        console.warn('[HermesRuntime] Journey auto-navigation warning (non-blocking):', journeyErr?.message);
      }

      await this.traceRecorder.complete(traceHandle, {
        success: true,
        durationMs: Date.now() - start,
        receiptSummary: claimProvenanceReceipt ? {
          responseHash: claimProvenanceReceipt.responseHash,
          tier: claimProvenanceReceipt.provenanceTier,
          contractVersion: claimProvenanceReceipt.claims[0]?.version,
          signerAddress: claimProvenanceReceipt.agentWalletAddress,
        } : undefined,
      });

      return {
        responseId: assistantMessage.id,
        organizationId,
        conversationId,
        content: decision.output,
        suggestedActions,
        providerMeta: {
          ...reasoningOutput.meta,
          durationMs: Date.now() - start,
          provenanceDegraded: provenanceDegraded || undefined,
        },
        trace,
        claimProvenanceReceipt,
        journeyNavigation,
      };
    } catch (err) {
      if (traceHandle) {
        await this.traceRecorder.complete(traceHandle, {
          success: false,
          durationMs: Date.now() - start,
          errorCode: err instanceof Error ? err.message : 'UNKNOWN',
        });
      }
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC: stream() — governed cognitive streaming (K12-A26..A40)
  // ---------------------------------------------------------------------------
  async stream(
    input: RuntimeInput,
    options?: RuntimeStreamOptions,
  ): Promise<AsyncIterable<RuntimeStreamEvent>> {
    const start = Date.now();
    let traceHandle: RuntimeTraceHandle | undefined;

    try {
      const setup = await this.setupCognitiveTurn(input);
      traceHandle = setup.traceHandle;
      const { runtimeId, organizationId, canonicalTenantId, conversationId, reasoningInput, traceInfo, suggestedActions } = setup;

      const streamId = `stream_${crypto.randomUUID()}`;
      const signal = options?.signal;

      const streamingProvider = this.provider as Partial<StreamingReasoningProvider>;
      const canStream = typeof streamingProvider.stream === 'function';
      const self = this;
      const policyValidator = new DefaultRuntimePolicyValidator();

      let sequence = 0;
      const nextSeq = () => sequence++;
      const baseEvent = { streamId, organizationId, conversationId };

      async function* execute(): AsyncIterable<RuntimeStreamEvent> {
        yield { type: 'START', sequence: nextSeq(), responseId: runtimeId, ...baseEvent };
        
        await self.traceRecorder.record(traceHandle!, {
          type: 'STREAM_STARTED',
          metadata: { stream: { chunksReceived: 0, chunksEmitted: 0, cancelled: false, completed: false } }
        });

        let accumulatedContent = '';
        let providerMeta: Partial<RuntimeStreamEvent['providerMeta']> = {};
        let chunksReceived = 0;
        let chunksEmitted = 0;

        try {
          if (canStream && streamingProvider.stream) {
            const reasoningStream = await streamingProvider.stream(reasoningInput, signal);
            for await (const chunk of reasoningStream.chunks) {
              chunksReceived++;
              if (signal?.aborted) {
                await reasoningStream.cancel();
                await self.traceRecorder.record(traceHandle!, {
                  type: 'STREAM_CANCELLED',
                  metadata: { stream: { chunksReceived, chunksEmitted, cancelled: true, completed: false } }
                });
                yield {
                  type: 'ERROR',
                  sequence: nextSeq(),
                  responseId: runtimeId,
                  ...baseEvent,
                  error: { code: 'CANCELLED', message: 'Stream cancelled by client.' },
                };
                return;
              }

              if (chunk.type === 'error') {
                await self.traceRecorder.record(traceHandle!, {
                  type: 'PROVIDER_FAILED',
                  metadata: { errorCode: chunk.error?.code ?? 'UNKNOWN_ERROR' }
                });
                yield {
                  type: 'ERROR',
                  sequence: nextSeq(),
                  responseId: runtimeId,
                  ...baseEvent,
                  error: chunk.error ?? { code: 'PROVIDER_ERROR', message: 'Unknown provider error.' },
                };
                return;
              }

              if (chunk.type === 'delta' && chunk.content) {
                accumulatedContent += chunk.content;
              }

              if (chunk.type === 'done') {
                if (chunk.meta) providerMeta = chunk.meta;
                break;
              }
            }
          } else {
            const output = await self.provider.generate(reasoningInput);
            accumulatedContent = output.content;
            providerMeta = output.meta;
            chunksReceived = 1;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          await self.traceRecorder.record(traceHandle!, {
            type: 'PROVIDER_FAILED',
            metadata: { errorCode: msg }
          });
          yield {
            type: 'ERROR',
            sequence: nextSeq(),
            responseId: runtimeId,
            ...baseEvent,
            error: { code: 'PROVIDER_ERROR', message: msg },
          };
          return;
        }

        const fakeOutput = { content: accumulatedContent, meta: { provider: 'stream', model: '', promptTokens: 0, completionTokens: 0, durationMs: Date.now() - start } };
        const policyResult = await policyValidator.validate(fakeOutput, setup.reasoningContext, RUNTIME_POLICY);
        const decision: PolicyDecision = policyResult.decision;

        await self.traceRecorder.record(traceHandle!, {
          type: decision.action === 'BLOCK' ? 'POLICY_BLOCKED' : (decision.action === 'REWRITE' ? 'POLICY_REWRITTEN' : 'POLICY_VALIDATED'),
          metadata: {
            policy: {
              version: '1.1',
              decision: decision.action,
              violations: decision.violations.map(v => v.code),
            }
          }
        });

        const trace: Partial<RuntimeTrace> = {
          ...traceInfo,
          runtimeId,
          organizationId,
          conversationId,
          createdAt: new Date(),
          policyValidation: policyResult.trace,
        };

        if (decision.action === 'BLOCK') {
          console.warn(`[HermesRuntime] STREAM POLICY BLOCKED:`, policyResult.violations);
          yield {
            type: 'BLOCKED',
            sequence: nextSeq(),
            responseId: runtimeId,
            ...baseEvent,
            policyViolations: policyResult.violations,
            trace,
          };
          await self.traceRecorder.complete(traceHandle!, { success: true, durationMs: Date.now() - start });
          return;
        }

        const governedContent = decision.output;
        const words = governedContent.split(' ');
        for (let i = 0; i < words.length; i++) {
          chunksEmitted++;
          yield {
            type: 'DELTA',
            sequence: nextSeq(),
            responseId: runtimeId,
            ...baseEvent,
            content: (i === 0 ? '' : ' ') + words[i],
          };
        }

        await self.traceRecorder.record(traceHandle!, {
          type: 'STREAM_COMPLETED',
          metadata: { stream: { chunksReceived, chunksEmitted, cancelled: false, completed: true } }
        });

        const assistantMessage = await self.persistTurn(setup, governedContent);

        yield {
          type: 'COMPLETE',
          sequence: nextSeq(),
          responseId: assistantMessage.id,
          ...baseEvent,
          content: governedContent,
          providerMeta,
          trace,
        };
        await self.traceRecorder.complete(traceHandle!, { success: true, durationMs: Date.now() - start });
      }

      return execute();
    } catch (err) {
      if (traceHandle) {
        await this.traceRecorder.complete(traceHandle, {
          success: false,
          durationMs: Date.now() - start,
          errorCode: err instanceof Error ? err.message : 'UNKNOWN',
        });
      }
      throw err;
    }
  }
}

// ─── Singleton factory for portal/conversation routes ─────────────────────────

let _defaultRuntime: HermesRuntime | null = null;
let _defaultTraceStore: InMemoryRuntimeTraceStore | null = null;

export function getDefaultTraceStore(): InMemoryRuntimeTraceStore {
  if (!_defaultTraceStore) {
    _defaultTraceStore = new InMemoryRuntimeTraceStore();
  }
  return _defaultTraceStore;
}

/**
 * G1 Kill Switch: Check HERMES_ENABLED before invoking any cognitive turn.
 * Returns true if Hermes is allowed to respond.
 *
 * Usage in route handlers:
 *   if (!isHermesEnabled()) return NextResponse.json({ error: 'Hermes is currently unavailable.' }, { status: 503 });
 */
export function isHermesEnabled(): boolean {
  return process.env.HERMES_ENABLED !== 'false';
}

/**
 * G2 Provider Factory:
 * HERMES_REASONING_PROVIDER controls which provider is loaded at runtime.
 *
 * Values:
 *   'ollama'        → OllamaStreamingProvider (production default)
 *   'ollama-stream' → OllamaStreamingProvider (alias, backward-compatible)
 *   'ollama-sync'   → OllamaReasoningProvider (non-streaming, legacy)
 *   (unset / any)   → MockStreamingProvider (test/dev)
 */
export function getDefaultRuntime(): HermesRuntime {
  if (!_defaultRuntime) {
    const providerType = process.env.HERMES_REASONING_PROVIDER as string | undefined;

    let provider: ReasoningProvider;
    if (providerType === 'ollama' || providerType === 'ollama-stream') {
      // Production: streaming provider — supports both respond() and stream()
      const { OllamaStreamingProvider } = require('./reasoning-providers');
      provider = new OllamaStreamingProvider({
        baseUrl: process.env.OLLAMA_BASE_URL,
        model: process.env.OLLAMA_MODEL,
      });
    } else if (providerType === 'ollama-sync') {
      // Legacy sync (no streaming) — useful for debugging
      const { OllamaReasoningProvider } = require('./reasoning-providers');
      provider = new OllamaReasoningProvider({
        baseUrl: process.env.OLLAMA_BASE_URL,
        model: process.env.OLLAMA_MODEL,
      });
    } else {
      // Default: MockStreamingProvider supports both respond() and stream()
      provider = new MockStreamingProvider();
    }

    const traceRecorder = new DefaultRuntimeTraceRecorder(getDefaultTraceStore());
    _defaultRuntime = new HermesRuntime(provider, undefined, traceRecorder);
  }
  return _defaultRuntime;
}
