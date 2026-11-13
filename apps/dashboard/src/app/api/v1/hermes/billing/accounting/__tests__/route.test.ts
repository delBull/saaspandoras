import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Hotfix H1: el ledger contable interno ya no es público.
 * Falla si se elimina la comprobación de administrador.
 */

let adminSession: any = { role: 'ADMIN' };
const getLedger = vi.fn(async () => [{ id: 'e1', amountUsd: 10 }]);
const getTreasuryWallet = vi.fn(() => '0xc52BB6f53C91ff7134e7508B102E5A22BA415954');

vi.mock('@/lib/admin-auth', () => ({
  validateAdminSession: async () => ({
    session: adminSession,
    errorResponse: adminSession
      ? undefined
      : new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403 }),
  }),
}));

vi.mock('@saasfly/hermes-core', () => ({
  TenantBillingService: {
    getInternalAccountingLedger: (...args: any[]) => getLedger(...(args as [])),
    getTreasuryWallet: () => getTreasuryWallet(),
  },
}));

import { GET } from '../route';

function req(qs = '') {
  return new NextRequest(`http://localhost/api/v1/hermes/billing/accounting${qs}`);
}

describe('GET /hermes/billing/accounting (hotfix H1)', () => {
  beforeEach(() => {
    adminSession = { role: 'ADMIN' };
    getLedger.mockClear();
    getTreasuryWallet.mockClear();
  });

  it('ACC-01: sin sesión de admin → 403 y NO lee el ledger', async () => {
    adminSession = null;
    const res = await GET(req('?tenantId=forge'));
    expect(res.status).toBe(403);
    expect(getLedger).not.toHaveBeenCalled();
  });

  it('ACC-02: admin → 200 con ledger y tesorería', async () => {
    const res = await GET(req('?tenantId=forge'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.entriesCount).toBe(1);
    expect(body.treasuryWallet).toContain('0xc52B');
    expect(getLedger).toHaveBeenCalledWith({ tenantId: 'forge', limit: 50 });
  });

  it('ACC-03: limita el tamaño de la consulta (máx 200)', async () => {
    await GET(req('?limit=9999'));
    expect(getLedger).toHaveBeenCalledWith({ tenantId: undefined, limit: 200 });
  });

  it('ACC-04: error del servicio → 500', async () => {
    getLedger.mockRejectedValueOnce(new Error('boom'));
    const res = await GET(req('?tenantId=forge'));
    expect(res.status).toBe(500);
  });
});
