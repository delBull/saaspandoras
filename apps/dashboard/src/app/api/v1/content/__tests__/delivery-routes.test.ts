/**
 * 🧪 TESTS: rutas de entrega (P0.3) — fail-closed por defecto.
 *
 * Las rutas no deben ser utilizables mientras la capacidad no esté habilitada en
 * servidor: 503 explícito, sin consultar base de datos ni emitir tokens.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { POST as issueToken } from '../assets/[assetId]/delivery-token/route';
import { GET as downloadFile } from '../assets/[assetId]/file/route';

function req(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, init);
}

const original = process.env.P0_3_DELIVERY_ENABLED;

afterEach(() => {
  if (original === undefined) delete process.env.P0_3_DELIVERY_ENABLED;
  else process.env.P0_3_DELIVERY_ENABLED = original;
});

describe('rutas de entrega P0.3', () => {
  it('DR-01: emisión de token deshabilitada → 503 DELIVERY_NOT_ENABLED', async () => {
    delete process.env.P0_3_DELIVERY_ENABLED;
    const res = await issueToken(
      req('http://localhost/api/v1/content/assets/art_1/delivery-token', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer sk_live_test' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ assetId: 'art_1' }) },
    );

    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('DELIVERY_NOT_ENABLED');
  });

  it('DR-02: proxy de descarga deshabilitado → 503 (no sirve contenido)', async () => {
    delete process.env.P0_3_DELIVERY_ENABLED;
    const res = await downloadFile(
      req('http://localhost/api/v1/content/assets/art_1/file?token=pdt.a.b.c&v=1'),
      { params: Promise.resolve({ assetId: 'art_1' }) },
    );

    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('DELIVERY_NOT_ENABLED');
  });

  it('DR-03: habilitado, el proxy exige assetId, token y versión válida', async () => {
    process.env.P0_3_DELIVERY_ENABLED = 'true';

    const cases: Array<{ assetId: string; url: string }> = [
      { assetId: '', url: 'http://localhost/api/v1/content/assets//file?token=pdt.a.b.c&v=1' },
      { assetId: 'art_1', url: 'http://localhost/api/v1/content/assets/art_1/file?v=1' },
      { assetId: 'art_1', url: 'http://localhost/api/v1/content/assets/art_1/file?token=pdt.a.b.c' },
      { assetId: 'art_1', url: 'http://localhost/api/v1/content/assets/art_1/file?token=pdt.a.b.c&v=0' },
      { assetId: 'art_1', url: 'http://localhost/api/v1/content/assets/art_1/file?token=pdt.a.b.c&v=abc' },
    ];

    for (const testCase of cases) {
      const res = await downloadFile(req(testCase.url), {
        params: Promise.resolve({ assetId: testCase.assetId }),
      });
      expect(res.status).toBe(400);
      expect((await res.json()).code).toBe('BAD_REQUEST');
    }
  });
});
