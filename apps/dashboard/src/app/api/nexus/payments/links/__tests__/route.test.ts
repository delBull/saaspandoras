import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

let mockAuth: any = { isAuthenticated: true, role: 'SUPER_ADMIN', email: 'admin@pandoras.finance', wallet: null };
let rateAllowed = true;
let capturedInsert: any = null;

vi.mock('@saasfly/shared', () => ({
  getNexusAuthContext: vi.fn(async () => mockAuth),
  getTrustedClientIp: vi.fn(() => '127.0.0.1'),
  authRateLimiter: { isAllowed: vi.fn(async () => rateAllowed) },
}));

vi.mock('@saasfly/db-core', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn((values: any) => {
        capturedInsert = values;
        return { returning: vi.fn(async () => [{ id: 'link_test_1', amount: values.amount }]) };
      }),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => ({ limit: vi.fn(async () => []) })),
      })),
    })),
  },
  desc: vi.fn((col: unknown) => col),
  eq: vi.fn((a: unknown, b: unknown) => ({ a, b })),
}));

vi.mock('@saasfly/db-core/schema', () => ({
  privatePaymentLinks: { id: 'id', title: 'title', amount: 'amount', currency: 'currency', status: 'status', createdAt: 'createdAt', expiresAt: 'expiresAt', metadata: 'metadata', networkChainId: 'network_chain_id' },
}));

import { GET, POST } from '../route';

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/nexus/payments/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const ENV_KEYS = [
  'PANDORAS_TREASURY_WALLET',
  'NEXT_PUBLIC_PANDORAS_TREASURY_WALLET',
  'PANDORAS_ADMIN_WALLET',
  'NEXT_PUBLIC_PANDORAS_ADMIN_WALLET',
  'PANDORAS_PAYOUT_WALLETS',
] as const;

