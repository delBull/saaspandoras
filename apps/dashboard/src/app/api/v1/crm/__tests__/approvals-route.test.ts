/**
 * 🧪 TESTS: ruta de aprobación de reasignación (P0.2).
 *
 * Solo caminos sin persistencia: capacidad deshabilitada, contexto inválido,
 * validación de payload y denegación por falta de grant de gobierno.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

let portalError: Error | null = null;
let portalSlug = 'celeste';

vi.mock('@/lib/portal/resolve-portal-context', () => ({
  resolvePortalContext: vi.fn(async () => {
    if (portalError) throw portalError;
    return {
      tenant: {
        actorId: 'actor_human_1',
        sessionId: 'sess_1',
        organizationId: 'org-uuid',
        organizationSlug: portalSlug,
        role: 'admin',
        permissions: [],
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
    resolve: async (slugOrId: string) =>
      slugOrId === 'celeste' || slugOrId === 'org-uuid'
        ? { canonicalOrgId: 'org-uuid', projectId: 42, slug: 'celeste' }
        : null,
  }),
}));

vi.mock('@/lib/crm/service-factory', () => ({
  getOpportunityService: () => {
    throw new Error('no debe instanciarse en estos caminos');
  },
  getCrmRepository: () => {
    throw new Error('no debe instanciarse en estos caminos');
  },
  getReassignmentRequests: () => {
    throw new Error('no debe instanciarse en estos caminos');
  },
}));

const { POST: decideApproval } = await import('../approvals/[requestId]/route');

const originalEnv = process.env.P0_2_CRM_ENABLED;

function post(body: unknown) {
  return new NextRequest('http://localhost/api/v1/crm/approvals/req_1', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  if (originalEnv === undefined) delete process.env.P0_2_CRM_ENABLED;
  else process.env.P0_2_CRM_ENABLED = originalEnv;
});

beforeEach(() => {
  portalError = null;
  portalSlug = 'celeste';
});

describe('ruta de aprobación de reasignación (P0.2)', () => {
  it('AP-R01: deshabilitado ⇒ 503', async () => {
    delete process.env.P0_2_CRM_ENABLED;

    const res = await decideApproval(post({ organizationSlug: 'celeste', decision: 'approved' }), {
      params: Promise.resolve({ requestId: 'req_1' }),
    });

    expect(res.status).toBe(503);
  });

  it('AP-R02: decisión inválida ⇒ 422 sin tocar repositorios', async () => {
    process.env.P0_2_CRM_ENABLED = 'true';

    const res = await decideApproval(post({ organizationSlug: 'celeste', decision: 'quizas' }), {
      params: Promise.resolve({ requestId: 'req_1' }),
    });

    expect(res.status).toBe(422);
  });

  it('AP-R03: sin grant de governance.approval.review ⇒ 403', async () => {
    process.env.P0_2_CRM_ENABLED = 'true';

    const res = await decideApproval(post({ organizationSlug: 'celeste', decision: 'approved' }), {
      params: Promise.resolve({ requestId: 'req_1' }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN_TENANT_CAPABILITY');
    expect(body.reason).toBe('GRANT_MISSING');
  });

  it('AP-R04: sin sesión ⇒ 401', async () => {
    process.env.P0_2_CRM_ENABLED = 'true';
    portalError = new Error('NO_SESSION');

    const res = await decideApproval(post({ organizationSlug: 'celeste', decision: 'approved' }), {
      params: Promise.resolve({ requestId: 'req_1' }),
    });

    expect(res.status).toBe(401);
  });
});
