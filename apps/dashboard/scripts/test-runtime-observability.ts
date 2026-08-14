// @ts-ignore
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import {
  RuntimeTraceEventType,
  RuntimeTraceMetadata,
  TraceVisibility,
  RuntimeTraceEvent,
} from '../src/lib/pandoras/core/domains/hermes/runtime/contracts';
import {
  DefaultRuntimeTraceRecorder,
  InMemoryRuntimeTraceStore,
  FailSafeRuntimeTraceRecorder,
} from '../src/lib/pandoras/core/domains/hermes/runtime/trace/trace-recorder';
import { HermesRuntime, getDefaultRuntime, getDefaultTraceStore } from '../src/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';

describe('Phase 6.12.7 — Hermes Runtime Trace & Observability Certification', () => {
  let store: InMemoryRuntimeTraceStore;
  let recorder: DefaultRuntimeTraceRecorder;
  const orgId1 = 'org_123';
  const orgId2 = 'org_456';
  const convId = 'conv_abc';

  beforeAll(() => {
    store = new InMemoryRuntimeTraceStore();
    recorder = new DefaultRuntimeTraceRecorder(store);
  });

  test('K12-A41, K12-A42, K12-A44: TraceId generation, tenant scope, and monotonic sequence', async () => {
    const handle = await recorder.start({
      runtimeId: 'rt_1',
      organizationId: orgId1,
      conversationId: convId,
    });

    expect(handle.traceId).toStartWith('trace_');
    expect(handle.organizationId).toBe(orgId1);

    await recorder.record(handle, { type: 'CONTEXT_LOADED', metadata: {} });
    await recorder.record(handle, { type: 'PROVIDER_STARTED', metadata: {} });
    await recorder.complete(handle, { success: true, durationMs: 100 });

    const traces = await store.get(handle.traceId, orgId1);
    expect(traces).toBeArrayOfSize(4); // STARTED, CONTEXT_LOADED, PROVIDER_STARTED, COMPLETED
    expect(traces[0].sequence).toBe(0);
    expect(traces[1].sequence).toBe(1);
    expect(traces[2].sequence).toBe(2);
    expect(traces[3].sequence).toBe(3);
    
    // Check all events are scoped to orgId1
    for (const t of traces) {
      expect(t.organizationId).toBe(orgId1);
    }
  });

  test('K12-A46, K12-A47, K12-A48: Metadata sanitization (No raw system prompt, secrets)', async () => {
    const handle = await recorder.start({
      runtimeId: 'rt_2',
      organizationId: orgId1,
      conversationId: convId,
    });

    const unsafeMeta: RuntimeTraceMetadata = {
      governanceRestrictions: [
        'You are a governed cognitive agent with ADR-011.',
        'Normal restriction',
      ],
      provider: {
        name: 'My secret token is sk_test_123',
        model: 'gpt-4',
      },
      errorCode: 'Failed to connect: Invalid database_url or password provided',
    };

    await recorder.record(handle, { type: 'POLICY_BLOCKED', metadata: unsafeMeta });
    const traces = await store.get(handle.traceId, orgId1);
    const blockedEvent = traces.find(t => t.type === 'POLICY_BLOCKED');
    
    expect(blockedEvent).toBeDefined();
    expect(blockedEvent!.metadata.governanceRestrictions![0]).toBe('[REDACTED:SYSTEM_PROMPT]');
    expect(blockedEvent!.metadata.governanceRestrictions![1]).toBe('Normal restriction');
    expect(blockedEvent!.metadata.provider!.name).toBe('[REDACTED:SECRET]');
    expect(blockedEvent!.metadata.errorCode).toBe('[REDACTED:SECRET]');
  });

  test('K12-A45: Fail-safe trace recorder (Observability failure ≠ Cognitive failure)', async () => {
    const brokenStore: any = {
      append: () => Promise.reject(new Error('DB Offline')),
    };
    const failingRecorder = new DefaultRuntimeTraceRecorder(brokenStore);
    const failSafe = new FailSafeRuntimeTraceRecorder(failingRecorder);

    const handle = await failSafe.start({
      runtimeId: 'rt_3',
      organizationId: orgId1,
      conversationId: convId,
    });

    // Should not throw
    await failSafe.record(handle, { type: 'CONTEXT_LOADED', metadata: {} });
    await failSafe.complete(handle, { success: true, durationMs: 50 });
    
    expect(handle.traceId).toBeDefined(); // Used fallback NoOp recorder
  });

  test('K12-A49, K12-A50: Cross-tenant isolation (Cannot read traces from another org)', async () => {
    const handle = await recorder.start({
      runtimeId: 'rt_4',
      organizationId: orgId2,
      conversationId: convId,
    });

    await recorder.record(handle, { type: 'PROVIDER_STARTED', metadata: {} });

    // Attempt to read orgId2's trace using orgId1
    const traces = await store.get(handle.traceId, orgId1);
    expect(traces).toBeArrayOfSize(0);

    const correctTraces = await store.get(handle.traceId, orgId2);
    expect(correctTraces.length).toBeGreaterThan(0);
  });

  test('Integration: HermesRuntime generates full lifecycle traces (respond)', async () => {
    // Override default to use our test store? 
    // Wait, let's just use the default singleton and query its store.
    const runtime = getDefaultRuntime();
    const runtimeStore = getDefaultTraceStore();

    const orgId = 'org_rt_test';
    const conv = 'conv_rt_test';

    const response = await runtime.respond({
      organizationId: orgId,
      conversationId: conv,
      message: { id: `m1_${crypto.randomUUID()}`, role: 'USER', content: 'Hello trace', createdAt: new Date() },
      controlPlaneContext: { actorId: 'a1', organizationId: orgId, role: 'ADMIN', permissions: [] }
    });

    const traces = await runtimeStore.list({ organizationId: orgId });
    expect(traces.length).toBeGreaterThan(0);
    
    const types = traces.map(t => t.type);
    expect(types).toContain('RUNTIME_STARTED');
    expect(types).toContain('CONTEXT_LOADED');
    expect(types).toContain('MEMORY_LOADED');
    expect(types).toContain('CONTEXT_ADAPTED');
    expect(types).toContain('PROVIDER_STARTED');
    expect(types).toContain('PROVIDER_COMPLETED');
    expect(types).toContain('POLICY_VALIDATED');
    expect(types).toContain('PERSISTENCE_STARTED');
    expect(types).toContain('PERSISTENCE_COMMITTED');
    expect(types).toContain('RUNTIME_COMPLETED');
  });

  test('Integration: HermesRuntime generates full lifecycle traces (stream)', async () => {
    const runtime = getDefaultRuntime();
    const runtimeStore = getDefaultTraceStore();

    const orgId = 'org_rt_stream_test';
    const conv = 'conv_rt_stream_test';

    const stream = await runtime.stream({
      organizationId: orgId,
      conversationId: conv,
      message: { id: `m2_${crypto.randomUUID()}`, role: 'USER', content: 'Stream trace', createdAt: new Date() },
      controlPlaneContext: { actorId: 'a2', organizationId: orgId, role: 'ADMIN', permissions: [] }
    });

    for await (const chunk of stream) {
      // Consume stream
    }

    const traces = await runtimeStore.list({ organizationId: orgId });
    expect(traces.length).toBeGreaterThan(0);
    
    const types = traces.map(t => t.type);
    expect(types).toContain('STREAM_STARTED');
    expect(types).toContain('STREAM_COMPLETED');
  });
});
