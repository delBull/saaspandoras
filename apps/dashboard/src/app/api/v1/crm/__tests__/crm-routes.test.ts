/**
 * 🧪 TESTS: rutas CRM (P0.2) — fail-closed y autorización por grant.
 *
 * Sin base de datos: solo se ejercitan los caminos que NO tocan persistencia
 * (capacidad deshabilitada, contexto inválido y denegación de capability).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

let portalError: Error | null = null;
let portalSlug = 'celeste';
let grantsAllowed = false;

vi.mock('@/lib/portal/resolve-portal-context', () => ({
  resolvePortalContext: vi.fn(async (_slug: string) => {
    if (portalError) throw portalError;
    // `portalSlug` simula la organización REAL de la sesión (puede no coincidir
    // con la solicitada en la URL: defensa en profundidad).
    return {
      tenant: {
        actorId: 'actor_human_1',
        sessionId: 'sess_1',
        organizationId: 'org-uuid',
        organizationSlug: portalSlug,
        role: 'admin',
        permissions: ['growth.content'],
      },
      organization: {
        id: 'org-uuid',
        slug: portalSlug,
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
    // Resuelve tanto por slug como por id canónico (como el resolver real).
    resolve: async (slugOrId: string) =>
      slugOrId === 'celeste' || slugOrId === 'org-uuid'
        ? { canonicalOrgId: 'org-uuid', projectId: 42, slug: 'celeste' }
        : null,
  }),
}));

const { GET: listOpportunities, POST: createOpportunity } = await import(
  '../opportunities/route'
);

const originalEnv = process.env.P0_2_CRM_ENABLED;

afterEach(() => {
  if (originalEnv === undefined) delete process.env.P0_2_CRM_ENABLED;
  else process.env.P0_2_CRM_ENABLED = originalEnv;
});

beforeEach(() => {
  portalError = null;
  portalSlug = 'celeste';
  grantsAllowed = false;
});

describe('rutas CRM (P0.2)', () => {
  it('CR-R01: deshabilitado ⇒ 503 CRM_NOT_ENABLED (sin tocar DB)', async () => {
    delete process.env.P0_2_CRM_ENABLED;

    const list = await listOpportunities(
      new NextRequest('http://localhost/api/v1/crm/opportunities?organizationSlug=celeste'),
    );
    expect(list.status).toBe(503);
    expect((await list.json()).code).toBe('CRM_NOT_ENABLED');

    const create = await createOpportunity(
      new NextRequest('http://localhost/api/v1/crm/opportunities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ organizationSlug: 'celeste' }),
      }),
    );
    expect(create.status).toBe(503);
  });

  it('CR-R02: habilitado sin organizationSlug ⇒ 400 TENANT_REQUIRED', async () => {
    process.env.P0_2_CRM_ENABLED = 'true';

    const res = await listOpportunities(
      new NextRequest('http://localhost/api/v1/crm/opportunities'),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('TENANT_REQUIRED');
  });

  it('CR-R03: sin sesión de portal ⇒ 401', async () => {
    process.env.P0_2_CRM_ENABLED = 'true';
    portalError = new Error('PORTAL_AUTH_REQUIRED');

    const res = await listOpportunities(
      new NextRequest('http://localhost/api/v1/crm/opportunities?organizationSlug=celeste'),
    );

    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('PORTAL_SESSION_REQUIRED');
  });

  it('CR-R04: sesión de otra organización ⇒ 403 ORG_MISMATCH', async () => {
    process.env.P0_2_CRM_ENABLED = 'true';
    portalSlug = 'otra-org';

    const res = await listOpportunities(
      new NextRequest('http://localhost/api/v1/crm/opportunities?organizationSlug=celeste'),
    );

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('ORG_MISMATCH');
  });

  it('CR-R05: sin grant de crm.opportunity.read ⇒ 403 FORBIDDEN_TENANT_CAPABILITY', async () => {
    process.env.P0_2_CRM_ENABLED = 'true';

    const res = await listOpportunities(
      new NextRequest('http://localhost/api/v1/crm/opportunities?organizationSlug=celeste'),
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN_TENANT_CAPABILITY');
    expect(body.reason).toBe('GRANT_MISSING');
  });

  it('CR-R06: sin grant tampoco se puede crear (no hay escritura parcial)', async () => {
    process.env.P0_2_CRM_ENABLED = 'true';

    const res = await createOpportunity(
      new NextRequest('http://localhost/api/v1/crm/opportunities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          organizationSlug: 'celeste',
          title: 'Fracción',
          ownerCollaboratorId: 'human_1',
          estimatedValueUsd: 150000,
          source: 'meta_ads',
        }),
      }),
    );

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('FORBIDDEN_TENANT_CAPABILITY');
    expect(grantsAllowed).toBe(false);
  });
});
