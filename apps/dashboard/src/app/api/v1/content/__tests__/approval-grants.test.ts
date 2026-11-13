/**
 * 🧪 TESTS: aprobación con GRANTS de tenant (P0.1) en modo estricto.
 *
 * Con `P0_1_GRANTS_ENFORCED=true`, la autoridad es el grant (capability canónica),
 * no el rol del portal. Sin grant ⇒ 403; con grant revocado ⇒ 403; con grant
 * vigente ⇒ la aprobación procede y queda el actor humano registrado.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const ORG_UUID = '8f1a3c2e-0000-4000-8000-000000000001';
let artifactRow: any = { artifactId: 'art_1', tenantId: 'celeste' };
let portalContextResult: any;

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

vi.mock('@saasfly/db/schema', () => ({ hermesArtifacts: 'hermes_artifacts' }));

vi.mock('@/lib/portal/resolve-portal-context', () => ({
  resolvePortalContext: vi.fn(async () => portalContextResult),
}));

const memoryRepo = await import('@/lib/content/delivery/memory-repository');
const deliveryRepo = new memoryRepo.InMemoryArtifactRepository();

vi.mock('@/lib/content/delivery/service-factory', () => ({
  isDeliveryEnabled: () => true,
  getArtifactRepository: () => deliveryRepo,
  DELIVERY_DISABLED_RESPONSE: { code: 'DELIVERY_NOT_ENABLED', error: 'x' },
}));

const grantModule = await import('@/lib/authorization/tenant-grant');
const grantsMemory: import('@/lib/authorization/authorize-tenant-capability').TenantGrantRepository & {
  rows: import('@/lib/authorization/tenant-grant').TenantAuthorizationGrant[];
} = {
  rows: [],
  async listBySubject() {
    return this.rows;
  },
  async create(grant) {
    this.rows.push(grant);
  },
  async revoke(id, revokedAt) {
    const index = this.rows.findIndex((g) => g.id === id);
    if (index === -1) return false;
    this.rows[index] = grantModule.revokeTenantGrant(this.rows[index]!, revokedAt);
    return true;
  },
  async countByOrganization() {
    return this.rows.length;
  },
};

vi.mock('@/lib/authorization/service-factory', () => ({
  GRANTS_ENFORCED_ENV: 'P0_1_GRANTS_ENFORCED',
  areTenantGrantsEnforced: () => process.env.P0_1_GRANTS_ENFORCED === 'true',
  getTenantGrantRepository: () => grantsMemory,
  getCanonicalOrganizationResolver: () => ({
    resolve: async () => ({ canonicalOrgId: ORG_UUID, projectId: 42, slug: 'celeste' }),
  }),
}));

const { POST: approve } = await import('../assets/[assetId]/approval/route');

const originalEnv = process.env.P0_1_GRANTS_ENFORCED;

function makeContext(permissions: string[] = ['growth.content']) {
  return {
    tenant: {
      actorId: 'actor_human_1',
      sessionId: 'sess_1',
      organizationId: ORG_UUID,
      organizationSlug: 'celeste',
      role: 'admin',
      permissions,
    },
    organization: {
      id: ORG_UUID,
      slug: 'celeste',
      name: 'Celeste',
      logoUrl: null,
      projectId: 42,
      activeProduct: 'HERMES',
    },
  };
}

function post(body: unknown) {
  return new NextRequest('http://localhost/api/v1/content/assets/art_1/approval', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function seedVersion(version: number) {
  await deliveryRepo.createVersion({
    artifactId: 'art_1',
    tenantId: 'celeste',
    version,
    status: 'in_review',
    sha256: 'b'.repeat(64),
    sizeBytes: 10,
    contentType: 'image/png',
    createdByKind: 'api_key',
    createdById: 'integration_client:7',
    createdByOwnerId: 'portal:otro_humano',
    approvedByKind: null,
    approvedById: null,
    approvedAt: null,
    lastEditedByKind: null,
    lastEditedById: null,
    rejectedReason: null,
    replacedByVersion: null,
  });
}

describe('Aprobación con grants de tenant (modo estricto)', () => {
  beforeEach(() => {
    artifactRow = { artifactId: 'art_1', tenantId: 'celeste' };
    portalContextResult = makeContext();
    grantsMemory.rows = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.P0_1_GRANTS_ENFORCED;
    else process.env.P0_1_GRANTS_ENFORCED = originalEnv;
  });

  it('GR-01: sin grant ⇒ 403 FORBIDDEN_TENANT_CAPABILITY (el rol del portal no basta)', async () => {
    process.env.P0_1_GRANTS_ENFORCED = 'true';
    await seedVersion(80);

    const res = await approve(post({ status: 'approved', version: 80 }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN_TENANT_CAPABILITY');
    expect(body.reason).toBe('GRANT_MISSING');
    expect((await deliveryRepo.getVersion('art_1', 80))?.status).toBe('in_review');
  });

  it('GR-02: con grant vigente de content.asset.approve ⇒ aprueba y registra al humano', async () => {
    process.env.P0_1_GRANTS_ENFORCED = 'true';
    await seedVersion(81);

    grantsMemory.rows = [
      grantModule.buildTenantGrant({
        id: 'grant_approve',
        organizationId: ORG_UUID,
        subjectId: 'portal:actor_human_1',
        requestedCapabilities: ['content.asset.approve'],
        resourceScope: { kind: 'organization' },
        issuer: {
          subjectId: 'human_admin',
          capabilities: ['content.asset.approve'],
        },
        ttlSeconds: 3600,
        nowSeconds: Math.floor(Date.now() / 1000),
      }),
    ];

    const res = await approve(post({ status: 'approved', version: 81 }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('approved');
    expect(body.approval.approvedBy).toBe('portal:actor_human_1');
    expect((await deliveryRepo.getVersion('art_1', 81))?.status).toBe('approved');
  });

  it('GR-03: grant revocado ⇒ 403 GRANT_REVOKED', async () => {
    process.env.P0_1_GRANTS_ENFORCED = 'true';
    await seedVersion(82);

    const active = grantModule.buildTenantGrant({
      id: 'grant_revoked',
      organizationId: ORG_UUID,
      subjectId: 'portal:actor_human_1',
      requestedCapabilities: ['content.asset.approve'],
      resourceScope: { kind: 'organization' },
      issuer: { subjectId: 'human_admin', capabilities: ['content.asset.approve'] },
      ttlSeconds: 3600,
      nowSeconds: Math.floor(Date.now() / 1000),
    });
    grantsMemory.rows = [grantModule.revokeTenantGrant(active, Math.floor(Date.now() / 1000))];

    const res = await approve(post({ status: 'approved', version: 82 }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });

    expect(res.status).toBe(403);
    expect((await res.json()).reason).toBe('GRANT_REVOKED');
    expect((await deliveryRepo.getVersion('art_1', 82))?.status).toBe('in_review');
  });

  it('GR-04: sin el flag, se conserva la autoridad previa del portal (rollout)', async () => {
    delete process.env.P0_1_GRANTS_ENFORCED;
    await seedVersion(83);
    portalContextResult = makeContext([]); // sin growth.content

    const res = await approve(post({ status: 'approved', version: 83 }), {
      params: Promise.resolve({ assetId: 'art_1' }),
    });

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('FORBIDDEN_PERMISSION');
  });
});
