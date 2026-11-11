import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ────────────────────────────────────────────────────────────────────
let authResult: any = {
  ok: true,
  client: {
    clientId: 7,
    keyType: 'secret',
    environment: 'production',
    permissions: ['content.asset.create', 'content.asset.read'],
    tenantId: 'forge',
    canonicalOrgId: 'forge',
    projectId: 42,
    projectTitle: 'Forge',
  },
};
let capabilityGranted = true;
let rateAllowed = true;

let createRequestResult: any = { request: { id: 'req_real_1', status: 'REQUESTED' }, isNew: true };
let generationResult: any = {
  ok: true,
  status: 'COMPLETED',
  provider: 'runpod',
  attemptCount: 1,
  artifactId: 'art_1',
  artifact: { artifactId: 'art_1', cid: 'bafy_real', sha256: 'deadbeef' },
  isIdempotentReplay: false,
};
let executeCalls: any[] = [];
let createCalls: any[] = [];

let jobRow: any = null;
let artifactRows: any[] = [];
let updatedArtifact: any = null;

vi.mock('@/lib/content/tenant-authority', () => ({
  authorizeContentClient: vi.fn(async () => authResult),
  resolveContentCapability: (type: string) => {
    const map: Record<string, string> = {
      image: 'Media.Image',
      image_render: 'Media.Image',
      video_render: 'Media.Video',
      copy: 'Media.Copy',
    };
    return map[(type || '').toLowerCase()] ?? null;
  },
}));

vi.mock('@saasfly/hermes-core', () => ({
  CapabilityGrantService: { isCapabilityGranted: vi.fn(async () => capabilityGranted) },
  checkTenantRateLimit: vi.fn(() => ({ allowed: rateAllowed, retryAfterSeconds: 30 })),
  buildRateLimitHeaders: vi.fn(() => ({})),
  HermesMediaOrchestratorService: {
    createOrGetMediaRequest: vi.fn(async (...args: any[]) => {
      createCalls.push(args);
      return createRequestResult;
    }),
    executeGeneration: vi.fn(async (...args: any[]) => {
      executeCalls.push(args);
      return generationResult;
    }),
  },
}));

vi.mock('@saasfly/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => {
            // projects (config de entrega) devuelve vacío; jobs y artifacts sus filas
            if (table === 'projects') return [];
            return table === 'hermes_media_requests' ? (jobRow ? [jobRow] : []) : artifactRows;
          }),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(async () => artifactRows),
            })),
          })),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((values: any) => ({
        where: vi.fn(async () => {
          updatedArtifact = values;
          return [values];
        }),
      })),
    })),
  },
}));

vi.mock('@saasfly/db/schema', () => ({
  hermesMediaRequests: 'hermes_media_requests',
  hermesArtifacts: 'hermes_artifacts',
  projects: 'projects',
}));

import { POST as createJob } from '../jobs/route';
import { GET as getJob } from '../jobs/[jobId]/route';
import { GET as listAssets } from '../assets/route';
import { POST as approveAsset } from '../assets/[assetId]/approval/route';

function post(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/v1/content/jobs', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer sk_live_test', ...headers },
    body: JSON.stringify(body),
  });
}

