import { describe, it, expect, vi, beforeEach } from 'vitest';
import { integrationKeyMatchesTenant } from '../a2a-tenant-match';
import { TenantAuthorityService } from '@saasfly/hermes-core';

vi.mock('@saasfly/hermes-core', () => ({
  TenantAuthorityService: { resolveCanonicalTenant: vi.fn() },
}));

const resolve = TenantAuthorityService.resolveCanonicalTenant as unknown as ReturnType<typeof vi.fn>;

describe('integrationKeyMatchesTenant — H3 A2A tenant authorization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('matches directly when the key projectId equals the canonical projectId', async () => {
    const ok = await integrationKeyMatchesTenant(999, { projectId: 999, projectSlug: 'snarai' });
    expect(ok).toBe(true);
    expect(resolve).not.toHaveBeenCalled();
  });

  it('matches the pandoras sentinel (projectId 0) when the key resolves to the same slug', async () => {
    resolve.mockResolvedValue({ canonicalOrgId: 'uuid-pandoras', projectSlug: 'pandoras', projectId: 148 });
    const ok = await integrationKeyMatchesTenant(148, { projectId: 0, projectSlug: 'pandoras' });
    expect(ok).toBe(true);
  });

  it('BLOCKS cross-tenant: another tenant key cannot target the pandoras sentinel', async () => {
    resolve.mockResolvedValue({ canonicalOrgId: 'uuid-snarai', projectSlug: 'snarai', projectId: 999 });
    const ok = await integrationKeyMatchesTenant(999, { projectId: 0, projectSlug: 'pandoras' });
    expect(ok).toBe(false);
  });

  it('fails closed when the key project cannot be resolved', async () => {
    resolve.mockResolvedValue(null);
    const ok = await integrationKeyMatchesTenant(999, { projectId: 0, projectSlug: 'pandoras' });
    expect(ok).toBe(false);
  });

  it('fails closed for a missing projectId', async () => {
    expect(await integrationKeyMatchesTenant(null, { projectId: 0, projectSlug: 'pandoras' })).toBe(false);
    expect(await integrationKeyMatchesTenant(undefined, { projectId: 0, projectSlug: 'pandoras' })).toBe(false);
    expect(resolve).not.toHaveBeenCalled();
  });
});
