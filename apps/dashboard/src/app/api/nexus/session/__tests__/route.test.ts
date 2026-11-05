import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let rotateResult: any = null;
let rotateShouldThrow = false;
let rateAllowed = true;
let rotateCalls: any[] = [];

vi.mock('@saasfly/hermes-core', () => ({
  rotateCollaboratorSessionToken: vi.fn(async (token: string, opts: any) => {
    rotateCalls.push({ token, opts });
    if (rotateShouldThrow) throw new Error('db down');
    return rotateResult;
  }),
}));

vi.mock('@saasfly/shared', () => ({
  getTrustedClientIp: vi.fn(() => '127.0.0.1'),
  authRateLimiter: { isAllowed: vi.fn(async () => rateAllowed) },
}));

import { POST } from '../route';

function call(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest('http://localhost/api/nexus/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  );
}

describe('🛡️ /api/nexus/session — canje de magic link por cookie httpOnly', () => {
  beforeEach(() => {
    rotateResult = { sessionToken: 'nx_nuevo', collaboratorId: 7, role: 'COLLABORATOR' };
    rotateShouldThrow = false;
    rateAllowed = true;
    rotateCalls = [];
    vi.clearAllMocks();
  });

  it('SES-01: canjea el token y emite una cookie httpOnly con el token NUEVO', async () => {
    const res = await call({ token: 'nx_viejo' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('pandoras_nexus_token=nx_nuevo');
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);
    expect(setCookie).toContain('Path=/');
    // El token presentado es el que se rota; nunca se devuelve en el body.
    expect(rotateCalls[0].token).toBe('nx_viejo');
    expect(setCookie).not.toContain('nx_viejo');
  });

  it('SES-02: el token de un solo uso se pasa al dominio con la TTL de la sesión', async () => {
    await call({ token: 'nx_viejo' });
    expect(rotateCalls[0].opts).toEqual({ ttlHours: 24 });
  });

  it('SES-03: token inválido, expirado, ya usado o revocado → 401 sin cookie', async () => {
    rotateResult = null;
    const res = await call({ token: 'nx_usado' });
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(await res.json()).toEqual({ ok: false });
  });

  it('SES-04: sin token → 400 y no se intenta rotar', async () => {
    const res = await call({});
    expect(res.status).toBe(400);
    expect(rotateCalls.length).toBe(0);
  });

  it('SES-05: acepta el token por header (sin exponerlo en la URL)', async () => {
    const res = await call({}, { 'x-nexus-token': 'nx_header' });
    expect(res.status).toBe(200);
    expect(rotateCalls[0].token).toBe('nx_header');
  });

  it('SES-06: fallo de base de datos → 500 fail-closed, sin cookie', async () => {
    rotateShouldThrow = true;
    const res = await call({ token: 'nx_viejo' });
    expect(res.status).toBe(500);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('SES-07: rate limit → 429 sin tocar el token', async () => {
    rateAllowed = false;
    const res = await call({ token: 'nx_viejo' });
    expect(res.status).toBe(429);
    expect(rotateCalls.length).toBe(0);
  });
});
