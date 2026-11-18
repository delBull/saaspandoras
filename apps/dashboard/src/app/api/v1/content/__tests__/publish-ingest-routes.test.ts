/**
 * 🧪 TESTS: rutas de publicación e ingesta (P0.3) — fail-closed.
 *
 * Ambas capacidades están desactivadas por defecto: 503 explícito antes de tocar
 * base de datos, proveedor o sesión.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { POST as publish } from '../assets/[assetId]/publish/route';
import { POST as ingest } from '../assets/[assetId]/versions/route';

const originalDelivery = process.env.P0_3_DELIVERY_ENABLED;
const originalPublish = process.env.P0_3_PUBLISH_ENABLED;

afterEach(() => {
  if (originalDelivery === undefined) delete process.env.P0_3_DELIVERY_ENABLED;
  else process.env.P0_3_DELIVERY_ENABLED = originalDelivery;

  if (originalPublish === undefined) delete process.env.P0_3_PUBLISH_ENABLED;
  else process.env.P0_3_PUBLISH_ENABLED = originalPublish;
});

function req(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, init);
}

describe('rutas de publicación e ingesta (P0.3)', () => {
  it('PB-01: publicar deshabilitado ⇒ 503 PUBLISH_NOT_ENABLED', async () => {
    delete process.env.P0_3_DELIVERY_ENABLED;
    delete process.env.P0_3_PUBLISH_ENABLED;

    const res = await publish(
      req('http://localhost/api/v1/content/assets/art_1/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ version: 1 }),
      }),
      { params: Promise.resolve({ assetId: 'art_1' }) },
    );

    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('PUBLISH_NOT_ENABLED');
  });

  it('PB-02: delivery activo pero publicación apagada ⇒ 503 (doble interruptor)', async () => {
    process.env.P0_3_DELIVERY_ENABLED = 'true';
    delete process.env.P0_3_PUBLISH_ENABLED;

    const res = await publish(
      req('http://localhost/api/v1/content/assets/art_1/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ version: 1 }),
      }),
      { params: Promise.resolve({ assetId: 'art_1' }) },
    );

    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('PUBLISH_NOT_ENABLED');
  });

  it('IG-01: ingesta deshabilitada ⇒ 503 DELIVERY_NOT_ENABLED (sin leer el cuerpo)', async () => {
    delete process.env.P0_3_DELIVERY_ENABLED;

    const res = await ingest(
      req('http://localhost/api/v1/content/assets/art_1/versions', {
        method: 'POST',
        headers: { 'content-type': 'image/png', authorization: 'Bearer sk_live_test' },
        body: 'bytes',
      }),
      { params: Promise.resolve({ assetId: 'art_1' }) },
    );

    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('DELIVERY_NOT_ENABLED');
  });
});
