/**
 * 🧪 TESTS: ruta de reporting (P0.4) — fail-closed.
 *
 * Solo caminos sin persistencia: capacidad deshabilitada, sesión y grant.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

let portalError: Error | null = null;

vi.mock('@/lib/portal/resolve-portal-context', () => ({
  resolvePortalContext: vi.fn(async (slug: string) => {
    if (portalError) throw portalError;
    return {
      tenant: {
        actorId: 'actor_human_1',
        sessionId: 'sess_1',
        organizationId: 'org-uuid',
        organizationSlug: slug,
        role: 'admin',
        permissions: [],
      },
      organization: {
        id: 'org-uuid',
        slug,
        name: 'Celeste',
        logoUrl: null,
        projectId: 42,
        activeProduct: 'HERMES',
      },
    };
  }),
}));

vi.mock('@/lib/authorization/service-factory', () => ({
  GRANTS_ENFORCED_ENV: 'P0_1_GRANTS_ENFORCED',
  areTenantGrantsEnforced: () => true,
  getTenantGrantRepository: () => ({
    listBySubject: async () => [],
    create: async () => {},
    revoke: async () => false,
    countByOrganization: async () => 0,
  }),
  getCanonicalOrganizationResolver: () => ({
    resolve: async (slugOrId: string) =>
      slugOrId === 'celeste' || slugOrId === 'org-uuid'
        ? { canonicalOrgId: 'org-uuid', projectId: 42, slug: 'celeste' }
        : null,
  }),
}));

const { GET: weeklyReport } = await import('../weekly/route');

const originalEnv = process.env.P0_4_REPORTING_ENABLED;

afterEach(() => {
  if (originalEnv === undefined) delete process.env.P0_4_REPORTING_ENABLED;
  else process.env.P0_4_REPORTING_ENABLED = originalEnv;
});

beforeEach(() => {
  portalError = null;
});

describe('ruta de reporting semanal (P0.4)', () => {
  it('REP-R01: deshabilitada ⇒ 503 REPORTING_NOT_ENABLED', async () => {
    delete process.env.P0_4_REPORTING_ENABLED;

    const res = await weeklyReport(
      new NextRequest('http://localhost/api/v1/reporting/weekly?organizationSlug=celeste'),
    );

    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('REPORTING_NOT_ENABLED');
  });

  it('REP-R02: sin grant de reporting.report.read ⇒ 403', async () => {
    process.env.P0_4_REPORTING_ENABLED = 'true';

    const res = await weeklyReport(
      new NextRequest('http://localhost/api/v1/reporting/weekly?organizationSlug=celeste'),
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN_TENANT_CAPABILITY');
    expect(body.reason).toBe('GRANT_MISSING');
  });

  it('REP-R03: sin sesión de portal ⇒ 401', async () => {
    process.env.P0_4_REPORTING_ENABLED = 'true';
    portalError = new Error('NO_SESSION');

    const res = await weeklyReport(
      new NextRequest('http://localhost/api/v1/reporting/weekly?organizationSlug=celeste'),
    );

    expect(res.status).toBe(401);
  });
});
