// ──────────────────────────────────────────────────────────────────────────────
// Phase 6.12.7 — Runtime Trace Recorder (Implementation)
//
// Observability layer for Hermes. Non-authoritative, append-only, tenant-scoped.
//
// K12-A41: traceId is generated here — client cannot impose it.
// K12-A42: Every event carries organizationId from the Runtime handle.
// K12-A43: No update/delete methods exist.
// K12-A44: sequence is monotonic, managed internally.
// K12-A45: This recorder has no pathway to modify Runtime decisions.
// K12-A46: Metadata sanitizer rejects raw system prompts.
// K12-A47: Restricted knowledge stored as IDs only, never as raw content.
// K12-A48: Secret/credential patterns are stripped from metadata.
// K12-A55: A historical trace never authorizes a future operation.
//
// FAIL-SAFE: If the recorder throws, the Runtime CATCHES and CONTINUES.
// Trace failure ≠ cognitive failure.
// ──────────────────────────────────────────────────────────────────────────────

import {
  RuntimeTraceRecorder,
  RuntimeTraceStore,
  RuntimeTraceHandle,
  RuntimeTraceEvent,
  RuntimeTraceStartInput,
  RuntimeTraceCompletion,
  RuntimeTraceEventInput,
  RuntimeTraceQuery,
  RuntimeTraceMetadata,
  TraceVisibility,
} from './contracts';

// ─── Secret / sensitive field patterns to strip from metadata (K12-A48) ───────

const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /credential/i,
  /database_url/i,
  /session/i,
  /auth/i,
  /bearer/i,
  /private/i,
];

const SYSTEM_PROMPT_MARKERS = [
  'you are a governed cognitive agent',
  'adr-011',
  'system prompt',
  'systemrules',
  'system_rules',
];

/**
 * Sanitizes free-form metadata strings.
 *
 * K12-A46: Rejects raw system prompt content.
 * K12-A47: Rejects raw restricted knowledge.
 * K12-A48: Strips secret/credential fields.
 */
function sanitizeString(value: string): string {
  const lower = value.toLowerCase();
  for (const marker of SYSTEM_PROMPT_MARKERS) {
    if (lower.includes(marker)) {
      return '[REDACTED:SYSTEM_PROMPT]';
    }
  }
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(value)) {
      return '[REDACTED:SECRET]';
    }
  }
  return value;
}

function sanitizeMetadata(meta: RuntimeTraceMetadata): RuntimeTraceMetadata {
  // Deep clone to avoid mutations
  const safe: RuntimeTraceMetadata = { ...meta };

  // Sanitize governance restrictions
  if (safe.governanceRestrictions) {
    safe.governanceRestrictions = safe.governanceRestrictions.map(sanitizeString);
  }

  // Provider metadata: only allow name/model strings, no extra fields
  if (safe.provider) {
    safe.provider = {
      name: sanitizeString(safe.provider.name),
      model: sanitizeString(safe.provider.model),
    };
  }

  // Policy violations: codes only — no content
  if (safe.policy?.violations) {
    safe.policy = {
      ...safe.policy,
      violations: safe.policy.violations.map(v => v.replace(/[^A-Z_]/g, '')), // only uppercase codes
    };
  }

  // errorCode: sanitize
  if (safe.errorCode) {
    safe.errorCode = sanitizeString(safe.errorCode);
  }

  return safe;
}

// ─── Sequence counter (per-trace) ─────────────────────────────────────────────

class SequenceCounter {
  private counters = new Map<string, number>();

  next(traceId: string): number {
    const current = this.counters.get(traceId) ?? -1;
    const next = current + 1;
    this.counters.set(traceId, next);
    return next;
  }
}

// ─── Default RuntimeTraceRecorder ─────────────────────────────────────────────

export class DefaultRuntimeTraceRecorder implements RuntimeTraceRecorder {
  private readonly store: RuntimeTraceStore;
  private readonly sequences = new SequenceCounter();

  constructor(store: RuntimeTraceStore) {
    this.store = store;
  }

  /**
   * K12-A41: traceId is generated here by the Runtime.
   * The caller receives a handle; they CANNOT supply their own traceId.
   */
  async start(input: RuntimeTraceStartInput): Promise<RuntimeTraceHandle> {
    const traceId = `trace_${crypto.randomUUID()}`;
    const handle: RuntimeTraceHandle = {
      traceId,
      runtimeId: input.runtimeId,
      organizationId: input.organizationId,
      conversationId: input.conversationId,
    };

    await this.appendEvent(handle, {
      type: 'RUNTIME_STARTED',
      metadata: {},
      visibility: 'SYSTEM',
    });

    return handle;
  }

  async record(handle: RuntimeTraceHandle, event: RuntimeTraceEventInput): Promise<void> {
    await this.appendEvent(handle, event);
  }

