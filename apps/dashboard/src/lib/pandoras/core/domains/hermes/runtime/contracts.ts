// ──────────────────────────────────────────────────────────────────────────────
// Phase 6.11 — Hermes Cognitive Runtime Contracts
// 
// K11-ARCH-02: Context Boundary — LLM only receives an Effective Cognitive
//              Context built by Hermes.
// K11-ARCH-03: Provider Agnostic — Hermes does not depend architecturally
//              on any specific LLM vendor.
// ──────────────────────────────────────────────────────────────────────────────

import { ControlPlaneContext } from '../knowledge/types';

// ---------------------------------------------------------------------------
// 1. Runtime Message (provider-agnostic, no OpenAI/Anthropic types here)
// ---------------------------------------------------------------------------

export type RuntimeMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface RuntimeMessage {
  id: string;
  role: RuntimeMessageRole;
  content: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// 2. Runtime Input — What enters the Cognitive Runtime
// ---------------------------------------------------------------------------

export interface RuntimeInput {
  /** Tenant identifier. NOT sufficient for authorization on its own. */
  organizationId: string;
  conversationId: string;
  message: RuntimeMessage;
  /**
   * MUST be a pre-validated ControlPlaneContext.
   * The runtime will NOT authenticate; it assumes the caller has done so.
   */
  controlPlaneContext: ControlPlaneContext;
}

// ---------------------------------------------------------------------------
// 3. Runtime Response — What leaves the Cognitive Runtime
// ---------------------------------------------------------------------------

export interface RuntimeResponse {
  responseId: string;
  organizationId: string;
  conversationId: string;
  /**
   * The governed response text ready for the Tenant.
   */
  content: string;
  /**
   * Suggested next actions derived from ACTIVE capabilities in the ReasoningContext.
   * K12-A08: The Runtime determines what actions are legitimate; the UI only represents them.
   * The Portal MUST NOT fabricate or override these values.
   */
  suggestedActions: string[];
  /**
   * Metadata from the reasoning provider (tokens, model, etc.)
   * Does not include raw prompt or internal DB data.
   */
  providerMeta: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
  };
  /**
   * Runtime trace: auditable record of what context was used.
   * K11-A24: trace allows reconstructing which context produced the response.
   */
  trace: RuntimeTrace;
  /**
   * Violations detected by the RuntimePolicyValidator.
   * If present, the content was likely blocked or rewritten.
   */
  policyViolations?: import('./contracts').PolicyViolation[];
}

export interface RuntimeTrace {
  runtimeId: string;
  organizationId: string;
  conversationId: string;
  activeKnowledgeIds: string[];
  activeAddonIds: string[];
  governanceRestrictionsApplied: string[];
  excludedKnowledgeReasons: Array<{ id: string; reason: string }>;
  excludedAddonReasons: Array<{ id: string; reason: string }>;
  contextVersion: string;
  createdAt: Date;
  policyValidation?: {
    validatedAt: Date;
    policyVersion: string;
    claimsChecked: number;
    violationsDetected: number;
  };
}

// ---------------------------------------------------------------------------
// 3.5 Formal 6-Tier Knowledge Classification Taxonomy (Phase 2.2 / 3.0)
// ---------------------------------------------------------------------------
export type KnowledgeClassificationTier =
  | 'PUBLIC'
  | 'TENANT_RESTRICTED'
  | 'B2B_RESTRICTED'
  | 'INTERNAL_OPERATIONAL'
  | 'ACADEMY_EVALUATE_ONLY'
  | 'CONFIDENTIAL'
  | 'SECRET';

export const CLASSIFICATION_LATTICE_RANK: Record<KnowledgeClassificationTier, number> = {
  PUBLIC: 1,
  TENANT_RESTRICTED: 2,
  B2B_RESTRICTED: 3,
  INTERNAL_OPERATIONAL: 4,
  ACADEMY_EVALUATE_ONLY: 4,
  CONFIDENTIAL: 5,
  SECRET: 6,
};

