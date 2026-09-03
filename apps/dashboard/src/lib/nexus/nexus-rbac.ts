/**
 * 🛡️ Nexus Sovereign RBAC & Capability Enforcement Engine
 * apps/dashboard/src/lib/nexus/nexus-rbac.ts
 *
 * Centralizes authentication and role-based capability resolution across
 * the Pandora's Nexus command plane and internal sub-applications.
 */

import { db } from '@/db';
import { nexusCollaborators, type NexusPermissionsOverride } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { getAuth, isAdmin } from '@/lib/auth';
import { headers as nextHeaders } from 'next/headers';

export type NexusRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'COLLABORATOR';

export interface NexusPermissions {
  dealRoom: boolean;
  academyAdmin: boolean;
  settings: boolean;
  hermesQa: boolean;
  ecosystem: boolean;
  institutionalBooks: boolean;
}

export interface NexusAuthContext {
  isAuthenticated: boolean;
  role: NexusRole | null;
  wallet?: string | null;
  email?: string | null;
  name?: string | null;
  permissions: NexusPermissions;
}

const DEFAULT_EMPTY_PERMISSIONS: NexusPermissions = {
  dealRoom: false,
  academyAdmin: false,
  settings: false,
  hermesQa: false,
  ecosystem: false,
  institutionalBooks: false,
};

/**
 * 🔒 Pure permission resolver with deterministic role defaults and fail-closed security.
 * Note: Institutional books is strictly restricted to SUPER_ADMIN regardless of manual overrides.
 */
export function resolveEffectivePermissions(
  role: NexusRole,
  overrides?: Partial<NexusPermissionsOverride> | null
): NexusPermissions {
  const defaultsByRole: Record<NexusRole, NexusPermissions> = {
    SUPER_ADMIN: {
      dealRoom: true,
      academyAdmin: true,
      settings: true,
      hermesQa: true,
      ecosystem: true,
      institutionalBooks: true,
    },
    ADMIN: {
      dealRoom: true,
      academyAdmin: true,
      settings: true,
      hermesQa: true,
      ecosystem: true,
      institutionalBooks: false, // Strict double-layer Discord required for books
    },
    MANAGER: {
      dealRoom: false,
      academyAdmin: true,
      settings: false,
      hermesQa: true,
      ecosystem: true,
      institutionalBooks: false,
    },
    COLLABORATOR: {
      dealRoom: false,
      academyAdmin: false,
      settings: false,
      hermesQa: false,
      ecosystem: true,
      institutionalBooks: false,
    },
  };

  const base = defaultsByRole[role] || defaultsByRole.COLLABORATOR;
  const effective: NexusPermissions = {
    ...base,
    dealRoom: overrides?.dealRoom !== undefined ? overrides.dealRoom : base.dealRoom,
    academyAdmin: overrides?.academyAdmin !== undefined ? overrides.academyAdmin : base.academyAdmin,
    settings: overrides?.settings !== undefined ? overrides.settings : base.settings,
    hermesQa: overrides?.hermesQa !== undefined ? overrides.hermesQa : base.hermesQa,
    ecosystem: true, // Always accessible to authenticated Nexus members
    // 🛡️ SECURITY GUARD: Institutional books NEVER grants via collaborator overrides
    institutionalBooks: role === 'SUPER_ADMIN',
  };

  return effective;
}

/**
 * Resolves current actor's authenticated Nexus role and capability context.
 */
export async function getNexusAuthContext(
  customHeaders?: Headers | null,
  tokenParam?: string | null
): Promise<NexusAuthContext> {
  try {
    let reqHeaders: Headers;
    if (customHeaders) {
      reqHeaders = customHeaders;
    } else {
      try {
        reqHeaders = await nextHeaders();
      } catch {
        reqHeaders = new Headers();
      }
    }

    // 1. Check Web3 Authenticated Session
    const { session, isVerified } = await getAuth(reqHeaders);
    const sessionWallet = (session?.address || reqHeaders.get('x-wallet-address') || reqHeaders.get('x-thirdweb-address'))?.toLowerCase();

    if (sessionWallet && isVerified) {
      const isSuper = sessionWallet === (process.env.NEXT_PUBLIC_ADMIN_WALLET || '').toLowerCase();
      const isPlatformAdmin = await isAdmin(sessionWallet);

      if (isSuper) {
        return {
          isAuthenticated: true,
          role: 'SUPER_ADMIN',
          wallet: sessionWallet,
          permissions: resolveEffectivePermissions('SUPER_ADMIN'),
        };
      }

      if (isPlatformAdmin) {
        return {
          isAuthenticated: true,
          role: 'ADMIN',
          wallet: sessionWallet,
          permissions: resolveEffectivePermissions('ADMIN'),
        };
      }
    }

    // 2. Check Magic Link / Collaborator Token (from query param or header)
    const token = tokenParam || reqHeaders.get('x-nexus-token') || reqHeaders.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (token) {
      const now = new Date();
      const records = await db
        .select()
        .from(nexusCollaborators)
        .where(
          and(
            eq(nexusCollaborators.token, token),
            gt(nexusCollaborators.expiresAt, now)
          )
        )
        .limit(1);

      const collaborator = records[0];
      if (collaborator) {
        // Record last access timestamp asynchronously
        db.update(nexusCollaborators)
          .set({ lastAccessAt: now })
          .where(eq(nexusCollaborators.id, collaborator.id))
          .catch((err) => console.warn('[NexusRBAC] Notice updating lastAccessAt:', err));

        const role = (collaborator.role as NexusRole) || 'COLLABORATOR';
        const permissions = resolveEffectivePermissions(role, collaborator.permissions as NexusPermissionsOverride);

        return {
          isAuthenticated: true,
          role,
          email: collaborator.email,
          name: collaborator.name,
          permissions,
        };
      }
    }

    // 3. Unauthenticated Default
    return {
      isAuthenticated: false,
      role: null,
      permissions: DEFAULT_EMPTY_PERMISSIONS,
    };
  } catch (err) {
    console.error('[NexusRBAC] Error resolving auth context:', err);
    return {
      isAuthenticated: false,
      role: null,
      permissions: DEFAULT_EMPTY_PERMISSIONS,
    };
  }
}

/**
 * Simple helper to check if actor has a specific capability.
 */
export function checkNexusPermission(
  ctx: NexusAuthContext,
  permission: keyof NexusPermissions
): boolean {
  if (!ctx.isAuthenticated || !ctx.permissions) return false;
  return Boolean(ctx.permissions[permission]);
}
