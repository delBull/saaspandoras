import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

let adminError: NextResponse | null = null;
let linkRow: { id: string; status: string } | null = { id: 'link_1', status: 'active' };
let deleted: string[] = [];

vi.mock('@/lib/private-admin', () => ({
  resolvePrivateAdmin: vi.fn(async () =>
    adminError ? { actor: null, errorResponse: adminError } : { actor: 'admin@pandoras.finance', errorResponse: null }
  ),
}));

vi.mock('@saasfly/db-core', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => (linkRow ? [linkRow] : [])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => {
        if (linkRow) deleted.push(linkRow.id);
        return [];
      }),
    })),
  },
  eq: vi.fn((a: unknown, b: unknown) => ({ a, b })),
  // El route importa la tabla desde el root del paquete.
  privatePaymentLinks: { id: 'id', status: 'status' },
}));

import { DELETE } from '../route';

function call(id: string) {
  return DELETE(
    new NextRequest(`http://localhost/api/private/payments/${id}`, { method: 'DELETE' }),
    { params: Promise.resolve({ id }) }
  );
}

describe('DELETE /api/private/payments/[id] — limpieza de links sin pago', () => {
  beforeEach(() => {
    adminError = null;
    linkRow = { id: 'link_1', status: 'active' };
    deleted = [];
    vi.clearAllMocks();
  });

  it('DEL-01: sin sesión de admin → 403 y no borra', async () => {
    adminError = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const res = await call('link_1');
    expect(res.status).toBe(403);
    expect(deleted).toEqual([]);
  });

  it('DEL-02: link inexistente → 404', async () => {
    linkRow = null;
    const res = await call('nope');
    expect(res.status).toBe(404);
  });

  it('DEL-03: cobro pagado → 409 y NO se borra (evidencia contable)', async () => {
    linkRow = { id: 'link_paid', status: 'completed' };
    const res = await call('link_paid');
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('PAID_LINK_PROTECTED');
    expect(deleted).toEqual([]);
  });

  it('DEL-04: link sin pago → se elimina', async () => {
    const res = await call('link_1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.deletedId).toBe('link_1');
    expect(deleted).toEqual(['link_1']);
  });
});
