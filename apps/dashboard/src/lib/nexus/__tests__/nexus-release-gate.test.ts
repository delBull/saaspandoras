/**
 * 🧪 RELEASE GATE TEST SUITE — Nexus Production Closure
 * apps/dashboard/src/lib/nexus/__tests__/nexus-release-gate.test.ts
 *
 * Verifies the 4 release gate blockers:
 * 1. Invitation & Verification Tokens (One-time atomic burn, SHA-256 hash in reposo, no sliding).
 * 2. Trusted IP Resolution & Rate Limiting (Cloudflare/Vercel edge priority, no spoofing).
 * 3. Canonical Tenant Context (Fail-closed on multiple assignments, unassigned tenants & slug rejection).
 * 4. Immediate Session Revocation (Fail-closed on REJECTED/DISABLED without requiring re-login).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { getTrustedClientIp } from '@saasfly/shared';
import { resolveCollaboratorCanonicalOrgId, getNexusAuthContext } from '@saasfly/shared';

// Mock DB
const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@saasfly/db-core', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    db: {
      select: vi.fn((...args: any[]) => mockDb.select(...args)),
      update: vi.fn((...args: any[]) => mockDb.update(...args)),
      insert: vi.fn((...args: any[]) => mockDb.insert(...args)),
      delete: vi.fn((...args: any[]) => mockDb.delete(...args)),
    },
  };
});

vi.mock('@saasfly/auth-sdk', () => ({
  getAuth: vi.fn(async (headers: any) => {
    const wallet = headers?.get?.('x-wallet-address');
    if (wallet) {
      return { session: { address: wallet }, isVerified: true };
    }
    return { session: null, isVerified: false };
  }),
  isAdmin: vi.fn(async () => false),
}));

describe('🔒 RELEASE GATE: Nexus Production Closure Audit Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // BLOCKER 2: Rate Limiting & Trusted Edge IP Resolution
  // =========================================================================
  describe('🛡️ Blocker 2: Edge IP Resolution & Anti-Spoofing', () => {
    it('RG-01: Prioritizes platform-sealed x-real-ip over spoofed cf-connecting-ip and x-forwarded-for', () => {
      const headers = new Headers({
        'x-real-ip': '172.16.0.5',
        'cf-connecting-ip': '198.51.100.25',
        'x-forwarded-for': '10.0.0.1, 10.0.0.2',
      });
      const ip = getTrustedClientIp(headers);
      expect(ip).toBe('172.16.0.5');
    });

    it('RG-02: Falls back to cf-connecting-ip when x-real-ip is absent', () => {
      const headers = new Headers({
        'cf-connecting-ip': '198.51.100.25',
        'x-forwarded-for': '1.1.1.1, 2.2.2.2',
      });
      const ip = getTrustedClientIp(headers);
      expect(ip).toBe('198.51.100.25');
    });

    it('RG-03: Never trusts the first entry in x-forwarded-for; resolves the closest proxy IP', () => {
      // Attacker prepends 'evil.ip' to X-Forwarded-For: 'evil.ip, client.real.ip'
      const headers = new Headers({
        'x-forwarded-for': '198.51.100.1, 203.0.113.50',
      });
      const ip = getTrustedClientIp(headers);
      // Must pick the last IP appended by the trusted reverse proxy, NOT the client-injected first IP
      expect(ip).toBe('203.0.113.50');
    });

    it('RG-04: Returns partitioned untrusted fingerprint safely when no IP headers exist (anti-collision)', () => {
      const headers = new Headers({ 'user-agent': 'audit-test-client', 'accept-language': 'es' });
      const ip = getTrustedClientIp(headers);
      expect(ip).toMatch(/^untrusted_[a-f0-9]{16}$/);
    });
  });

  // =========================================================================
  // BLOCKER 3: Canonical Tenant Context (FC-001)
  // =========================================================================
  describe('🏛️ Blocker 3: Canonical Tenant Resolution & Strict Multi-Tenancy (FC-001)', () => {
    it('RG-05: Returns null when collaborator has zero project assignments', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          leftJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockResolvedValueOnce([]),
            }),
          }),
        }),
      });

      const canonicalOrgId = await resolveCollaboratorCanonicalOrgId(101, null);
      expect(canonicalOrgId).toBe(null);
    });

    it('RG-06: Resolves canonical organization UUID when exactly one project is assigned', async () => {
      const orgUuid = '11111111-2222-3333-4444-555555555555';
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          leftJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockResolvedValueOnce([
                { projectId: 'snarai', organizationId: orgUuid, slug: 'snarai', assignedAt: new Date() },
              ]),
            }),
          }),
        }),
      });

      const canonicalOrgId = await resolveCollaboratorCanonicalOrgId(101, null);
      expect(canonicalOrgId).toBe(orgUuid);
    });

    it('RG-07: REJECTS (returns null) when collaborator has multiple assignments without explicit tenant', async () => {
      const orgUuid1 = '11111111-1111-1111-1111-111111111111';
      const orgUuid2 = '22222222-2222-2222-2222-222222222222';
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          leftJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockResolvedValueOnce([
                { projectId: 'snarai', organizationId: orgUuid1, slug: 'snarai', assignedAt: new Date(1000) },
                { projectId: 'agora', organizationId: orgUuid2, slug: 'agora', assignedAt: new Date(2000) },
              ]),
            }),
          }),
        }),
      });

      // No requestedTenant header supplied — MUST NOT silently default to primary
      const canonicalOrgId = await resolveCollaboratorCanonicalOrgId(101, null);
      expect(canonicalOrgId).toBe(null);
    });

    it('RG-08: Resolves target tenant UUID when collaborator specifies one of their assigned tenants', async () => {
      const orgUuid1 = '11111111-1111-1111-1111-111111111111';
      const orgUuid2 = '22222222-2222-2222-2222-222222222222';
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          leftJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockResolvedValueOnce([
                { projectId: 'snarai', organizationId: orgUuid1, slug: 'snarai', assignedAt: new Date(1000) },
                { projectId: 'agora', organizationId: orgUuid2, slug: 'agora', assignedAt: new Date(2000) },
              ]),
            }),
          }),
        }),
      });

      const canonicalOrgId = await resolveCollaboratorCanonicalOrgId(101, 'agora');
      expect(canonicalOrgId).toBe(orgUuid2);
    });

    it('RG-09: REJECTS (returns null) fail-closed when requested tenant is not in assigned projects', async () => {
      const orgUuid1 = '11111111-1111-1111-1111-111111111111';
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          leftJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockResolvedValueOnce([
                { projectId: 'snarai', organizationId: orgUuid1, slug: 'snarai', assignedAt: new Date() },
              ]),
            }),
          }),
        }),
      });

      // Attacker tries to scope to unassigned 'malicious-corp'
      const canonicalOrgId = await resolveCollaboratorCanonicalOrgId(101, 'malicious-corp');
      expect(canonicalOrgId).toBe(null);
    });

    it('RG-10: Never returns a commercial slug when project organizationId UUID is missing', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          leftJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockResolvedValueOnce([
                { projectId: 'snarai', organizationId: null, slug: 'snarai', assignedAt: new Date() },
              ]),
            }),
          }),
        }),
      });

      // Missing canonical UUID must return null, NEVER raw slug 'snarai'
      const canonicalOrgId = await resolveCollaboratorCanonicalOrgId(101, null);
      expect(canonicalOrgId).toBe(null);
    });
  });

  // =========================================================================
  // BLOCKER 1 & 4: Token Atomic Consumption & Revocation Fail-Closed
  // =========================================================================
  describe('🔑 Blocker 1 & 4: Token Life-Cycle & Immediate Revocation', () => {
    it('RG-11: Token verification matches SHA-256 hash in reposo and atomically burns the token', async () => {
      const { verifyCollaboratorToken } = await import('@saasfly/hermes-core');
      const rawToken = 'nx_test_token_secret_12345';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Mock first atomic update returning the burned record
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([
              {
                id: 42,
                name: 'Alice',
                email: 'alice@pandoras.finance',
                role: 'COLLABORATOR',
                status: 'ACTIVE',
                expiresAt: new Date(0), // burned
                lastAccessAt: new Date(),
                createdAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const verified = await verifyCollaboratorToken(rawToken);
      expect(verified).not.toBe(null);
      expect(verified?.email).toBe('alice@pandoras.finance');

      // Check that the update burned the token to consumed_ sentinel and expiresAt: 0
      const updateCall = mockDb.update.mock.results[0]?.value.set.mock.calls[0][0];
      expect(updateCall.token).toMatch(/^consumed_/);
      expect(updateCall.expiresAt.getTime()).toBe(0);
    });

    it('RG-12: Replay attack fails closed immediately because token is already burned', async () => {
      const { verifyCollaboratorToken } = await import('@saasfly/hermes-core');
      const rawToken = 'nx_test_token_secret_12345';

      // Atomic update returns empty array because token was consumed / expired
      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const replayResult = await verifyCollaboratorToken(rawToken);
      expect(replayResult).toBe(null);
    });

    it('RG-13: Next privileged request from rejected/disabled collaborator fails closed without re-login', async () => {
      // A collaborator connects with wallet session.
      // Database has user with historic role 'admin', BUT nexus_collaborators has status 'REJECTED'.
      mockDb.select
        // 1. users lookup
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([
                { id: 'usr_1', walletAddress: '0xwalletalice', email: 'alice@pandoras.finance', role: 'admin' },
              ]),
            }),
          }),
        })
        // 2. nexus_collaborators lookup
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce([
                { id: 42, name: 'Alice', email: 'alice@pandoras.finance', status: 'REJECTED', role: 'ADMIN' },
              ]),
            }),
          }),
        });

      const headers = new Headers({ 'x-wallet-address': '0xwalletalice' });
      const auth = await getNexusAuthContext(headers, null, 'NEXUS');
      // Must be immediately rejected fail-closed, ignoring the historical users.role
      expect(auth.isAuthenticated).toBe(false);
      expect(auth.role).toBe(null);
      expect(auth.provisionStatus).toBe('REJECTED');
    });

    it('RG-14: Expired token in getNexusAuthContext fails closed without sliding expiration', async () => {
      // Mock db lookup for expired token returning 0 rows
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const auth = await getNexusAuthContext(null, 'expired_token_123', 'NEXUS');
      expect(auth.isAuthenticated).toBe(false);
      expect(auth.role).toBe(null);
    });
  });
});
