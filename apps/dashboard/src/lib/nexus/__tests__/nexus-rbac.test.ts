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
    expect(perms.dealRoom).toBe(true);
    expect(perms.academyAdmin).toBe(true);
    expect(perms.settings).toBe(true);
    expect(perms.hermesQa).toBe(true);
    expect(perms.ecosystem).toBe(true);
    expect(perms.institutionalBooks).toBe(true);
  });

  it('RBAC-02: ADMIN has full administrative capabilities but strictly blocked from institutional books without 2FA', () => {
    const perms = resolveEffectivePermissions('ADMIN');
    expect(perms.dealRoom).toBe(true);
    expect(perms.academyAdmin).toBe(true);
    expect(perms.settings).toBe(true);
    expect(perms.hermesQa).toBe(true);
    expect(perms.ecosystem).toBe(true);
    expect(perms.institutionalBooks).toBe(false);
  });

  it('RBAC-03: MANAGER defaults to Academy Admin & Hermes QA, but blocked from Deal Room and Settings', () => {
    const perms = resolveEffectivePermissions('MANAGER');
    expect(perms.dealRoom).toBe(false);
    expect(perms.academyAdmin).toBe(true);
    expect(perms.settings).toBe(false);
    expect(perms.hermesQa).toBe(true);
    expect(perms.ecosystem).toBe(true);
    expect(perms.institutionalBooks).toBe(false);
  });

  it('RBAC-04: COLLABORATOR defaults to Ecosystem Hub only', () => {
    const perms = resolveEffectivePermissions('COLLABORATOR');
    expect(perms.dealRoom).toBe(false);
    expect(perms.academyAdmin).toBe(false);
    expect(perms.settings).toBe(false);
    expect(perms.hermesQa).toBe(false);
    expect(perms.ecosystem).toBe(true);
    expect(perms.institutionalBooks).toBe(false);
  });

  it('RBAC-05: Granular override allows giving Deal Room access to a Manager or Collaborator', () => {
    const perms = resolveEffectivePermissions('MANAGER', { dealRoom: true });
    expect(perms.dealRoom).toBe(true);
    expect(perms.academyAdmin).toBe(true);

    const collabPerms = resolveEffectivePermissions('COLLABORATOR', { dealRoom: true, academyAdmin: true });
    expect(collabPerms.dealRoom).toBe(true);
    expect(collabPerms.academyAdmin).toBe(true);
  });

  it('RBAC-06: Security Invariant — Institutional books CANNOT be granted via overrides to non-superadmin', () => {
    // Attempt spoofing / injecting institutionalBooks override
    const perms = resolveEffectivePermissions('ADMIN', {
      dealRoom: true,
    });
    expect(perms.institutionalBooks).toBe(false);

    const managerPerms = resolveEffectivePermissions('MANAGER', {
      dealRoom: true,
    });
    expect(managerPerms.institutionalBooks).toBe(false);
  });

  it('RBAC-07: checkNexusPermission respects unauthenticated context fail-closed', () => {
    const unauthCtx: NexusAuthContext = {
      isAuthenticated: false,
      role: null,
      permissions: {
        dealRoom: false,
        academyAdmin: false,
        settings: false,
        hermesQa: false,
        ecosystem: false,
        institutionalBooks: false,
      },
    };

    expect(checkNexusPermission(unauthCtx, 'dealRoom')).toBe(false);
    expect(checkNexusPermission(unauthCtx, 'academyAdmin')).toBe(false);
    expect(checkNexusPermission(unauthCtx, 'ecosystem')).toBe(false);
  });
});
