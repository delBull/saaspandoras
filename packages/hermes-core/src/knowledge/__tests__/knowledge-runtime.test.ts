/**
 * 🛡️ Knowledge Runtime — ingestion lifecycle certification (service layer).
 *
 * Attack matrix covered:
 *   1. A version from another tenant is rejected and the failure is persisted (fail-closed).
 *   2. Failures are rethrown, never swallowed (no silent catch).
 *   3. The projected fact is inserted with TENANT_RESTRICTED / INTERNAL_OPERATIONAL and
 *      PENDING_REVIEW — never ACTIVE, never PUBLIC.
 *   4. The insertion is recorded in `hermes_governance_audit` with the real governance decision.
 *   5. A new draft supersedes only the previous draft, never approved knowledge.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  rows: {} as Record<string, any[]>,
  updates: [] as Array<{ table: string | null; payload: any }>,
  inserts: [] as Array<{ table: string | null; payload: any }>,
  transactionCalls: 0,
}));

vi.mock('@saasfly/db-core/schema', () => ({
  knowledgeSources: { __t: 'sources' },
  knowledgeSourceVersions: { __t: 'versions' },
  hermesKnowledge: { __t: 'knowledge' },
  hermesGovernanceAudit: { __t: 'audit' },
}));

vi.mock('@saasfly/db-core', () => {
  const makeChain = () => {
    let current: string | null = null;
    const rowsFor = () => state.rows[current ?? ''] ?? [];
    const chain: any = {
      select: () => chain,
      from: (table: any) => {
        current = table?.__t ?? null;
        return chain;
      },
      where: () => chain,
      limit: () => Promise.resolve(rowsFor()),
      update: (table: any) => {
        current = table?.__t ?? null;
        return chain;
      },
      set: (payload: any) => {
        state.updates.push({ table: current, payload });
        return chain;
      },
      insert: (table: any) => {
        current = table?.__t ?? null;
        return chain;
      },
      values: (payload: any) => {
        state.inserts.push({ table: current, payload });
        return Promise.resolve(undefined);
      },
      returning: () => Promise.resolve(rowsFor()),
      then: (onFulfilled: any, onRejected: any) => Promise.resolve(rowsFor()).then(onFulfilled, onRejected),
    };
    return chain;
  };

  const db: any = makeChain();
  db.transaction = vi.fn(async (fn: (tx: any) => Promise<any>) => {
    state.transactionCalls += 1;
    return await fn(makeChain());
  });

  return {
    db,
    eq: (column: any, value: any) => ({ column, value }),
    and: (...args: any[]) => args,
    or: (...args: any[]) => args,
    sql: (strings: TemplateStringsArray, ...values: any[]) => ({ strings, values }),
  };
});

import { KnowledgeRuntime, PostgresKnowledgeIndex } from '../knowledge-runtime';
import { MockEmbeddingProvider } from '../knowledge-types';

const TENANT = 'tenant_coffree';
const SOURCE_ID = 'src_abc123';
const VERSION_ID = 'ver_abc123';

const versionRow = {
  id: VERSION_ID,
  sourceId: SOURCE_ID,
  tenantId: TENANT,
  version: 2,
  content: 'Coffree es una cafetería de especialidad en Monterrey.',
  createdBy: 'session_42',
  status: 'CREATED',
};

const sourceRow = {
  id: SOURCE_ID,
  tenantId: TENANT,
  type: 'DOCUMENT',
  title: 'Manual de Coffree',
  status: 'CREATED',
};

function makeRuntime() {
  return new KnowledgeRuntime(new MockEmbeddingProvider(), new PostgresKnowledgeIndex());
}

function seedRows(overrides: { versions?: any[]; sources?: any[]; knowledge?: any[] } = {}) {
  state.rows = {
    versions: overrides.versions ?? [versionRow],
    sources: overrides.sources ?? [sourceRow],
    knowledge: overrides.knowledge ?? [],
  };
}

function knowledgeInsert() {
  return state.inserts.find((i) => i.table === 'knowledge');
}

function auditInsert() {
  return state.inserts.find((i) => i.table === 'audit');
}

beforeEach(() => {
  state.updates = [];
  state.inserts = [];
  state.transactionCalls = 0;
  seedRows();
});

describe('KnowledgeRuntime.processVersion — tenant binding (fail-closed)', () => {
  it('rejects a version belonging to another tenant without touching its rows', async () => {
    seedRows({ versions: [{ ...versionRow, tenantId: 'tenant_intruder' }] });

    await expect(makeRuntime().processVersion(TENANT, SOURCE_ID, VERSION_ID)).rejects.toThrow(
      'KNOWLEDGE_TENANT_MISMATCH'
    );

    // The error is rethrown (not swallowed)...
    // ...and ownership was proven false BEFORE any write: no cross-tenant PROCESSING/FAILED.
    expect(state.updates).toEqual([]);
    expect(state.transactionCalls).toBe(0);

    // No fact is projected for a cross-tenant version.
    expect(knowledgeInsert()).toBeUndefined();
  });

  it('rejects a missing version without inventing content', async () => {
    seedRows({ versions: [] });

    await expect(makeRuntime().processVersion(TENANT, SOURCE_ID, VERSION_ID)).rejects.toThrow(
      'KNOWLEDGE_VERSION_NOT_FOUND'
    );

    expect(state.updates).toEqual([]);
    expect(knowledgeInsert()).toBeUndefined();
  });
});

describe('KnowledgeRuntime.processVersion — governed projection', () => {
  it('inserts the fact as TENANT_RESTRICTED / INTERNAL_OPERATIONAL / PENDING_REVIEW', async () => {
    await makeRuntime().processVersion(TENANT, SOURCE_ID, VERSION_ID);

    const inserted = knowledgeInsert();
    expect(inserted).toBeDefined();
    expect(inserted?.payload).toMatchObject({
      organizationId: TENANT,
      dimension: 'evidence',
      key: `source_${SOURCE_ID}`,
      status: 'PENDING_REVIEW',
      visibility: 'TENANT_RESTRICTED',
      classification: 'INTERNAL_OPERATIONAL',
      authority: 'TENANT',
      source: 'OWNER_INPUT',
      sourceReference: `knowledge_source:${SOURCE_ID}#v2`,
      version: 1,
      createdBy: 'session_42',
    });
  });

  it('records the governance decision in hermes_governance_audit', async () => {
    await makeRuntime().processVersion(TENANT, SOURCE_ID, VERSION_ID);

    const audit = auditInsert();
    expect(audit).toBeDefined();
    expect(audit?.payload).toMatchObject({
      organizationId: TENANT,
      eventType: 'CREATE',
      actorId: 'session_42',
      actorType: 'USER',
      oldStatus: null,
      newStatus: 'PENDING_REVIEW',
    });
    expect(audit?.payload.metadata).toMatchObject({
      source: 'KNOWLEDGE_SOURCE_INGESTION',
      sourceId: SOURCE_ID,
      sourceVersion: 2,
      requiresHumanApproval: true,
      supersededKnowledgeIds: [],
    });
  });

  it('never bypasses the transaction that writes fact + audit', async () => {
    await makeRuntime().processVersion(TENANT, SOURCE_ID, VERSION_ID);

    expect(state.transactionCalls).toBe(1);
  });

  it('marks the source and version READY only after the fact is projected', async () => {
    await makeRuntime().processVersion(TENANT, SOURCE_ID, VERSION_ID);

    const sourceStatuses = state.updates
      .filter((u) => u.table === 'sources')
      .map((u) => u.payload.status);
    expect(sourceStatuses).toEqual(['PROCESSING', 'READY']);

    const readySource = state.updates.find(
      (u) => u.table === 'sources' && u.payload.status === 'READY'
    );
    expect(readySource?.payload.activeVersionId).toBe(VERSION_ID);
  });
});

describe('KnowledgeRuntime.processVersion — supersession', () => {
  it('supersedes only the previous draft when the new candidate still requires review', async () => {
    seedRows({
      knowledge: [
        { id: 'k_active', status: 'ACTIVE', version: 3 },
        { id: 'k_draft', status: 'PENDING_REVIEW', version: 4 },
      ],
    });

    await makeRuntime().processVersion(TENANT, SOURCE_ID, VERSION_ID);

    // Approved knowledge stays live until the new version is explicitly approved.
    const supersededUpdate = state.updates.find(
      (u) => u.table === 'knowledge' && u.payload.status === 'SUPERSEDED'
    );
    expect(supersededUpdate).toBeDefined();

    const audit = auditInsert();
    expect(audit?.payload.oldStatus).toBe('PENDING_REVIEW');
    expect(audit?.payload.metadata.supersededKnowledgeIds).toEqual(['k_draft']);

    const inserted = knowledgeInsert();
    expect(inserted?.payload.version).toBe(5);
    expect(inserted?.payload.supersedesId).toBe('k_draft');
    expect(inserted?.payload.status).toBe('PENDING_REVIEW');
  });
});