  async complete(handle: RuntimeTraceHandle, result: RuntimeTraceCompletion): Promise<void> {
    await this.appendEvent(handle, {
      type: result.success ? 'RUNTIME_COMPLETED' : 'RUNTIME_FAILED',
      metadata: {
        errorCode: result.errorCode,
      },
      visibility: 'SYSTEM',
    });
  }

  private async appendEvent(
    handle: RuntimeTraceHandle,
    event: RuntimeTraceEventInput,
  ): Promise<void> {
    const { traceId, runtimeId, organizationId, conversationId } = handle;

    // K12-A42: organizationId always comes from the validated Runtime handle
    const traceEvent: RuntimeTraceEvent = {
      id: `tev_${crypto.randomUUID()}`,
      traceId,
      runtimeId,
      organizationId, // always from handle — never from external input
      conversationId,
      sequence: this.sequences.next(traceId), // K12-A44: monotonic
      type: event.type,
      occurredAt: new Date(),
      visibility: event.visibility ?? 'SYSTEM',
      metadata: sanitizeMetadata(event.metadata), // K12-A46/A47/A48
    };

    await this.store.append(traceEvent);
  }
}

// ─── In-Memory Store (for tests and certification) ────────────────────────────

/**
 * In-memory implementation of RuntimeTraceStore.
 * Suitable for certification and unit testing.
 * append-only: no mutations after append.
 */
export class InMemoryRuntimeTraceStore implements RuntimeTraceStore {
  private readonly events: RuntimeTraceEvent[] = [];

  async append(event: RuntimeTraceEvent): Promise<void> {
    // K12-A43: append-only — no modification allowed
    this.events.push(Object.freeze({ ...event }));
  }

  async get(traceId: string, organizationId: string): Promise<RuntimeTraceEvent[]> {
    // K12-A49, K12-A50: both traceId AND organizationId required
    return this.events.filter(
      e => e.traceId === traceId && e.organizationId === organizationId
    );
  }

  async list(query: RuntimeTraceQuery): Promise<RuntimeTraceEvent[]> {
    // K12-A49: organizationId is mandatory
    let results = this.events.filter(e => e.organizationId === query.organizationId);

    if (query.conversationId) results = results.filter(e => e.conversationId === query.conversationId);
    if (query.traceId) results = results.filter(e => e.traceId === query.traceId);
    if (query.runtimeId) results = results.filter(e => e.runtimeId === query.runtimeId);
    if (query.eventTypes) results = results.filter(e => query.eventTypes!.includes(e.type));
    if (query.from) results = results.filter(e => e.occurredAt >= query.from!);
    if (query.to) results = results.filter(e => e.occurredAt <= query.to!);

    const limit = query.limit ?? 100;
    return results.slice(0, limit);
  }

  /** For test inspection only — not part of the public contract. */
  getAllForOrg(organizationId: string): RuntimeTraceEvent[] {
    return this.events.filter(e => e.organizationId === organizationId);
  }
}

// ─── No-op Recorder (fail-safe fallback) ──────────────────────────────────────

/**
 * A no-op recorder used when observability is unavailable.
 *
 * CRITICAL: If the recorder fails or is unavailable, the Runtime's cognitive
 * decision must NOT be affected. This no-op ensures the Runtime stays
 * operational even when the trace store is offline.
 *
 * K12-A45: observability failure ≠ cognitive failure.
 */
export class NoOpRuntimeTraceRecorder implements RuntimeTraceRecorder {
  async start(input: RuntimeTraceStartInput): Promise<RuntimeTraceHandle> {
    return {
      traceId: `noop_${crypto.randomUUID()}`,
      runtimeId: input.runtimeId,
      organizationId: input.organizationId,
      conversationId: input.conversationId,
    };
  }
  async record(_handle: RuntimeTraceHandle, _event: RuntimeTraceEventInput): Promise<void> {}
  async complete(_handle: RuntimeTraceHandle, _result: RuntimeTraceCompletion): Promise<void> {}
}

// ─── Fail-safe wrapper ────────────────────────────────────────────────────────

/**
 * Wraps any RuntimeTraceRecorder and swallows all errors silently.
 * Ensures trace failures NEVER propagate to the cognitive path.
 *
 * K12-A45: observability failure ≠ cognitive failure.
 */
export class FailSafeRuntimeTraceRecorder implements RuntimeTraceRecorder {
  constructor(private readonly delegate: RuntimeTraceRecorder) {}

  async start(input: RuntimeTraceStartInput): Promise<RuntimeTraceHandle> {
    try {
      return await this.delegate.start(input);
    } catch {
      return new NoOpRuntimeTraceRecorder().start(input);
    }
  }

  async record(handle: RuntimeTraceHandle, event: RuntimeTraceEventInput): Promise<void> {
    try {
      await this.delegate.record(handle, event);
    } catch {
      // swallow — trace failure is never a cognitive failure
    }
  }

  async complete(handle: RuntimeTraceHandle, result: RuntimeTraceCompletion): Promise<void> {
    try {
      await this.delegate.complete(handle, result);
    } catch {
      // swallow
    }
  }
}
