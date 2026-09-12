/**
 * 🛡️ Nexus Sovereign RBAC & Capability Enforcement Engine
 * apps/dashboard/src/lib/nexus/nexus-rbac.ts
 *
 * Centralizes authentication and role-based capability resolution across
 * the Pandora's Nexus command plane and internal sub-applications.
 */

import { db } from '@/db';
import { users, nexusCollaborators, type NexusPermissionsOverride, type NexusProvisionStatus } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { getAuth, isAdmin } from '@/lib/auth';
import { headers as nextHeaders, cookies as nextCookies } from 'next/headers';

export type NexusRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'ADMIN_OPERATIONS' 
  | 'ADMIN_MARKETING' 
  | 'ADMIN_COMPLIANCE' 
  | 'TENANT_ADMIN' 
  | 'OPERATOR' 
  | 'MARKETING' 
  | 'VIEWER';

export interface NexusPermissions {
  'users.manage': boolean;
  'tenants.manage': boolean;
  'finance.manage': boolean;
  'growth.manage': boolean;
  'marketing.manage': boolean;
  'nexus.manage': boolean;
  'compliance.manage'?: boolean;
  'calendar.manage'?: boolean;
  ecosystem: boolean;
  institutionalBooks: boolean;
  academyAdmin?: boolean;
  dealRoom?: boolean;
  settings?: boolean;
  hermesQa?: boolean;
}

// Re-export from dedicated file for client compatibility
export { CANONICAL_CAPABILITIES } from '@/lib/canonical-capabilities';

export interface NexusAuthContext {
  isAuthenticated: boolean;
  role: NexusRole | null;
  wallet?: string | null;
  email?: string | null;
  name?: string | null;
  collaboratorId?: number | null;
  whatsappPhone?: string | null;
  provisionStatus?: NexusProvisionStatus | null;
  permissions: NexusPermissions;
}

const DEFAULT_EMPTY_PERMISSIONS: NexusPermissions = {
  'users.manage': false,
  'tenants.manage': false,
  'finance.manage': false,
  'growth.manage': false,
  'marketing.manage': false,
  'nexus.manage': false,
  'compliance.manage': false,
  'calendar.manage': false,
  ecosystem: false,
  institutionalBooks: false,
};

/**
 * 🔒 Pure permission resolver with deterministic role defaults and fail-closed security.
 * Note: Institutional books is strictly restricted to SUPER_ADMIN regardless of manual overrides.
 */
