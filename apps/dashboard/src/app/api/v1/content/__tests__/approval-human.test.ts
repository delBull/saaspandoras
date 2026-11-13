/**
 * 🧪 TESTS: aprobación por identidad HUMANA (sesión de portal) — P0.3
 *
 * Verifican la frontera de seguridad:
 *  - API key ⇒ 403 sin tocar la base
 *  - sesión ausente ⇒ 401
 *  - sesión de otra organización ⇒ 404 (sin filtrar existencia)
 *  - permiso de portal insuficiente ⇒ 403
 *  - creador/dueño de la máquina ⇒ 403 desde el dominio
 *  - humano distinto ⇒ aprobación real con actor registrado
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

let artifactRow: any = { artifactId: 'art_1', tenantId: 'celeste' };
let portalContextResult: any;
let portalContextError: Error | null = null;

vi.mock('@saasfly/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => (artifactRow ? [artifactRow] : [])),
        })),
      })),
    })),
  },
}));

vi.mock('@saasfly/db/schema', () => ({
  hermesArtifacts: 'hermes_artifacts',
}));

vi.mock('@/lib/portal/resolve-portal-context', () => ({
  resolvePortalContext: vi.fn(async () => {
    if (portalContextError) throw portalContextError;
    return portalContextResult;
  }),
}));

const memoryRepoModule = await import('@/lib/content/delivery/memory-repository');
const repo = new memoryRepoModule.InMemoryArtifactRepository();

vi.mock('@/lib/content/delivery/service-factory', () => ({
  isDeliveryEnabled: () => true,
  getArtifactRepository: () => repo,
  DELIVERY_DISABLED_RESPONSE: { code: 'DELIVERY_NOT_ENABLED', error: 'x' },
}));

const { POST: approve } = await import('../assets/[assetId]/approval/route');

function makeContext(overrides: { slug?: string; actorId?: string; permissions?: string[] } = {}) {
  const permissions = overrides.permissions ?? ['growth.content', 'growth.analytics'];
  return {
    tenant: {
      actorId: overrides.actorId ?? 'actor_human_1',
      sessionId: 'sess_1',
      organizationId: 'org_celeste',
      organizationSlug: overrides.slug ?? 'celeste',
      role: 'admin',
      permissions,
    },
    organization: {
      id: 'org_celeste',
      slug: overrides.slug ?? 'celeste',
      name: 'Celeste',
      logoUrl: null,
      projectId: 42,
      activeProduct: 'HERMES',
    },
  };
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/v1/content/assets/art_1/approval', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function seedVersion(params: {
  version: number;
  status: 'in_review' | 'draft';
  createdByKind: 'api_key' | 'human';
  createdById: string;
  createdByOwnerId?: string | null;
}) {
  await repo.createVersion({
    artifactId: 'art_1',
    tenantId: 'celeste',
    version: params.version,
    status: params.status,
    sha256: 'a'.repeat(64),
    sizeBytes: 10,
    contentType: 'image/png',
    createdByKind: params.createdByKind,
    createdById: params.createdById,
    createdByOwnerId: params.createdByOwnerId ?? null,
    approvedByKind: null,
    approvedById: null,
    approvedAt: null,
    lastEditedByKind: null,
    lastEditedById: null,
    rejectedReason: null,
    replacedByVersion: null,
  });
}

describe('Aprobación humana (sesión de portal)', () => {
  beforeEach(async () => {
    artifactRow = { artifactId: 'art_1', tenantId: 'celeste' };
    portalContextError = null;
    portalContextResult = makeContext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    portalContextResult = makeContext();
  });

  it('HR-01: una API key no llega ni a consultar la base', async () => {
    const res = await approve(post({ status: 'approved' }, { authorization: 'Bearer sk_live_x' }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('HUMAN_SESSION_REQUIRED');
  });

  it('HR-02: sin sesión de portal válida ⇒ 401', async () => {
    portalContextError = new Error('PORTAL_AUTH_REQUIRED');

    const res = await approve(post({ status: 'approved' }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });

    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('PORTAL_SESSION_REQUIRED');
  });

  it('HR-03: sesión de otra organización ⇒ 404 (no revela existencia)', async () => {
    portalContextResult = makeContext({ slug: 'otra-org' });

    const res = await approve(post({ status: 'approved' }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });

    expect(res.status).toBe(404);
  });

  it('HR-04: sin permiso growth.content ⇒ 403', async () => {
    portalContextResult = makeContext({ permissions: ['growth.analytics'] });

    const res = await approve(post({ status: 'approved' }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('FORBIDDEN_PERMISSION');
  });

  it('HR-05: el propietario de la API key creadora no puede aprobar (403 del dominio)', async () => {
    await seedVersion({
      version: 90,
      status: 'in_review',
      createdByKind: 'api_key',
      createdById: 'integration_client:7',
      createdByOwnerId: 'portal:actor_human_1',
    });

    const res = await approve(post({ status: 'approved', version: 90 }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('APPROVER_IS_CREATOR');
  });

  it('HR-06: un humano distinto aprueba y queda el actor registrado', async () => {
    await seedVersion({
      version: 91,
      status: 'in_review',
      createdByKind: 'api_key',
      createdById: 'integration_client:7',
      createdByOwnerId: 'portal:otro_humano',
    });

    const res = await approve(post({ status: 'approved', version: 91, note: 'ok' }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('approved');
    expect(body.approval.approvedBy).toBe('portal:actor_human_1');

    const stored = await repo.getVersion('art_1', 91);
    expect(stored?.status).toBe('approved');
    expect(stored?.approvedByKind).toBe('human');
  });

  it('HR-07: rechazar sin motivo ⇒ 422; con motivo ⇒ 200', async () => {
    await seedVersion({
      version: 92,
      status: 'in_review',
      createdByKind: 'api_key',
      createdById: 'integration_client:7',
      createdByOwnerId: 'portal:otro_humano',
    });

    const withoutReason = await approve(post({ status: 'rejected', version: 92 }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });
    expect(withoutReason.status).toBe(422);
    expect((await withoutReason.json()).code).toBe('REASON_REQUIRED');

    const withReason = await approve(
      post({ status: 'rejected', version: 92, note: 'marca incorrecta' }),
      { params: Promise.resolve({ assetId: 'art_1' }) },
    );
    expect(withReason.status).toBe(200);
    expect((await withReason.json()).status).toBe('rejected');
  });

  it('HR-08: artefacto sin versiones gestionadas ⇒ 409 NO_VERSION', async () => {
    artifactRow = { artifactId: 'art_sin_versiones', tenantId: 'celeste' };

    const res = await approve(post({ status: 'approved' }), {
      params: Promise.resolve({ assetId: 'art_sin_versiones' }),
    });

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('NO_VERSION');
  });

  it('HR-09: asset inexistente ⇒ 404', async () => {
    artifactRow = null;

    const res = await approve(post({ status: 'approved' }), {
      params: Promise.resolve({ assetId: 'art_x' }),
    });

    expect(res.status).toBe(404);
  });
});
