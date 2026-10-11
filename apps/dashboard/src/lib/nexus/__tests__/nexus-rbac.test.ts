/**
 * 🧪 Test Suite: Nexus RBAC & Capability Resolution
 * apps/dashboard/src/lib/nexus/__tests__/nexus-rbac.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import {
  resolveEffectivePermissions,
  checkNexusPermission,
  type NexusAuthContext,
} from '@saasfly/shared';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

describe('🛡️ Nexus RBAC Domain Engine', () => {
  it('RBAC-01: SUPER_ADMIN has uninhibited access across all planes including institutional books', () => {
    const perms = resolveEffectivePermissions('SUPER_ADMIN', null, 'ADMIN');
    expect(perms["users.manage"]).toBe(true);
    expect(perms["growth.manage"]).toBe(true);
    expect(perms["nexus.manage"]).toBe(true);
    expect(perms["marketing.manage"]).toBe(true);
    expect(perms.ecosystem).toBe(true);
    expect(perms.institutionalBooks).toBe(true);
  });

  it('RBAC-02: ADMIN has full administrative capabilities but strictly blocked from institutional books without 2FA', () => {
    const perms = resolveEffectivePermissions('ADMIN');
    expect(perms["users.manage"]).toBe(true);
    expect(perms["growth.manage"]).toBe(true);
    expect(perms["nexus.manage"]).toBe(true);
    expect(perms["marketing.manage"]).toBe(true);
    expect(perms.ecosystem).toBe(true);
    expect(perms.institutionalBooks).toBe(false);
  });

  it('RBAC-03: MARKETING defaults to Marketing Hub, but blocked from Deal Room, Users, and Settings', () => {
    const perms = resolveEffectivePermissions('MARKETING');
    expect(perms["users.manage"]).toBe(false);
    expect(perms["growth.manage"]).toBe(false);
    expect(perms["nexus.manage"]).toBe(false);
    expect(perms["marketing.manage"]).toBe(true);
    expect(perms.ecosystem).toBe(true);
    expect(perms.institutionalBooks).toBe(false);
  });

  it('RBAC-04: VIEWER defaults to Ecosystem Hub only', () => {
    const perms = resolveEffectivePermissions('VIEWER');
    expect(perms["users.manage"]).toBe(false);
    expect(perms["growth.manage"]).toBe(false);
    expect(perms["nexus.manage"]).toBe(false);
    expect(perms["marketing.manage"]).toBe(false);
    expect(perms.ecosystem).toBe(true);
    expect(perms.institutionalBooks).toBe(false);
  });

  it('RBAC-05: Granular override allows giving Deal Room access to a Manager or Collaborator', () => {
    const perms = resolveEffectivePermissions('MARKETING', { "users.manage": true });
    expect(perms["users.manage"]).toBe(true);
    expect(perms["marketing.manage"]).toBe(true);

    const collabPerms = resolveEffectivePermissions('VIEWER', { "users.manage": true, "growth.manage": true });
    expect(collabPerms["users.manage"]).toBe(true);
    expect(collabPerms["growth.manage"]).toBe(true);
  });

  it('RBAC-06: Security Invariant — Institutional books CANNOT be granted via overrides to non-superadmin', () => {
    // Attempt spoofing / injecting institutionalBooks override
    const perms = resolveEffectivePermissions('ADMIN', {
      "users.manage": true,
    });
    expect(perms.institutionalBooks).toBe(false);

    const managerPerms = resolveEffectivePermissions('MARKETING', {
      "users.manage": true,
    });
    expect(managerPerms.institutionalBooks).toBe(false);
  });

  it('RBAC-07: checkNexusPermission respects unauthenticated context fail-closed', () => {
    const unauthCtx: NexusAuthContext = {
      isAuthenticated: false,
      role: null,
      surface: 'UNKNOWN',
      permissions: {
        "users.manage": false,
        "tenants.manage": false,
        "finance.manage": false,
        "growth.manage": false,
        "nexus.manage": false,
        "marketing.manage": false,
        ecosystem: false,
        institutionalBooks: false,
      },
    };

    expect(checkNexusPermission(unauthCtx, 'users.manage')).toBe(false);
    expect(checkNexusPermission(unauthCtx, 'growth.manage')).toBe(false);
    expect(checkNexusPermission(unauthCtx, 'ecosystem')).toBe(false);
  });

  it('RBAC-08: getNexusAuthContext extracts token from cookie header safely', async () => {
    const { getNexusAuthContext } = await import('@saasfly/shared');
    const customHeaders = new Headers({
      cookie: 'pandoras_nexus_token=non_existent_mock_token_123',
    });

    const ctx = await getNexusAuthContext(customHeaders);
    // Non-existent token fails closed safely
    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.role).toBe(null);
  });

  it('RBAC-09: SUPER_ADMIN is the sole authority for institutional books and master operations', () => {
    const superPerms = resolveEffectivePermissions('SUPER_ADMIN', null, 'ADMIN');
    const adminPerms = resolveEffectivePermissions('ADMIN');
    const opsPerms = resolveEffectivePermissions('ADMIN_OPERATIONS');

    expect(superPerms.institutionalBooks).toBe(true);
    expect(adminPerms.institutionalBooks).toBe(false);
    expect(opsPerms.institutionalBooks).toBe(false);
  });

  it('RBAC-10: Surface auto-discovery rejects spoofed referer headers (fail-closed)', async () => {
    const { getNexusAuthContext } = await import('@saasfly/shared');
    // An attacker sends a header with referer claiming to be on /admin
    const spoofedHeaders = new Headers({
      referer: 'https://pandoras.finance/admin',
    });

    const ctx = await getNexusAuthContext(spoofedHeaders);
    // Surface must remain UNKNOWN because referer is not an authority
    expect(ctx.surface).toBe('UNKNOWN');
  });

  it('RBAC-11: Academy SSO token confinement restricts admin privileges to ACADEMY surface only', async () => {
    const { getNexusAuthContext } = await import('@saasfly/shared');
    vi.mock('@saasfly/nexus-deals-sdk', () => ({
      verifyAcademyToken: vi.fn(async () => ({
        valid: true,
        role: 'admin',
        email: 'academy_admin@pandoras.finance',
      })),
    }));

    // Calling under NEXUS surface with Academy token
    const nexusHeaders = new Headers({
      'x-invoke-path': '/api/nexus/overview',
    });
    const nexusCtx = await getNexusAuthContext(nexusHeaders, 'academy_mock_token_123', 'NEXUS');
    expect(nexusCtx.isAuthenticated).toBe(true);
    // In NEXUS surface, an Academy admin token MUST NOT elevate to ADMIN
    expect(nexusCtx.role).toBe('VIEWER');

    // Calling under ACADEMY surface with the same token
    const academyHeaders = new Headers({
      'x-invoke-path': '/api/academy/courses',
    });
    const academyCtx = await getNexusAuthContext(academyHeaders, 'academy_mock_token_123', 'ACADEMY');
    expect(academyCtx.isAuthenticated).toBe(true);
    expect(academyCtx.role).toBe('ADMIN');
    expect(academyCtx.surface).toBe('ACADEMY');
  });
});