export interface ToolAuthorizationRequest {
  organizationId: string;
  actorId: string;
  capabilityId: string;
  toolName: string;
  parameters?: Record<string, unknown>;
  clearanceLevel?: string;
}

export interface ToolAuthorizationDecision {
  authorized: boolean;
  reason: string;
  violationCode?: PolicyViolationCode;
}

// ---------------------------------------------------------------------------
// 4. Reasoning Context — The firewall output fed to the provider
//    Authority(ReasoningContext) <= Authority(EffectiveCognitiveContext)
// ---------------------------------------------------------------------------

export interface GovernedKnowledgeFact {
  id: string;
  dimension: string;
  key: string;
  content: string;
  /** Only ACTIVE facts enter ReasoningContext. This is always 'ACTIVE'. */
  status: 'ACTIVE';
  visibility: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | KnowledgeClassificationTier;
  classification?: KnowledgeClassificationTier;
}

export interface GovernedCapability {
  id: string;
  description: string;
  suggestedActions?: string[];
  requiresClearance?: string;
  isRestricted?: boolean;
}

export interface ReasoningContext {
  /**
   * Ordered by precedence (index 0 = highest authority).
   * K11-ARCH-06: Authority is not prompted; it comes from Governance.
   */
  systemRules: string[];         // ADR-011 / platform invariants
  governanceRestrictions: string[]; // Tenant-specific restrictions
  tenantIdentity: {
    agentName: string;
    organizationName: string;
    language?: string;
    tone?: string;
  };
  /**
   * ONLY ACTIVE knowledge. Adapter guarantees this.
   * K11-A06, K11-A07, K11-A08
   */
  activeKnowledge: GovernedKnowledgeFact[];
  /**
   * ONLY ACTIVE add-on capabilities.
   * K11-A09: SUSPENDED/DEACTIVATED never enter.
   */
  activeCapabilities: GovernedCapability[];
  /**
   * Style overlay: does NOT override governance or identity.
   * K11-A16
   */
  styleOverlay?: {
    tone?: string;
    language?: string;
  };
  conversationHistory: RuntimeMessage[];
  currentMessage: RuntimeMessage;
}

// ---------------------------------------------------------------------------
// 5. Reasoning Provider Interface — The only LLM boundary
// ---------------------------------------------------------------------------

export interface ReasoningProviderConfig {
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  defaultTemperature?: number;
}

export interface ReasoningInput {
  reasoningContext: ReasoningContext;
  /** Optional provider hints (temperature, max_tokens). Runtime sets defaults. */
  hints?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}

export interface ReasoningOutput {
  content: string;
  meta: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
  };
}

/**
 * K11-ARCH-03: Provider Agnostic contract.
 * 
 * The provider receives ReasoningContext. It does NOT discover context.
 * It does NOT access PostgreSQL, Drizzle, or any Hermes service.
 * It does NOT promote knowledge or grant authority.
 */
export interface ReasoningProvider {
  generate(input: ReasoningInput): Promise<ReasoningOutput>;
}

// ---------------------------------------------------------------------------
// 6. Hermes Cognitive Runtime — The only public entry point for cognition
// ---------------------------------------------------------------------------

/**
 * The Hermes Cognitive Runtime is the single public boundary for executing
 * a governed cognitive interaction.
 *
 * K11-A01: Runtime requires a valid ControlPlaneContext.
 * K11-A02: organizationId alone is NOT sufficient for authorization.
 * K11-A03: Runtime is independent of the LLM provider.
 * K11-A05: Runtime does not access PostgreSQL/Drizzle directly.
 */
export interface RuntimeStreamOptions {
  /** AbortSignal propagated from Browser → Portal → Runtime → Provider. */
  signal?: AbortSignal;
}

export interface HermesCognitiveRuntime {
  respond(input: RuntimeInput): Promise<RuntimeResponse>;

