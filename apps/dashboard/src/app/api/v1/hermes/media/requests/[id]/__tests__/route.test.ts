import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const MOCK_REQUEST = { id: 'req_1', tenantId: 'pandoras', status: 'REQUESTED' };

vi.mock('@saasfly/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([MOCK_REQUEST]),
        }),
      }),
    }),
  },
}));

vi.mock('@saasfly/db/schema', () => ({
  hermesMediaRequests: { id: 'hermesMediaRequests.id', tenantId: 'hermesMediaRequests.tenantId' },
  hermesGenerationAttempts: { id: 'hermesGenerationAttempts.id' },
  hermesArtifacts: { id: 'hermesArtifacts.id' },
}));

vi.mock('@saasfly/hermes-core', () => ({
  TenantAuthorityService: { resolveCanonicalTenant: vi.fn() },
  checkTenantRateLimit: vi.fn(),
  buildRateLimitHeaders: vi.fn(() => ({})),
}));

vi.mock('@/lib/integrations/auth', () => ({
  IntegrationKeyService: { validateKey: vi.fn() },
}));

vi.mock('@/lib/portal/resolve-portal-context', () => ({
  resolvePortalContext: vi.fn(),
}));

import { GET } from '../route';
import { TenantAuthorityService, checkTenantRateLimit } from '@saasfly/hermes-core';
import { IntegrationKeyService } from '@/lib/integrations/auth';

const resolve = TenantAuthorityService.resolveCanonicalTenant as unknown as ReturnType<typeof vi.fn>;
const validate = IntegrationKeyService.validateKey as unknown as ReturnType<typeof vi.fn>;
const rateLimit = checkTenantRateLimit as unknown as ReturnType<typeof vi.fn>;

const ALLOW = { allowed: true, retryAfterSeconds: 0, limit: 60, remaining: 59, resetSeconds: 60 };

function callRoute(authHeader: string) {
  const req = new NextRequest('http://localhost/api/v1/hermes/media/requests/req_1', {
    method: 'GET',
    headers: { authorization: authHeader },
  });
  return GET(req as any, { params: Promise.resolve({ id: 'req_1' }) });
}

describe('GET /api/v1/hermes/media/requests/[id] — A2A auth (H1/H2/H3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimit.mockReturnValue(ALLOW);
    resolve.mockImplementation(async (slugOrId: string) => {
      if (slugOrId === 'pandoras') return { canonicalOrgId: 'uuid-pandoras', projectSlug: 'pandoras', projectId: 0 };
      if (slugOrId === '148') return { canonicalOrgId: 'uuid-pandoras', projectSlug: 'pandoras', projectId: 148 };
      if (slugOrId === '999') return { canonicalOrgId: 'uuid-snarai', projectSlug: 'snarai', projectId: 999 };
      return null;
    });
  });

  it('H1: rejects a public key (pk_)', async () => {
    const res = await callRoute('Bearer pk_live_abc');
    expect(res.status).toBe(403);
    expect(validate).not.toHaveBeenCalled();
    const body = await res.json();
    expect(String(body.error)).toMatch(/Public key/i);
  });

  it('H2: fails closed when the secret key has no media capability (empty permissions)', async () => {
    validate.mockResolvedValue({ id: 'k1', projectId: 148, permissions: [], environment: 'production' });
    const res = await callRoute('Bearer sk_live_abc');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('FORBIDDEN_CAPABILITY');
  });

  it('H3: blocks a cross-tenant secret key targeting the pandoras sentinel', async () => {
    validate.mockResolvedValue({ id: 'k2', projectId: 999, permissions: ['media:read'], environment: 'production' });
    const res = await callRoute('Bearer sk_live_xyz');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(String(body.error)).toMatch(/Not authorized/i);
  });

  it('H5: rejects a declared environment that contradicts the key (400)', async () => {
    validate.mockResolvedValue({ id: 'k1', projectId: 148, permissions: ['media:read'], environment: 'production' });
    const req = new NextRequest('http://localhost/api/v1/hermes/media/requests/req_1', {
      method: 'GET',
      headers: { authorization: 'Bearer sk_live_abc', 'X-Pandora-Environment': 'staging' },
    });
    const res = await GET(req as any, { params: Promise.resolve({ id: 'req_1' }) });
    expect(res.status).toBe(400);
  });

  it('H5: returns 429 when the tenant rate limit is exceeded', async () => {
    validate.mockResolvedValue({ id: 'k1', projectId: 148, permissions: ['media:read'], environment: 'production' });
    rateLimit.mockReturnValue({ allowed: false, retryAfterSeconds: 30, limit: 60, remaining: 0, resetSeconds: 30 });
    const res = await callRoute('Bearer sk_live_abc');
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('RATE_LIMIT_EXCEEDED');
  });
});
