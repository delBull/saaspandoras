/**
 * 🧪 TESTS: tokens de entrega (P0.3)
 *
 * Verifican las invariantes de seguridad:
 *  - firma válida pero URL/token revocado ⇒ no se sirve
 *  - versión reemplazada / no publicada ⇒ no se sirve
 *  - aislamiento entre tenants/artefactos
 *  - expiración, TTL fuera de rango y secreto ausente ⇒ fail-closed
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  authorizeDelivery,
  DeliveryTokenError,
  issueDeliveryToken,
  MAX_DELIVERY_TTL_SECONDS,
  verifyDeliveryTokenSignature,
} from '../delivery-token';
import { InMemoryArtifactRepository } from '../memory-repository';

const SECRET = 'test-secret-with-at-least-32-characters!!';
const TENANT = 'celeste';
const ARTIFACT = 'art_001';
const NOW = 1_800_000_000;

describe('tokens de entrega (P0.3)', () => {
  let store: InMemoryArtifactRepository;

  beforeEach(() => {
    store = new InMemoryArtifactRepository();
  });

  async function issue(overrides: Partial<Parameters<typeof issueDeliveryToken>[0]> = {}) {
    return issueDeliveryToken({
      store,
      artifactId: ARTIFACT,
      version: 2,
      tenantId: TENANT,
      issuedByKind: 'api_key',
      issuedById: 'key_123',
      ttlSeconds: 3600,
      nowSeconds: NOW,
      secret: SECRET,
      ...overrides,
    });
  }

  const publishedContext = { artifactPublished: true, currentVersion: 2 };

  it('MT-01: un token válido autoriza solo su artefacto, versión y tenant', async () => {
    const { token } = await issue();

    const record = await authorizeDelivery({
      token,
      store,
      tenantId: TENANT,
      artifactId: ARTIFACT,
      version: 2,
      context: publishedContext,
      nowSeconds: NOW + 10,
      secret: SECRET,
    });

    expect(record.artifactId).toBe(ARTIFACT);
    expect(record.version).toBe(2);
  });

  it('MT-02: el token de otro tenant no abre el recurso (aislamiento)', async () => {
    const { token } = await issue();

    await expect(
      authorizeDelivery({
        token,
        store,
        tenantId: 'otro-tenant',
        artifactId: ARTIFACT,
        version: 2,
        context: publishedContext,
        nowSeconds: NOW + 10,
        secret: SECRET,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('MT-03: un token para otra versión no sirve la versión vigente', async () => {
    const { token } = await issue({ version: 1 });

    await expect(
      authorizeDelivery({
        token,
        store,
        tenantId: TENANT,
        artifactId: ARTIFACT,
        version: 2,
        context: publishedContext,
        nowSeconds: NOW + 10,
        secret: SECRET,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('MD-05: un token expirado no se sirve', async () => {
    const { token } = await issue({ ttlSeconds: 60 });

    await expect(
      authorizeDelivery({
        token,
        store,
        tenantId: TENANT,
        artifactId: ARTIFACT,
        version: 2,
        context: publishedContext,
        nowSeconds: NOW + 61,
        secret: SECRET,
      }),
    ).rejects.toMatchObject({ code: 'EXPIRED' });
  });

  it('MD-14: revocado, el token deja de servir aunque la firma siga vigente', async () => {
    const { token, record } = await issue();

    await expect(
      authorizeDelivery({
        token,
        store,
        tenantId: TENANT,
        artifactId: ARTIFACT,
        version: 2,
        context: publishedContext,
        nowSeconds: NOW + 10,
        secret: SECRET,
      }),
    ).resolves.toBeTruthy();

    await store.revoke(record.id, NOW + 11);

    await expect(
      authorizeDelivery({
        token,
        store,
        tenantId: TENANT,
        artifactId: ARTIFACT,
        version: 2,
        context: publishedContext,
        nowSeconds: NOW + 12,
        secret: SECRET,
      }),
    ).rejects.toMatchObject({ code: 'REVOKED' });
  });

  it('MD-16: un artefacto no publicado no entrega', async () => {
    const { token } = await issue();

    await expect(
      authorizeDelivery({
        token,
        store,
        tenantId: TENANT,
        artifactId: ARTIFACT,
        version: 2,
        context: { artifactPublished: false, currentVersion: 2 },
        nowSeconds: NOW + 10,
        secret: SECRET,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('MD-15: una versión reemplazada (no vigente) no entrega', async () => {
    const { token } = await issue({ version: 1 });

    await expect(
      authorizeDelivery({
        token,
        store,
        tenantId: TENANT,
        artifactId: ARTIFACT,
        version: 1,
        context: { artifactPublished: true, currentVersion: 2 },
        nowSeconds: NOW + 10,
        secret: SECRET,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('MT-04: una firma manipulada no autoriza', async () => {
    const { token } = await issue();
    const tampered = `${token.slice(0, -4)}AAAA`;

    await expect(
      authorizeDelivery({
        token: tampered,
        store,
        tenantId: TENANT,
        artifactId: ARTIFACT,
        version: 2,
        context: publishedContext,
        nowSeconds: NOW + 10,
        secret: SECRET,
      }),
    ).rejects.toBeInstanceOf(DeliveryTokenError);
  });

  it('MT-05: un token con formato inválido no autoriza', () => {
    for (const bogus of ['', 'abc', 'pdt.x.y', 'Bearer pdt.a.b.c']) {
      expect(() => verifyDeliveryTokenSignature(bogus, { nowSeconds: NOW, secret: SECRET })).toThrow(
        DeliveryTokenError,
      );
    }
  });

  it('MT-06: TTL fuera de rango y secreto ausente son fail-closed', async () => {
    await expect(issue({ ttlSeconds: 0 })).rejects.toMatchObject({ code: 'TTL_INVALID' });
    await expect(issue({ ttlSeconds: -5 })).rejects.toMatchObject({ code: 'TTL_INVALID' });
    await expect(issue({ ttlSeconds: MAX_DELIVERY_TTL_SECONDS + 1 })).rejects.toMatchObject({
      code: 'TTL_INVALID',
    });

    const previous = process.env.CONTENT_DELIVERY_TOKEN_SECRET;
    delete process.env.CONTENT_DELIVERY_TOKEN_SECRET;
    try {
      await expect(
        issueDeliveryToken({
          store,
          artifactId: ARTIFACT,
          version: 2,
          tenantId: TENANT,
          issuedByKind: 'api_key',
          issuedById: 'key_123',
        }),
      ).rejects.toMatchObject({ code: 'SECRET_NOT_CONFIGURED' });
    } finally {
      if (previous !== undefined) process.env.CONTENT_DELIVERY_TOKEN_SECRET = previous;
    }
  });

  it('MT-07: el token no revela el artefacto (payload opaco)', async () => {
    const { token } = await issue();
    expect(token).not.toContain(ARTIFACT);
    expect(token).not.toContain(TENANT);
    expect(token.startsWith('pdt.')).toBe(true);
  });

  it('MT-08: un jti válido pero no registrado no autoriza', async () => {
    const { token } = await issue();
    const [prefix, , exp, signature] = token.split('.');

    const orphan = `${prefix}.jti_inexistente.${exp}.${signature}`;

    await expect(
      authorizeDelivery({
        token: orphan,
        store,
        tenantId: TENANT,
        artifactId: ARTIFACT,
        version: 2,
        context: publishedContext,
        nowSeconds: NOW + 10,
        secret: SECRET,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_SIGNATURE' });
  });
});