export function resolveEffectivePermissions(
  role: NexusRole,
  overrides?: Partial<Record<string, boolean>> | null
): NexusPermissions {
  const defaultsByRole: Record<NexusRole, NexusPermissions> = {
    SUPER_ADMIN: {
      'users.manage': true,
      'tenants.manage': true,
      'finance.manage': true,
      'growth.manage': true,
      'marketing.manage': true,
      'nexus.manage': true,
      'compliance.manage': true,
      'calendar.manage': true,
      ecosystem: true,
      institutionalBooks: true,
    },
    ADMIN: {
      'users.manage': true,
      'tenants.manage': true,
      'finance.manage': true,
      'growth.manage': true,
      'marketing.manage': true,
      'nexus.manage': true,
      'compliance.manage': true,
      'calendar.manage': true,
      ecosystem: true,
      institutionalBooks: false, // Strict double-layer Discord required for books
    },
    ADMIN_OPERATIONS: {
      'users.manage': true,
      'tenants.manage': true,
      'finance.manage': false,
      'growth.manage': true,
      'marketing.manage': false,
      'nexus.manage': true,
      'compliance.manage': false,
      'calendar.manage': true,
      ecosystem: true,
      institutionalBooks: false,
    },
    ADMIN_MARKETING: {
      'users.manage': false,
      'tenants.manage': false,
      'finance.manage': false,
      'growth.manage': false,
      'marketing.manage': true,
      'nexus.manage': false,
      'compliance.manage': false,
      'calendar.manage': false,
      ecosystem: true,
      institutionalBooks: false,
    },
    ADMIN_COMPLIANCE: {
      'users.manage': true,
      'tenants.manage': false,
      'finance.manage': false,
      'growth.manage': false,
      'marketing.manage': false,
      'nexus.manage': false,
      'compliance.manage': true,
      'calendar.manage': false,
      ecosystem: true,
      institutionalBooks: false,
    },
    TENANT_ADMIN: {
      'users.manage': false,
      'tenants.manage': false,
      'finance.manage': false,
      'growth.manage': true,
      'marketing.manage': false,
      'nexus.manage': false,
      'compliance.manage': false,
      'calendar.manage': true,
      ecosystem: true,
      institutionalBooks: false,
    },
    OPERATOR: {
      'users.manage': false,
      'tenants.manage': false,
      'finance.manage': false,
      'growth.manage': true,
      'marketing.manage': false,
      'nexus.manage': false,
      ecosystem: true,
      institutionalBooks: false,
    },
    MARKETING: {
      'users.manage': false,
      'tenants.manage': false,
      'finance.manage': false,
      'growth.manage': false,
      'marketing.manage': true,
      'nexus.manage': false,
      ecosystem: true,
      institutionalBooks: false,
    },
    VIEWER: {
      'users.manage': false,
      'tenants.manage': false,
      'finance.manage': false,
      'growth.manage': false,
      'marketing.manage': false,
      'nexus.manage': false,
      ecosystem: true,
      institutionalBooks: false,
    },
  };

  const base = defaultsByRole[role] || defaultsByRole.VIEWER;
  const effective: NexusPermissions = {
    ...base,
    'users.manage': overrides?.['users.manage'] !== undefined ? overrides['users.manage'] : base['users.manage'],
    'tenants.manage': overrides?.['tenants.manage'] !== undefined ? overrides['tenants.manage'] : base['tenants.manage'],
    'finance.manage': overrides?.['finance.manage'] !== undefined ? overrides['finance.manage'] : base['finance.manage'],
    'growth.manage': overrides?.['growth.manage'] !== undefined ? overrides['growth.manage'] : base['growth.manage'],
    'marketing.manage': overrides?.['marketing.manage'] !== undefined ? overrides['marketing.manage'] : base['marketing.manage'],
    'nexus.manage': overrides?.['nexus.manage'] !== undefined ? overrides['nexus.manage'] : base['nexus.manage'],
    'compliance.manage': overrides?.['compliance.manage'] !== undefined ? overrides['compliance.manage'] : base['compliance.manage'],
    'calendar.manage': overrides?.['calendar.manage'] !== undefined ? overrides['calendar.manage'] : base['calendar.manage'],
    ecosystem: true, // Always accessible to authenticated Nexus members
    // 🛡️ SECURITY GUARD: Institutional books NEVER grants via collaborator overrides
    institutionalBooks: role === 'SUPER_ADMIN',
    // Granular Module Overrides
    academyAdmin: overrides?.['academyAdmin'] !== undefined ? Boolean(overrides['academyAdmin']) : (role === 'SUPER_ADMIN' || role === 'ADMIN' || (role as string) === 'MANAGER'),
    dealRoom: overrides?.['dealRoom'] !== undefined ? Boolean(overrides['dealRoom']) : (role === 'SUPER_ADMIN' || role === 'ADMIN'),
    settings: overrides?.['settings'] !== undefined ? Boolean(overrides['settings']) : (role === 'SUPER_ADMIN'),
    hermesQa: overrides?.['hermesQa'] !== undefined ? Boolean(overrides['hermesQa']) : (role === 'SUPER_ADMIN' || role === 'ADMIN'),
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
      const CANONICAL_ADMINS = [
        '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
        '0x121a897f0f5a9b7c44756f40bdb2c8e87d2834fa',
        '0x96631d6c5295f1f08334888c5d6f3a246fa9c3ba',
      ];
      const isSuperWallet = 
        CANONICAL_ADMINS.includes(sessionWallet) ||
        sessionWallet === (process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET || process.env.SUPER_ADMIN_WALLET || '').toLowerCase() ||
        sessionWallet === (process.env.MARCO_ADMIN_WALLET || '').toLowerCase();

      const isPlatformAdmin = isSuperWallet || await isAdmin(sessionWallet);

      if (isPlatformAdmin) {
        // Resolve completion fields for sovereign administrators so the registration gate
        // (!name && !whatsappPhone) never loops or blocks the operator.
        const [superUser] = await db
          .select({ id: users.id, name: users.name, email: users.email, role: users.role })
          .from(users)
          .where(eq(users.walletAddress, sessionWallet))
          .limit(1);

        let email: string | null = superUser?.email ?? null;
        let name: string | null = superUser?.name ?? (sessionWallet === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9' ? 'Marco' : null);
        let whatsappPhone: string | null = null;

        // Resolve collaborator record via email or admin env list
        const candidateEmails = [
          email,
          ...(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || process.env.NEXUS_ADMIN_EMAIL || '')
            .toLowerCase()
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean),
          'admin@pandoras.finance',
        ].filter(Boolean) as string[];

        for (const candidate of candidateEmails) {
          try {
            const [collab] = await db
              .select({ name: nexusCollaborators.name, email: nexusCollaborators.email })
              .from(nexusCollaborators)
              .where(eq(nexusCollaborators.email, candidate))
              .limit(1);
            if (collab) {
              name = name || collab.name;
              email = email || collab.email;
              break;
            }
          } catch (collabErr) {
            console.warn('[NexusRBAC] Non-blocking collaborator lookup warning:', collabErr);
          }
        }

        // Default sovereign operator values for Marco's primary wallet if unpopulated
        if (sessionWallet === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9') {
          name = name || 'Marco';
          email = email || 'admin@pandoras.finance';
          whatsappPhone = whatsappPhone || '+523222741987';
        }

        // Self-heal: Synchronize users.role to 'super_admin' in background if out of sync
        if (superUser && superUser.role !== 'super_admin' && isSuperWallet) {
          db.update(users)
            .set({ role: 'super_admin' })
            .where(eq(users.walletAddress, sessionWallet))
            .catch(() => undefined);
        }

        return {
          isAuthenticated: true,
          role: 'SUPER_ADMIN',
          wallet: sessionWallet,
          email: email || 'admin@pandoras.finance',
          name: name || 'Marco',
          whatsappPhone: whatsappPhone || '+523222741987',
          permissions: resolveEffectivePermissions('SUPER_ADMIN'),
        };
      }

      // Optimizamos: Buscar en la base de datos `users` el rol canónico.
      const userRecords = await db
        .select()
        .from(users)
        .where(eq(users.walletAddress, sessionWallet))
        .limit(1);
      
      const user = userRecords[0];

      // Roles que actúan como "admin/nexus" access
      const validAdminRoles = [
        'super_admin', 
        'admin', 
        'admin_operations', 
        'admin_marketing', 
        'admin_compliance', 
        'tenant_admin', 
        'operator', 
        'marketing', 
        'viewer'
      ];
      
      if (user) {
        let effectiveRole = validAdminRoles.includes(user.role) ? (user.role.toUpperCase() as NexusRole) : null;
        let collaboratorOverrides: NexusPermissionsOverride = {};

        let whatsappPhone: string | null = null;
        if (user.email) {
          try {
            const collabRecords = await db
              .select({
                name: nexusCollaborators.name,
                role: nexusCollaborators.role,
                permissions: nexusCollaborators.permissions,
                status: nexusCollaborators.status,
                whatsappPhone: nexusCollaborators.whatsappPhone,
              })
              .from(nexusCollaborators)
              .where(eq(nexusCollaborators.email, user.email))
              .limit(1);
            if (collabRecords.length > 0 && collabRecords[0]) {
              const c = collabRecords[0];
              if (c.status !== 'REJECTED' && c.status !== 'DISABLED') {
                if (!effectiveRole && c.role) {
                  effectiveRole = c.role.toUpperCase() as NexusRole;
                }
                if (c.permissions) {
                  collaboratorOverrides = c.permissions as NexusPermissionsOverride;
                }
                if (c.whatsappPhone) {
                  whatsappPhone = c.whatsappPhone;
                }
              }
              if (!user.name && c.name) {
                user.name = c.name;
              }
            }
          } catch (collabErr) {
            console.warn('[NexusRBAC] Non-blocking collaborator user lookup warning:', collabErr);
          }
        }

        if (effectiveRole) {
          return {
            isAuthenticated: true,
            role: effectiveRole,
            wallet: sessionWallet,
            email: user.email,
            name: user.name,
            whatsappPhone,
            permissions: resolveEffectivePermissions(
              effectiveRole, 
              collaboratorOverrides
            ),
          };
        }
      }
    }

    // 2. Check Magic Link / Collaborator Token (from query param, cookie, or header)
    let cookieToken: string | null = null;
    try {
      const cookieStore = await nextCookies();
      cookieToken = cookieStore.get('pandoras_nexus_token')?.value || cookieStore.get('nexus_token')?.value || null;
    } catch {
      const rawCookie = reqHeaders.get('cookie') || '';
      const match = rawCookie.match(/(?:pandoras_nexus_token|nexus_token)=([^;]+)/);
      if (match && match[1]) cookieToken = decodeURIComponent(match[1]);
    }

    const token = tokenParam || cookieToken || reqHeaders.get('x-nexus-token') || reqHeaders.get('authorization')?.replace(/^Bearer\s+/i, '');

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
        const provisionStatus = (collaborator.status as NexusProvisionStatus) || 'ACTIVE';

        // Provisioning gate: denylisted collaborator (REJECTED/DISABLED) must never
        // authenticate — not even to attempt re-registration.
        if (provisionStatus === 'REJECTED' || provisionStatus === 'DISABLED') {
          return {
            isAuthenticated: false,
            role: null,
            permissions: DEFAULT_EMPTY_PERMISSIONS,
            provisionStatus,
          };
        }

        // Slide token expiration for active collaborators (30 days) and record access
        const extendedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        db.update(nexusCollaborators)
          .set({ lastAccessAt: now, expiresAt: extendedExpiry })
          .where(eq(nexusCollaborators.id, collaborator.id))
          .catch((err) => console.warn('[NexusRBAC] Notice updating lastAccessAt/expiresAt:', err));

        let role = (collaborator.role as NexusRole) || 'COLLABORATOR';
        const normalizedEmail = (collaborator.email || '').toLowerCase().trim();
        const adminEmailsList = [
          (process.env.NEXUS_ADMIN_EMAIL || '').toLowerCase(),
          (process.env.ADMIN_EMAIL || '').toLowerCase(),
          ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : []),
          'admin@pandoras.finance',
        ].filter(Boolean);

        if (adminEmailsList.includes(normalizedEmail)) {
          role = 'SUPER_ADMIN';
        }

        const permissions = resolveEffectivePermissions(role, collaborator.permissions as NexusPermissionsOverride);

        return {
          isAuthenticated: true,
          role,
          email: collaborator.email,
          name: collaborator.name,
          collaboratorId: collaborator.id,
          whatsappPhone: collaborator.whatsappPhone,
          provisionStatus: provisionStatus as NexusProvisionStatus,
          permissions,
        };
      } else {
        // Fallback for dynamically generated HMAC iframe tokens
        const { verifyAcademyToken } = await import('@/lib/nexus-deals/tokens');
        const hmac = await verifyAcademyToken(token);
        if (hmac.valid) {
          const role = hmac.role === 'admin' ? 'ADMIN' : 'VIEWER';
          return {
            isAuthenticated: true,
            role,
            permissions: resolveEffectivePermissions(role as NexusRole, {}),
            email: hmac.email,
            name: hmac.email?.split('@')[0] || 'Sovereign Actor',
            wallet: null
          };
        }
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
