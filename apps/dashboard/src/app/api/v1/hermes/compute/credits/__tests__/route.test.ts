import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Hotfix H2: el saldo de un tenant no es público y leer no debe crear filas.
 * Falla si se quita la autorización, si se usa getOrCreateCredits o si el markup
 * se filtra al tenant.
 */

let adminSession: any = null;
let portalBehavior: 'ok' | 'no_session' | 'denied' = 'ok';
let canonicalTenant: any = { projectSlug: 'forge', projectId: 186, canonicalOrgId: 'forge' };
let creditsRow: any = {
  tenantId: 'forge',
  creditBalanceUsd: 10,
  reservedBalanceUsd: 0,
  totalDepositedUsd: 10,
  totalSpentUsd: 0,
  markupPercentage: 35,
  isSandboxEnabled: true,
  sandboxBalanceUsd: 0,
  sandboxReservedBalanceUsd: 0,
};

const getCredits = vi.fn(async () => creditsRow);
const getOrCreateCredits = vi.fn(async () => creditsRow);

vi.mock('@/lib/admin-auth', () => ({
  validateAdminSession: async () => ({ session: adminSession }),
}));

vi.mock('@/lib/portal/resolve-portal-context', () => ({
  resolvePortalContext: async (slug: string) => {
    if (portalBehavior === 'no_session') {
      throw Object.assign(new Error('no session'), { code: 'NO_SESSION' });
    }
    if (portalBehavior === 'denied') {
      throw Object.assign(new Error('denied'), { code: 'ORGANIZATION_ACCESS_DENIED' });
    }
    return { organization: { slug: 'forge' } };
  },
}));

vi.mock('@saasfly/hermes-core', () => ({
  TenantAuthorityService: {
    resolveCanonicalTenant: async () => canonicalTenant,
  },
  TenantCreditLedgerService: {
    getCredits: (...args: any[]) => getCredits(...(args as [])),
    getOrCreateCredits: (...args: any[]) => getOrCreateCredits(...(args as [])),
  },
}));

import { GET } from '../route';

function req(qs: string) {
  return new NextRequest(`http://localhost/api/v1/hermes/compute/credits${qs}`);
}

describe('GET /hermes/compute/credits (hotfix H2)', () => {
  beforeEach(() => {
    adminSession = null;
    portalBehavior = 'ok';
    canonicalTenant = { projectSlug: 'forge', projectId: 186, canonicalOrgId: 'forge' };
    creditsRow = {
      tenantId: 'forge',
      creditBalanceUsd: 10,
      reservedBalanceUsd: 0,
      totalDepositedUsd: 10,
      totalSpentUsd: 0,
      markupPercentage: 35,
      isSandboxEnabled: true,
      sandboxBalanceUsd: 0,
      sandboxReservedBalanceUsd: 0,
    };
    getCredits.mockClear();
    getOrCreateCredits.mockClear();
  });

  it('CRD-01: sin tenantId → 400', async () => {
    const res = await GET(req(''));
    expect(res.status).toBe(400);
  });

  it('CRD-02: tenant inexistente → 404', async () => {
    canonicalTenant = null;
    const res = await GET(req('?tenantId=nadie'));
    expect(res.status).toBe(404);
    expect(getCredits).not.toHaveBeenCalled();
  });

  it('CRD-03: sin sesión → 401 y no lee créditos', async () => {
    portalBehavior = 'no_session';
    const res = await GET(req('?tenantId=forge'));
    expect(res.status).toBe(401);
    expect(getCredits).not.toHaveBeenCalled();
  });

  it('CRD-04: sesión de otro tenant → 403', async () => {
    portalBehavior = 'denied';
    const res = await GET(req('?tenantId=forge'));
    expect(res.status).toBe(403);
    expect(getCredits).not.toHaveBeenCalled();
  });

  it('CRD-05: tenant propio → 200 SIN markup (margen interno)', async () => {
    const res = await GET(req('?tenantId=forge'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.credits.production.availableBalanceUsd).toBe(10);
    expect(body.credits.markupPercentage).toBeUndefined();
    expect(getOrCreateCredits).not.toHaveBeenCalled();
  });

  it('CRD-06: admin → 200 y sí ve markup', async () => {
    adminSession = { role: 'ADMIN' };
    const res = await GET(req('?tenantId=forge'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.credits.markupPercentage).toBe(35);
  });

  it('CRD-07: sin fila de créditos → saldo 0 e initialized=false (no crea nada)', async () => {
    creditsRow = null;
    const res = await GET(req('?tenantId=forge'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.credits.initialized).toBe(false);
    expect(body.credits.production.availableBalanceUsd).toBe(0);
    expect(getOrCreateCredits).not.toHaveBeenCalled();
  });
});
