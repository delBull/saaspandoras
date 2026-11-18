import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * BYO de pinning: el tenant inyecta su nodo por API.
 *
 * Protege cuatro invariantes:
 *  1. El token viaja una vez y se guarda CIFRADO (nunca en claro).
 *  2. La respuesta NUNCA devuelve el token (sólo `hasPinToken`).
 *  3. Sin clave de cifrado en el servidor → 503 (no se guarda en claro).
 *  4. Volver a `managed` descarta el token del tenant.
 */

let authOk = true;
let projectConfig: any = {};
let savedConfig: any = null;
let sealCalls: string[] = [];
const KEK_CONFIGURED = { value: true };

vi.mock('@/lib/content/tenant-authority', () => ({
  authorizeContentClient: async () =>
    authOk
      ? {
          ok: true,
          client: {
            clientId: 7,
            tenantId: 'forge',
            projectId: 186,
            permissions: ['content.asset.read', 'content.asset.create'],
          },
        }
      : { ok: false, status: 403, error: 'Missing permission', code: 'FORBIDDEN_PERMISSION' },
}));

vi.mock('@saasfly/db-core', () => ({
  eq: (column: any, value: any) => ({ column: column.__col, value }),
}));

vi.mock('@saasfly/db/schema', () => ({
  projects: { __table: 'projects', id: { __col: 'id' }, tenantRuntimeConfig: { __col: 'config' } },
}));

vi.mock('@saasfly/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ id: 186, config: projectConfig }],
        }),
      }),
    }),
    update: () => ({
      set: (values: any) => ({
        where: async () => {
          savedConfig = values.tenantRuntimeConfig;
          projectConfig = values.tenantRuntimeConfig;
          return [values];
        },
      }),
    }),
  },
}));

vi.mock('@saasfly/hermes-core', () => ({
  isPinningSecretConfigured: () => KEK_CONFIGURED.value,
  sealPinningSecret: (plaintext: string) => {
    sealCalls.push(plaintext);
    return `v1:sealed:${plaintext.length}:payload`;
  },
}));

import { GET, PUT } from '../route';

function put(body: unknown) {
  return new NextRequest('http://localhost/api/v1/content/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: 'Bearer sk_live_test' },
    body: JSON.stringify(body),
  });
}

function get() {
  return new NextRequest('http://localhost/api/v1/content/settings', {
    method: 'GET',
    headers: { authorization: 'Bearer sk_live_test' },
  });
}

describe('PUT/GET /api/v1/content/settings — pinning BYO', () => {
  beforeEach(() => {
    authOk = true;
    projectConfig = {};
    savedConfig = null;
    sealCalls = [];
    KEK_CONFIGURED.value = true;
  });

  it('SET-01: BYO con token → se guarda cifrado y NO se devuelve', async () => {
    const res = await PUT(
      put({
        assetsPublicBaseUrl: 'https://ipfs.forge.example',
        ipfsPinning: {
          mode: 'byo',
          pinApiUrl: 'https://ipfs.forge.example/api/v0',
          pinApiToken: 'token-secreto-de-forge',
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    // El token se cifró (una sola vez) y quedó sellado en la config.
    expect(sealCalls).toEqual(['token-secreto-de-forge']);
    expect(savedConfig.ipfsPinning.mode).toBe('byo');
    expect(savedConfig.ipfsPinning.pinApiTokenSealed).toBe('v1:sealed:22:payload');
    expect(savedConfig.assetsPublicBaseUrl).toBe('https://ipfs.forge.example');

    // Jamás se devuelve el token, ni en claro ni sellado.
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('token-secreto-de-forge');
    expect(serialized).not.toContain('v1:sealed');
    expect(body.ipfsPinning.hasPinToken).toBe(true);
  });

  it('SET-02: GET reporta hasPinToken sin exponer el secreto', async () => {
    projectConfig = {
      assetsPublicBaseUrl: 'https://ipfs.forge.example',
      ipfsPinning: {
        mode: 'byo',
        pinApiUrl: 'https://ipfs.forge.example/api/v0',
        pinApiTokenSealed: 'v1:sealed:22:payload',
      },
    };

    const res = await GET(get());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ipfsPinning).toEqual({
      mode: 'byo',
      pinApiUrl: 'https://ipfs.forge.example/api/v0',
      hasPinToken: true,
    });
    expect(JSON.stringify(body)).not.toContain('v1:sealed');
  });

  it('SET-03: BYO sin token la primera vez → 422 (no queda media config)', async () => {
    const res = await PUT(
      put({ ipfsPinning: { mode: 'byo', pinApiUrl: 'https://ipfs.forge.example/api/v0' } })
    );

    expect(res.status).toBe(422);
    expect(savedConfig).toBeNull();
  });

  it('SET-04: sin clave de cifrado en el servidor → 503 y no guarda nada', async () => {
    KEK_CONFIGURED.value = false;

    const res = await PUT(
      put({
        ipfsPinning: {
          mode: 'byo',
          pinApiUrl: 'https://ipfs.forge.example/api/v0',
          pinApiToken: 'token-secreto-de-forge',
        },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.code).toBe('SECRETS_KEY_NOT_CONFIGURED');
    expect(savedConfig).toBeNull();
    expect(sealCalls).toEqual([]);
  });

  it('SET-05: volver a managed descarta el token del tenant', async () => {
    projectConfig = {
      ipfsPinning: {
        mode: 'byo',
        pinApiUrl: 'https://ipfs.forge.example/api/v0',
        pinApiTokenSealed: 'v1:sealed:22:payload',
      },
    };

    const res = await PUT(put({ ipfsPinning: { mode: 'managed' } }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(savedConfig.ipfsPinning).toEqual({ mode: 'managed' });
    expect(savedConfig.ipfsPinning.pinApiTokenSealed).toBeUndefined();
    expect(body.ipfsPinning.hasPinToken).toBe(false);
  });

  it('SET-06: pinApiUrl no-HTTPS → 422 (nada de http/plain)', async () => {
    const res = await PUT(
      put({
        ipfsPinning: {
          mode: 'byo',
          pinApiUrl: 'http://nodo-inseguro.local:5001/api/v0',
          pinApiToken: 'x',
        },
      })
    );

    expect(res.status).toBe(422);
    expect(savedConfig).toBeNull();
  });

  it('SET-07: sin permiso de escritura → 403', async () => {
    authOk = false;
    const res = await PUT(put({ ipfsPinning: { mode: 'managed' } }));
    expect(res.status).toBe(403);
    expect(savedConfig).toBeNull();
  });
});
