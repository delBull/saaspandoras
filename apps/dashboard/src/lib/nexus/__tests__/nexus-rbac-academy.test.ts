/**
 * 🧪 Test Suite: Nexus RBAC Surface Discovery & Academy SSO Confinement
 * apps/dashboard/src/lib/nexus/__tests__/nexus-rbac-academy.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import { getNexusAuthContext } from '@saasfly/shared';

vi.mock('@saasfly/nexus-deals-sdk', () => ({
  verifyAcademyToken: vi.fn(async (token: string) => {
    if (token === 'valid_academy_admin_token') {
      return {
        valid: true,
        role: 'admin',
        email: 'academy_admin@pandoras.finance',
      };
    }
    return { valid: false };
  }),
}));

describe('🛡️ Nexus RBAC Surface Discovery & Academy Confinement Suite', () => {
  it('RBAC-10: Surface auto-discovery rejects spoofed referer headers (fail-closed)', async () => {
    // An attacker sends a header with referer claiming to be on /admin
    const spoofedHeaders = new Headers({
      referer: 'https://pandoras.finance/admin',
    });

    const ctx = await getNexusAuthContext(spoofedHeaders);
    // Surface must remain UNKNOWN because referer is not an authority
    expect(ctx.surface).toBe('UNKNOWN');
  });

  it('RBAC-11: Academy SSO token confinement restricts admin privileges to ACADEMY surface only', async () => {
    // Calling under NEXUS surface with Academy token
    const nexusHeaders = new Headers({
      'x-invoke-path': '/api/nexus/overview',
    });
    const nexusCtx = await getNexusAuthContext(nexusHeaders, 'valid_academy_admin_token', 'NEXUS');
    expect(nexusCtx.isAuthenticated).toBe(true);
    // In NEXUS surface, an Academy admin token MUST NOT elevate to ADMIN
    expect(nexusCtx.role).toBe('VIEWER');

    // Calling under ACADEMY surface with the same token
    const academyHeaders = new Headers({
      'x-invoke-path': '/api/academy/courses',
    });
    const academyCtx = await getNexusAuthContext(academyHeaders, 'valid_academy_admin_token', 'ACADEMY');
    expect(academyCtx.isAuthenticated).toBe(true);
    expect(academyCtx.role).toBe('ADMIN');
    expect(academyCtx.surface).toBe('ACADEMY');
  });

  it('RBAC-12: Academy admin in ACADEMY surface is denied users.manage and nexus.manage permissions', async () => {
    const academyHeaders = new Headers({
      'x-invoke-path': '/api/academy/courses',
    });
    const academyCtx = await getNexusAuthContext(academyHeaders, 'valid_academy_admin_token', 'ACADEMY');
    expect(academyCtx.role).toBe('ADMIN');
    expect(academyCtx.permissions['users.manage']).toBe(false);
    expect(academyCtx.permissions['nexus.manage']).toBe(false);
    expect(academyCtx.permissions['tenants.manage']).toBe(false);
  });

  it('RBAC-13: requireNexusAdmin strictly rejects Academy admin tokens even with spoofed x-invoke-path headers', async () => {
    const { requireNexusAdmin } = await import('@saasfly/hermes-core');
    const spoofedHeaders = new Headers({
      'x-invoke-path': '/api/academy/bypass',
      authorization: 'Bearer valid_academy_admin_token',
    });

    const isGranted = await requireNexusAdmin(spoofedHeaders);
    expect(isGranted).toBe(false);
  });
});
