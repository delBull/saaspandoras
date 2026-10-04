import { resolveCanonicalAuthSession } from '../canonical-resolver';
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationSDK } from '@saasfly/shared';
import { validatePortalSession } from '@saasfly/shared';

vi.mock('@saasfly/shared', () => ({
  OrganizationSDK: {
    resolve: vi.fn(),
  },
}));

vi.mock('@saasfly/shared', () => ({
  validatePortalSession: vi.fn(),
}));

vi.mock('../auth/session-token.service', () => {
  return {
    SessionTokenService: class {
      verifyToken = vi.fn((token) => {
        if (token === 'valid_bearer') {
          return { organizationId: 'org_123', actorId: 'tma_actor' };
        }
        throw new Error('Invalid token');
      });
    }
  };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

vi.mock('@saasfly/auth-sdk', () => ({
  getAuth: vi.fn().mockResolvedValue({ isVerified: false }),
  isAdmin: vi.fn().mockResolvedValue(false),
}));

vi.mock('../auth/wallet-tenant-membership', () => ({
  isWalletAuthorizedForTenant: vi.fn().mockResolvedValue(false),
}));

describe('resolveCanonicalAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valid session -> returns valid canonical session', async () => {
    const req = new NextRequest('http://localhost');
    req.headers.set('authorization', 'Bearer valid_bearer');
    
    // Valid organization resolved
    (OrganizationSDK.resolve as any).mockResolvedValue({
      organizationId: 'org_123',
      slug: 'valid-slug',
      tenantType: 'PRODUCTION',
    });

    const session = await resolveCanonicalAuthSession(req);
    expect(session).toBeDefined();
    expect(session?.canonicalOrgId).toBe('org_123');
    expect(session?.projectSlug).toBe('valid-slug');
    expect(OrganizationSDK.resolve).toHaveBeenCalledWith('org_123', 'HERMES');
  });

  it('invalid tenant -> returns null (fail-closed)', async () => {
    const req = new NextRequest('http://localhost');
    req.headers.set('authorization', 'Bearer valid_bearer');
    
    // Organization does not exist
    (OrganizationSDK.resolve as any).mockResolvedValue(null);

    const session = await resolveCanonicalAuthSession(req);
    expect(session).toBeNull();
  });

  it('cross-tenant -> returns null (spoofing rejected)', async () => {
    const req = new NextRequest('http://localhost');
    req.headers.set('authorization', 'Bearer valid_bearer'); // resolves to org_123
    
    // Requested organization is different
    const requestedOrg = 'different-org';
    
    // When resolving org_123 to check its slug, it returns 'valid-slug', which doesn't match 'different-org'
    (OrganizationSDK.resolve as any).mockResolvedValue({
      organizationId: 'org_123',
      slug: 'valid-slug',
      tenantType: 'PRODUCTION',
    });

    const session = await resolveCanonicalAuthSession(req, requestedOrg);
    expect(session).toBeNull();
  });

  it('invalid bearer -> returns null', async () => {
    const req = new NextRequest('http://localhost');
    req.headers.set('authorization', 'Bearer invalid_bearer');
    
    const session = await resolveCanonicalAuthSession(req);
    expect(session).toBeNull();
  });
});