  /**
   * K12-A26: stream() executes through the SAME Cognitive Runtime pipeline as respond().
   * The Provider is never exposed to the Portal.
   * Every event carries tenant-scoped identifiers generated by Hermes.
   */
  stream(
    input: RuntimeInput,
    options?: RuntimeStreamOptions
  ): Promise<AsyncIterable<RuntimeStreamEvent>>;
}

// ---------------------------------------------------------------------------
// 7. Policy Validator Contracts (Phase 6.11.6)
// ---------------------------------------------------------------------------

export interface RuntimePolicy {
  allowUnverifiedClaims: false;
  allowRestrictedKnowledge: false;
  allowGovernanceOverrides: false;
  allowUnauthorizedCapabilities: false;
  allowFinancialPromises: false;
  allowRegulatoryClaims: false;
  allowExecutionClaims: false;
}

export type PolicyViolationCode =
  | 'UNSUPPORTED_CLAIM'
  | 'PENDING_KNOWLEDGE_CLAIM'
  | 'RESTRICTED_KNOWLEDGE'
  | 'GOVERNANCE_OVERRIDE'
  | 'UNAUTHORIZED_CAPABILITY'
  | 'FINANCIAL_PROMISE'
  | 'REGULATORY_CLAIM'
  | 'EXECUTION_AUTHORITY'
  | 'IDENTITY_OVERRIDE'
  | 'SYSTEM_PROMPT_DISCLOSURE'
  | 'SECRET_DISCLOSURE'
  | 'INTERNAL_OPERATIONAL_DISCLOSURE'
  | 'ACADEMY_EVALUATE_ONLY_DISCLOSURE'
  | 'FORBIDDEN_LEGAL_FRAMEWORK'
  | 'FORBIDDEN_HOSPITALITY_MODEL'
  | 'FORBIDDEN_PRODUCT_INVENTION'
  | 'FORBIDDEN_FINANCIAL_PROMISE'
  | 'EPISTEMIC_MUTATION_TO_GUARANTEE';

export interface PolicyViolation {
  code: PolicyViolationCode;
  severity: 'BLOCK' | 'REDACT' | 'REWRITE';
  message: string;
  source?: string;
}

/**
 * K12-A30: Explicit policy decision — the Runtime MUST NOT infer BLOCK from
 * empty output, regex side-effects, or missing content.
 * This discriminated union makes ALLOW / REWRITE / BLOCK unambiguous.
 */
export type PolicyDecision =
  | { action: 'ALLOW';   output: string; violations: PolicyViolation[] }
  | { action: 'REWRITE'; output: string; violations: PolicyViolation[] }
  | { action: 'BLOCK';   output: string; violations: PolicyViolation[] };

export interface PolicyValidationResult {
  /** @deprecated — use `decision.action` for explicit state-machine checks. */
  allowed: boolean;
  decision: PolicyDecision;
  output: string;
  violations: PolicyViolation[];
  trace: {
    validatedAt: Date;
    policyVersion: string;
    claimsChecked: number;
    violationsDetected: number;
  };
}

export interface PolicyValidationOptions {
  channel?: string;
  channelMaxClassification?: KnowledgeClassificationTier;
  organizationId?: string;
  actorId?: string;
  correlationId?: string;
}

export interface RuntimePolicyValidator {
  validate(
    output: ReasoningOutput,
    context: ReasoningContext,
    policy: RuntimePolicy,
    options?: PolicyValidationOptions
  ): Promise<PolicyValidationResult>;
}

// ---------------------------------------------------------------------------
// 8. Streaming Contracts (Phase 6.12.6)
// ---------------------------------------------------------------------------

/**
 * A single chunk from a reasoning provider's streaming output.
 * K12-A27: Provider never receives ControlPlaneContext.
 * K12-A28: Provider chunks are buffered — the ContextAdapter is not bypassed.
 */
export interface ReasoningStreamChunk {
  type: 'delta' | 'done' | 'error';
  content?: string;
  meta?: Partial<ReasoningOutput['meta']>;
  error?: { code: string; message: string };
}

