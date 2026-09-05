/**
 * 🧪 Test Suite: Nexus RBAC & Capability Resolution
 * apps/dashboard/src/lib/nexus/__tests__/nexus-rbac.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  resolveEffectivePermissions,
  checkNexusPermission,
  type NexusAuthContext,
} from '../nexus-rbac';

describe('🛡️ Nexus RBAC Domain Engine', () => {
  it('RBAC-01: SUPER_ADMIN has uninhibited access across all planes including institutional books', () => {
    const perms = resolveEffectivePermissions('SUPER_ADMIN');
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

  it('RBAC-03: MARKETING defaults to Academy Admin & Hermes QA, but blocked from Deal Room and Settings', () => {
    const perms = resolveEffectivePermissions('MARKETING');
    expect(perms["users.manage"]).toBe(false);
    expect(perms["growth.manage"]).toBe(true);
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
    expect(perms["growth.manage"]).toBe(true);

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
});
