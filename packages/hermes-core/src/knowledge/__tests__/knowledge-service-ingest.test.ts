/**
 * 🛡️ KnowledgeService.addKnowledgeSource — authority wiring certification.
 *
 * Regression covered: the ControlPlaneContext was built authorizing ONLY `canonicalOrgId`
 * (the projects UUID) while the command was invoked with `projectSlug`. That made
 * `requireOrganizationScope(projectSlug)` throw `AuthorizationError` on every ingestion,
 * so the portal endpoint returned 500 and the dashboard stayed empty.
 *
 * Invariants asserted here:
 *   1. Ingestion completes for a canonical tenant whose id ≠ slug.
 *   2. Both identifiers (canonicalOrgId + projectSlug) are authorized — nothing else is.
 *   3. Sources/versions are stored under the documented relational key (projectSlug).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  inserts: [] as Array<{ table: string | null; payload: any }>,
  processVersionCalls: [] as any[][],
}));

vi.mock('@saasfly/db-core/schema', () => ({
  knowledgeSources: { __t: 'sources' },
  knowledgeSourceVersions: { __t: 'versions' },
  hermesKnowledge: { __t: 'knowledge' },
  hermesGovernanceAudit: { __t: 'audit' },
  knowledgeChunks: { __t: 'chunks' },
}));

vi.mock('@saasfly/db-core', () => {
  let current: string | null = null;
  const chain: any = {
    select: () => chain,
    from: (table: any) => {
      current = table?.__t ?? null;
      return chain;
    },
    where: () => chain,
    limit: () => Promise.resolve([]),
    orderBy: () => Promise.resolve([]),
    update: (table: any) => {
      current = table?.__t ?? null;
      return chain;
    },
    set: () => chain,
    insert: (table: any) => {
      current = table?.__t ?? null;
      return chain;
    },
    values: (payload: any) => {
      state.inserts.push({ table: current, payload });
      return Promise.resolve(undefined);
    },
    returning: () => Promise.resolve([]),
    then: (onFulfilled: any, onRejected: any) => Promise.resolve([]).then(onFulfilled, onRejected),
  };

  return {
    db: { ...chain, transaction: async (fn: (tx: any) => Promise<any>) => await fn(chain) },
    eq: (column: any, value: any) => ({ column, value }),
    and: (...args: any[]) => args,
    or: (...args: any[]) => args,
    desc: (column: any) => ({ column, direction: 'desc' }),
    sql: (strings: TemplateStringsArray, ...values: any[]) => ({ strings, values }),
  };
});

vi.mock('../knowledge-runtime', () => ({
  knowledgeRuntime: {
    processVersion: vi.fn(async (...args: any[]) => {
      state.processVersionCalls.push(args);
      return { knowledgeId: 'k_test', status: 'PENDING_REVIEW', dimension: 'evidence' };
    }),
  },
}));

vi.mock('../../trial/hermes-trial-policy.service', () => ({
  HermesTrialPolicyService: {
    assertTrialMutationAllowed: vi.fn(async () => undefined),
    atomicCheckAndReserveQuota: vi.fn(async (_t: string, _r: string, _p: any, mutation: () => Promise<any>) =>
      await mutation()
    ),
  },
}));

vi.mock('../../trial/hermes-trial-timeline.service', () => ({
  HermesTrialTimelineService: { recordEvent: vi.fn(async () => undefined) },
}));

import { KnowledgeService } from '../service';
import { CreateKnowledgeSourceCommand } from '../../control-plane/application/commands/knowledge/create-knowledge-source';
import type { ControlPlaneContext } from '../../control-plane/application/context';
import type { CanonicalTenantIdentity } from '../../tenants/tenant-authority';

const CANONICAL_ORG_ID = '9f0d8b3a-5c1e-4d2a-8b7f-1c2d3e4f5a6b';
const PROJECT_SLUG = 'coffree';

const canonicalTenant: CanonicalTenantIdentity = {
  canonicalOrgId: CANONICAL_ORG_ID,
  projectSlug: PROJECT_SLUG,
  projectId: 42,
  title: 'Coffree',
  tokenPriceUsd: null,
  fiduciaryEntity: null,
  status: 'ACTIVE',
};

const authContext = {
  sessionId: 'session_x',
  actorId: 'session_42',
  canonicalTenant,
};
const payload = {
  type: 'DOCUMENT' as const,
  title: 'Manual de Coffree',
  content: 'Coffree es una cafetería de especialidad en Monterrey.',
};

let capturedContext: ControlPlaneContext | null = null;

// Captured before any spy is installed, so the wrapper always calls the real implementation.
const originalExecute = CreateKnowledgeSourceCommand.prototype.execute;

beforeEach(() => {
  state.inserts = [];
  state.processVersionCalls = [];
  capturedContext = null;

  vi.spyOn(CreateKnowledgeSourceCommand.prototype, 'execute').mockImplementation(function (
    this: CreateKnowledgeSourceCommand,
    ctx: ControlPlaneContext,
    organizationId: string,
    input: any
  ) {
    capturedContext = ctx;
    return originalExecute.call(this, ctx, organizationId, input);
  });
});

describe('KnowledgeService.addKnowledgeSource — tenant authority wiring', () => {
  it('completes ingestion when canonicalOrgId differs from projectSlug', async () => {
    const sourceId = await KnowledgeService.addKnowledgeSource(authContext, payload);

    expect(sourceId).toBeTruthy();
  });

  it('authorizes the canonical org id AND its slug, and nothing else', () => {
    return KnowledgeService.addKnowledgeSource(authContext, payload).then(() => {
      expect(capturedContext).not.toBeNull();
      const authorized = capturedContext!.authorizedOrganizations.map((o) => o.organizationId).sort();
      expect(authorized).toEqual([CANONICAL_ORG_ID, PROJECT_SLUG].sort());

      expect(() => capturedContext!.requireOrganizationScope(CANONICAL_ORG_ID)).not.toThrow();
      expect(() => capturedContext!.requireOrganizationScope(PROJECT_SLUG)).not.toThrow();
      expect(() => capturedContext!.requireOrganizationScope('tenant_intruder')).toThrow(
        /FORBIDDEN/
      );
    });
  });

  it('stores source and version under the documented relational key (projectSlug)', async () => {
    await KnowledgeService.addKnowledgeSource(authContext, payload);

    const sourceInsert = state.inserts.find((i) => i.table === 'sources');
    const versionInsert = state.inserts.find((i) => i.table === 'versions');

    expect(sourceInsert?.payload).toMatchObject({ tenantId: PROJECT_SLUG, status: 'CREATED' });
    expect(versionInsert?.payload).toMatchObject({ tenantId: PROJECT_SLUG, version: 1 });
  });

  it('hands the ingestion to the runtime with the same tenant scope', async () => {
    await KnowledgeService.addKnowledgeSource(authContext, payload);

    expect(state.processVersionCalls).toHaveLength(1);
    const [tenantId, sourceId, versionId] = state.processVersionCalls[0]!;
    expect(tenantId).toBe(PROJECT_SLUG);
    expect(typeof sourceId).toBe('string');
    expect(typeof versionId).toBe('string');
  });
});