export interface ReasoningStream {
  chunks: AsyncIterable<ReasoningStreamChunk>;
  /** Propagates cancellation to the underlying provider / Ollama connection. */
  cancel(): Promise<void>;
}

/**
 * K11-ARCH-03 extended: provider-agnostic streaming.
 * Implementations MUST NOT expose Ollama/OpenAI types here.
 */
export interface StreamingReasoningProvider extends ReasoningProvider {
  stream(input: ReasoningInput, signal?: AbortSignal): Promise<ReasoningStream>;
}

// ---------------------------------------------------------------------------
// 9. Runtime Stream Events (Phase 6.12.6)
// ---------------------------------------------------------------------------

export type RuntimeStreamEventType =
  | 'START'
  | 'DELTA'
  | 'COMPLETE'
  | 'BLOCKED'
  | 'ERROR';

/**
 * The only type the Portal ever receives from a governed stream.
 *
 * Rules:
 *   - sequence MUST be monotonically increasing.
 *   - streamId / responseId MUST be generated by Hermes (never by the provider).
 *   - organizationId MUST match the validated ControlPlaneContext.
 *   - Raw provider events MUST NOT escape the Runtime.
 *
 * K12-A31: monotonic sequence.
 * K12-A32: Hermes-generated stream identity.
 * K12-A33: organizationId scoped to ControlPlaneContext.
 */
export interface RuntimeStreamEvent {
  type: RuntimeStreamEventType;
  sequence: number;
  streamId: string;
  responseId: string;
  organizationId: string;
  conversationId: string;
  content?: string;
  trace?: Partial<RuntimeTrace>;
  policyViolations?: PolicyViolation[];
  providerMeta?: Partial<ReasoningOutput['meta']>;
  error?: { code: string; message: string };
}

// ---------------------------------------------------------------------------
// 10. Runtime Trace & Observability Contracts (Phase 6.12.7)
//
// Core principle:
//   "Hermes Runtime is authoritative over cognition.
//    Governance is authoritative over permission.
//    Observability is authoritative over neither."
//
// K12-A41: Runtime generates traceId; client cannot impose it.
// K12-A42: Each trace is strictly tenant-scoped.
// K12-A43: Trace events are append-only.
// K12-A44: sequence is monotonic and Runtime-generated.
// K12-A45: Observability never modifies authority.
// ---------------------------------------------------------------------------

/**
 * Granular lifecycle events emitted by the Runtime.
 * The Portal/client MUST NOT produce these events.
 */
export type RuntimeTraceEventType =
  | 'RUNTIME_STARTED'
  | 'CONTEXT_LOADED'
  | 'CONTEXT_ADAPTED'
  | 'MEMORY_LOADED'
  | 'PROVIDER_STARTED'
  | 'PROVIDER_COMPLETED'
  | 'PROVIDER_FAILED'
  | 'POLICY_VALIDATED'
  | 'POLICY_BLOCKED'
  | 'POLICY_REWRITTEN'
  | 'STREAM_STARTED'
  | 'STREAM_COMPLETED'
  | 'STREAM_CANCELLED'
  | 'PERSISTENCE_STARTED'
  | 'PERSISTENCE_COMMITTED'
  | 'PERSISTENCE_FAILED'
  | 'RUNTIME_COMPLETED'
  | 'RUNTIME_FAILED';

/**
 * Visibility tier for trace data.
 * None of these tiers can expose: raw system prompt, restricted knowledge,
 * credentials, cross-tenant data, or authorization tokens.
 *
 * K12-A46: Raw system prompt never enters trace.
 * K12-A47: Restricted knowledge not in plain text.
 * K12-A48: Secrets/credentials never in trace.
 */
export type TraceVisibility = 'SYSTEM' | 'TENANT' | 'AUDIT';

/**
 * Safe structural metadata — what IS recorded.
 * What is NEVER recorded: prompts, secrets, raw context, full message content.
 */
export interface RuntimeTraceMetadata {
  contextVersion?: string;