describe('Content API (Media Co) — sin mocks, acotada al tenant', () => {
  beforeEach(() => {
    authResult = {
      ok: true,
      client: {
        clientId: 7,
        keyType: 'secret',
        environment: 'production',
        permissions: ['content.asset.create', 'content.asset.read'],
        tenantId: 'forge',
        canonicalOrgId: 'forge',
        projectId: 42,
        projectTitle: 'Forge',
      },
    };
    capabilityGranted = true;
    rateAllowed = true;
    createRequestResult = { request: { id: 'req_real_1', status: 'REQUESTED' }, isNew: true };
    generationResult = {
      ok: true,
      status: 'COMPLETED',
      provider: 'runpod',
      attemptCount: 1,
      artifactId: 'art_1',
      artifact: { artifactId: 'art_1', cid: 'bafy_real', sha256: 'deadbeef' },
      isIdempotentReplay: false,
    };
    executeCalls = [];
    createCalls = [];
    // Determinismo: el entorno de test no debe heredar un endpoint global.
    delete process.env.RUNPOD_DEFAULT_ENDPOINT;
    jobRow = null;
    artifactRows = [];
    updatedArtifact = null;
    vi.clearAllMocks();
  });

  // ── POST /jobs ─────────────────────────────────────────────────────────────
  it('JOB-01: sin permiso de creación → 403 y no genera', async () => {
    authResult = { ok: false, status: 403, error: 'Missing required permission', code: 'FORBIDDEN_PERMISSION' };
    const res = await createJob(post({ title: 'Render de prueba', type: 'image' }));
    expect(res.status).toBe(403);
    expect(executeCalls.length).toBe(0);
  });

  it('JOB-02: tipo de contenido desconocido → 422 con allowlist', async () => {
    const res = await createJob(post({ title: 'Render de prueba', type: 'nft_magic' }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.allowedTypes).toContain('image');
    expect(executeCalls.length).toBe(0);
  });

  it('JOB-03: capability no otorgada al tenant → 403 (governance)', async () => {
    capabilityGranted = false;
    const res = await createJob(post({ title: 'Render de prueba', type: 'image' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('CAPABILITY_NOT_GRANTED');
    expect(executeCalls.length).toBe(0);
  });

  it('JOB-04: rate limit → 429 sin ejecutar', async () => {
    rateAllowed = false;
    const res = await createJob(post({ title: 'Render de prueba', type: 'image' }));
    expect(res.status).toBe(429);
    expect(executeCalls.length).toBe(0);
  });

  it('JOB-04a: sin endpointId y sin RUNPOD_DEFAULT_ENDPOINT → 422 fail-closed', async () => {
    delete process.env.RUNPOD_DEFAULT_ENDPOINT;
    const res = await createJob(post({ title: 'Render', type: 'image', provider: 'runpod' }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('RUNPOD_ENDPOINT_REQUIRED');
    expect(executeCalls.length).toBe(0);
  });

  it('JOB-04d: sin provider ni endpointId → usa Sofía por defecto', async () => {
    const res = await createJob(post({ title: 'Render', type: 'image' }));
    expect(res.status).toBe(200);
    expect(executeCalls[0][2]?.provider).toBe('sofia');
  });

  it('JOB-04b: endpointId con formato inválido → 422 sin ejecutar', async () => {
    const res = await createJob(post({ title: 'Render', type: 'image', endpointId: 'no-válido!' }));
    expect(res.status).toBe(422);
    expect(executeCalls.length).toBe(0);
  });

  it('JOB-04c: RUNPOD_DEFAULT_ENDPOINT configurado permite no enviar endpointId', async () => {
    process.env.RUNPOD_DEFAULT_ENDPOINT = 'epdefault01';
    try {
      const res = await createJob(post({ title: 'Render', type: 'image', provider: 'runpod' }));
      expect(res.status).toBe(200);
      expect(executeCalls.length).toBe(1);
      expect(executeCalls[0][2]?.endpointId).toBeUndefined();
    } finally {
      delete process.env.RUNPOD_DEFAULT_ENDPOINT;
    }
  });

  it('JOB-05: ejecuta de verdad y devuelve jobId/artifact reales (sin fabricar)', async () => {
    const res = await createJob(
      post({
        title: 'Render',
        type: 'video_render',
        parameters: { script: 'Hola' },
        endpointId: 'epforge01',
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.jobId).toBe('req_real_1');
    expect(body.artifactId).toBe('art_1');
    expect(body.artifact.cid).toBe('bafy_real');
    expect(executeCalls.length).toBe(1);
    // El tenant enviado al orquestador es el de la KEY, no el del body.
    expect(executeCalls[0][0]).toBe('forge');
    // El endpoint del job viaja al orquestador (y a la creación del request).
    expect(executeCalls[0][2]?.endpointId).toBe('epforge01');
    expect(createCalls[0][1]?.endpointId).toBe('epforge01');
  });

  it('JOB-06: wait=false → 202 y ejecución en segundo plano', async () => {
    const res = await createJob(
      post({ title: 'Render', type: 'image', wait: false, endpointId: 'epforge01' })
    );
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.jobId).toBe('req_real_1');
    expect(body.status).toBe('REQUESTED');
  });

  it('JOB-07: un body con tenantId ajeno NO cambia el tenant autorizado', async () => {
    await createJob(post({ title: 'Render', type: 'image', tenantId: 'pandoras', endpointId: 'epforge01' }));
    expect(executeCalls[0][0]).toBe('forge');
  });

  // ── GET /jobs/:id ──────────────────────────────────────────────────────────
  it('JOB-08: job de otro tenant → 404 (no filtra existencia)', async () => {
    jobRow = null; // el where incluye tenantId; el mock devuelve vacío
    const res = await getJob(post({}), { params: Promise.resolve({ jobId: 'req_ajeno' }) });
    expect(res.status).toBe(404);
  });

  it('JOB-09: job propio → 200 con estado real', async () => {
    jobRow = {
      id: 'req_real_1',
      status: 'COMPLETED',
      provider: 'runpod',
      capability: 'Media.Image',
      artifactId: 'art_1',
      failureCode: null,
      failureMessage: null,
      createdAt: new Date('2026-11-11T00:00:00Z'),
      completedAt: new Date('2026-11-11T00:01:00Z'),
      briefJson: { provider: 'runpod' },
    };
    const res = await getJob(post({}), { params: Promise.resolve({ jobId: 'req_real_1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.job.status).toBe('COMPLETED');
    expect(body.job.artifactId).toBe('art_1');
  });

  // ── GET /assets ────────────────────────────────────────────────────────────
  it('ASSET-01: devuelve artefactos reales con CID/SHA y paginación', async () => {
    artifactRows = [
      {
        id: 'row_1',
        artifactId: 'art_1',
        tenantId: 'forge',
        artifactType: 'image',
        title: 'Poster',
        cid: 'bafy_real',
        ipfsUri: 'ipfs://bafy_real',
        sha256: 'deadbeef',
        mimeType: 'image/png',
        sizeBytes: 1234,
        producer: 'pixel',
        createdAt: new Date('2026-11-11T00:00:00Z'),
        metadataJson: { approval: { status: 'approved' } },
      },
    ];
    const res = await listAssets(
      new NextRequest('http://localhost/api/v1/content/assets?limit=10', {
        headers: { authorization: 'Bearer sk_live_test' },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assets.length).toBe(1);
    expect(body.assets[0].cid).toBe('bafy_real');
    expect(body.pagination).toMatchObject({ limit: 10, offset: 0 });
  });

  // ── Approval ───────────────────────────────────────────────────────────────
  it('APR-01: estado inválido → 422', async () => {
    const res = await approveAsset(
      new NextRequest('http://localhost/api/v1/content/assets/art_1/approval', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer sk_live_test' },
        body: JSON.stringify({ status: 'quizas' }),
      }),
      { params: Promise.resolve({ assetId: 'art_1' }) }
    );
    expect(res.status).toBe(422);
  });

  it('APR-02: asset inexistente / de otro tenant → 404', async () => {
    artifactRows = [];
    const res = await approveAsset(
      new NextRequest('http://localhost/api/v1/content/assets/art_ajeno/approval', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer sk_live_test' },
        body: JSON.stringify({ status: 'approved' }),
      }),
      { params: Promise.resolve({ assetId: 'art_ajeno' }) }
    );
    expect(res.status).toBe(404);
  });
});