describe('/api/nexus/payments/links — piloto de cobro con tarjeta (SUPER_ADMIN)', () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    mockAuth = { isAuthenticated: true, role: 'SUPER_ADMIN', email: 'admin@pandoras.finance', wallet: null };
    rateAllowed = true;
    capturedInsert = null;
    for (const key of ENV_KEYS) {
      original[key] = process.env[key];
      delete process.env[key];
    }
    process.env.PANDORAS_ADMIN_WALLET = '0x1111111111111111111111111111111111111111';
    vi.clearAllMocks();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  it('PAY-01: sin sesión → 401 y no crea nada', async () => {
    mockAuth = { isAuthenticated: false, permissions: {} };
    const res = await POST(postReq({ amount: '100.00', title: 'Servicio' }));
    expect(res.status).toBe(401);
    expect(capturedInsert).toBeNull();
  });

  it('PAY-02: sesión válida que no es SUPER_ADMIN → 403 (esconder la UI no es autorización)', async () => {
    mockAuth = { isAuthenticated: true, role: 'ADMIN', permissions: {} };
    const res = await POST(postReq({ amount: '100.00', title: 'Servicio' }));
    expect(res.status).toBe(403);
    expect(capturedInsert).toBeNull();
  });

  it('PAY-03: sin wallet configurada → 503 fail-closed, nunca un fallback hardcodeado', async () => {
    delete process.env.PANDORAS_ADMIN_WALLET;
    const res = await POST(postReq({ amount: '100.00', title: 'Servicio' }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('TREASURY_NOT_CONFIGURED');
    expect(capturedInsert).toBeNull();
  });

  it.each(['abc', '0', '-5', '1.234', '', '1000000'])('PAY-04: monto inválido %s → 422', async (amount) => {
    const res = await POST(postReq({ amount, title: 'Servicio' }));
    expect(res.status).toBe(422);
    expect(capturedInsert).toBeNull();
  });

  it('PAY-05: concepto demasiado corto → 422', async () => {
    const res = await POST(postReq({ amount: '100.00', title: 'ab' }));
    expect(res.status).toBe(422);
    expect(capturedInsert).toBeNull();
  });

  it('PAY-06: crea el link con la wallet del SERVIDOR y monto normalizado', async () => {
    const res = await POST(postReq({ amount: '1500', title: 'Consultoría octubre' }));
    expect(res.status).toBe(201);

    expect(capturedInsert).toMatchObject({
      amount: '1500.00',
      currency: 'USD',
      destinationWallet: '0x1111111111111111111111111111111111111111',
      networkChainId: 8453,
      status: 'active',
    });
    expect(capturedInsert.metadata).toMatchObject({ channel: 'nexus_card_pilot', methods: ['card'] });
    expect(capturedInsert.metadata.createdBy).toBe('admin@pandoras.finance');

    const body = await res.json();
    expect(body.link.url).toBe('/pay/card/link_test_1');
  });

  it('PAY-07: acepta la wallet elegida por el operador y la guarda normalizada', async () => {
    await POST(
      new NextRequest('http://localhost/api/nexus/payments/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: '50.00',
          title: 'Prueba',
          destinationWallet: '0x9999999999999999999999999999999999999999',
        }),
      })
    );
    expect(capturedInsert.destinationWallet).toBe('0x9999999999999999999999999999999999999999');
    expect(capturedInsert.metadata.destinationSource).toBe('custom');
  });

  it('PAY-11: wallet destino con formato inválido → 422 y no inserta', async () => {
    const res = await POST(
      postReq({ amount: '50.00', title: 'Prueba', destinationWallet: '0x123' })
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('INVALID_DESTINATION');
    expect(capturedInsert).toBeNull();
  });

  it('PAY-12: wallet cero → 422 (no se puede quemar el dinero)', async () => {
    const res = await POST(
      postReq({
        amount: '50.00',
        title: 'Prueba',
        destinationWallet: '0x0000000000000000000000000000000000000000',
      })
    );
    expect(res.status).toBe(422);
    expect(capturedInsert).toBeNull();
  });

  it('PAY-13: una wallet de la allowlist se marca como tal y el GET la ofrece', async () => {
    process.env.PANDORAS_PAYOUT_WALLETS =
      '0x2222222222222222222222222222222222222222:Tesorería Base,0x3333333333333333333333333333333333333333:Operativa';

    const res = await POST(
      postReq({
        amount: '50.00',
        title: 'Prueba',
        destinationWallet: '0x2222222222222222222222222222222222222222',
      })
    );
    expect(res.status).toBe(201);
    expect(capturedInsert.destinationWallet).toBe('0x2222222222222222222222222222222222222222');
    expect(capturedInsert.metadata.destinationSource).toBe('allowlist');
    expect(capturedInsert.metadata.destinationLabel).toBe('Tesorería Base');

    const listRes = await GET(new NextRequest('http://localhost/api/nexus/payments/links'));
    const listBody = await listRes.json();
    // La default del entorno va primero; luego la allowlist con etiqueta.
    expect(listBody.payoutOptions[0]).toMatchObject({
      address: '0x1111111111111111111111111111111111111111',
      isDefault: true,
    });
    expect(listBody.payoutOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ address: '0x2222222222222222222222222222222222222222', label: 'Tesorería Base' }),
      ])
    );
  });

  it('PAY-14: sin wallet en el entorno, una wallet elegida a mano sigue funcionando', async () => {
    delete process.env.PANDORAS_ADMIN_WALLET;

    const res = await POST(
      postReq({
        amount: '50.00',
        title: 'Prueba',
        destinationWallet: '0x4444444444444444444444444444444444444444',
      })
    );
    expect(res.status).toBe(201);
    expect(capturedInsert.destinationWallet).toBe('0x4444444444444444444444444444444444444444');
  });

  it('PAY-08: rate limit → 429 sin tocar la DB', async () => {
    rateAllowed = false;
    const res = await POST(postReq({ amount: '100.00', title: 'Servicio' }));
    expect(res.status).toBe(429);
    expect(capturedInsert).toBeNull();
  });

  it('PAY-09: GET lista sólo para SUPER_ADMIN', async () => {
    mockAuth = { isAuthenticated: true, role: 'VIEWER', permissions: {} };
    const res = await GET(
      new NextRequest('http://localhost/api/nexus/payments/links', { method: 'GET' })
    );
    expect(res.status).toBe(403);
  });

  it('PAY-10: GET expone el estado de la wallet sin filtrar secretos', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/nexus/payments/links', { method: 'GET' })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.treasury).toMatchObject({
      configured: true,
      wallet: '0x1111111111111111111111111111111111111111',
      source: 'PANDORAS_ADMIN_WALLET',
    });
    expect(body.links).toEqual([]);
  });
});