  /** IDs only — never raw content. K12-A47. */
  activeKnowledgeIds?: string[];
  excludedKnowledgeIds?: string[];

  activeCapabilityIds?: string[];
  excludedCapabilityIds?: string[];

  governanceRestrictions?: string[];
  hygieneViolationsCount?: number;

  provider?: {
    name: string;
    model: string;
    /** K12-A52: provider metadata is structural only, never grants authority. */
  };

  /**
   * K12-A51: decision comes exclusively from RuntimePolicyValidator.
   * Provider / Portal cannot inject this.
   */
  policy?: {
    version: string;
    decision: 'ALLOW' | 'REWRITE' | 'BLOCK';
    /** Violation codes only — never raw content. */
    violations: string[];
  };

  /** K12-A53: streaming lifecycle is reconstructable. */
  stream?: {
    chunksReceived: number;
    chunksEmitted: number;
    cancelled: boolean;
    completed: boolean;
  };

  /** K12-A54: persistence lifecycle is reconstructable. */
  persistence?: {
    attempted: boolean;
    committed: boolean;
  };

  errorCode?: string;
}

/**
 * A single immutable trace event.
 * K12-A41: traceId is Runtime-generated.
 * K12-A44: sequence is monotonic per traceId.
 */
export interface RuntimeTraceEvent {
  id: string;
  traceId: string;
  runtimeId: string;

  /** K12-A42: every event is strictly tenant-scoped. */
  organizationId: string;
  conversationId: string;

  /** K12-A44: monotonically increasing within a traceId. */
  sequence: number;

  type: RuntimeTraceEventType;
  occurredAt: Date;
  visibility: TraceVisibility;

  metadata: RuntimeTraceMetadata;
}

/**
 * Correlation handle produced by RuntimeTraceRecorder.start().
 * Functions as identity correlation, NOT authorization. K12-A50.
 */
export interface RuntimeTraceHandle {
  traceId: string;
  runtimeId: string;
  organizationId: string;
  conversationId: string;
}

export interface RuntimeTraceStartInput {
  runtimeId: string;
  organizationId: string;
  conversationId: string;
  responseId?: string;
  streamId?: string;
}

export interface RuntimeTraceCompletion {
  success: boolean;
  errorCode?: string;
  durationMs: number;
}

export interface RuntimeTraceEventInput {
  type: RuntimeTraceEventType;
  metadata: RuntimeTraceMetadata;
  visibility?: TraceVisibility;
}

/**
 * K12-A45: The recorder only observes. It cannot modify Runtime decisions.
 * K12-A43: All storage is append-only.
 *
 * Observability MUST be fail-safe: if the recorder fails, the Runtime
 * cognitive decision is NOT affected. Trace failure ≠ cognitive failure.
 */
export interface RuntimeTraceRecorder {
  start(input: RuntimeTraceStartInput): Promise<RuntimeTraceHandle>;

  record(
    handle: RuntimeTraceHandle,
    event: RuntimeTraceEventInput
  ): Promise<void>;

  complete(
    handle: RuntimeTraceHandle,
    result: RuntimeTraceCompletion
  ): Promise<void>;
}

export interface RuntimeTraceQuery {
  /** K12-A49: always required — cross-tenant reads are structurally impossible. */
  organizationId: string;
  conversationId?: string;
  runtimeId?: string;
  traceId?: string;
  eventTypes?: RuntimeTraceEventType[];
  from?: Date;
  to?: Date;
  limit?: number;
  cursor?: string;
}

/**
 * Append-only trace storage.
 * K12-A43: no update/delete operations exist.
 * K12-A49: organizationId is always required for reads.
 */
export interface RuntimeTraceStore {
  append(event: RuntimeTraceEvent): Promise<void>;

  /** organizationId is mandatory — traceId alone is insufficient (K12-A50). */
  get(traceId: string, organizationId: string): Promise<RuntimeTraceEvent[]>;

  list(query: RuntimeTraceQuery): Promise<RuntimeTraceEvent[]>;
}

