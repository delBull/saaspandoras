/**
 * 🛡️ Nexus Sovereign RBAC & Capability Enforcement Engine
 * apps/dashboard/src/lib/nexus/nexus-rbac.ts
 *
 * Centralizes authentication and role-based capability resolution across
 * the Pandora's Nexus command plane and internal sub-applications.
 */

import { db } from '@saasfly/db-core';
import { users, nexusCollaborators, projectCollaborators, projects, type NexusPermissionsOverride, type NexusProvisionStatus } from '@saasfly/db-core/schema';
import { eq, and, gt, asc, or, sql } from "@saasfly/db-core";
import { getAuth, isAdmin } from '@saasfly/auth-sdk';
import crypto from 'crypto';

// Dynamic require for next/headers without triggering direct-eval bundler warning
let nextHeaders: any;
let nextCookies: any;
if (typeof process !== "undefined" && typeof window === "undefined") {
    try {
        const req = (globalThis as any)["__non_webpack_require__"] || (typeof require !== "undefined" ? require : null);
        if (req) {
            const mod = req("next/headers");
            nextHeaders = mod.headers;
            nextCookies = mod.cookies;
        }
    } catch (e) {
        // Ignore
    }
}

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

export type NexusSurface = 'ADMIN' | 'NEXUS' | 'ACADEMY' | 'TMA' | 'UNKNOWN';

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

// Re-export moved to shared/src/index.ts for client compatibility

export interface NexusAuthContext {
  isAuthenticated: boolean;
  role: NexusRole | null;
  wallet?: string | null;
  email?: string | null;
  name?: string | null;
  collaboratorId?: number | null;
  canonicalOrgId?: string | null;
  whatsappPhone?: string | null;
  provisionStatus?: NexusProvisionStatus | null;
  surface: NexusSurface;
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
  overrides?: Partial<Record<string, boolean>> | null,
  surface: NexusSurface = 'UNKNOWN'
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
    'users.manage': surface === 'ACADEMY' ? false : (overrides?.['users.manage'] !== undefined ? overrides['users.manage'] : base['users.manage']),
    'tenants.manage': surface === 'ACADEMY' ? false : (overrides?.['tenants.manage'] !== undefined ? overrides['tenants.manage'] : base['tenants.manage']),
    'finance.manage': overrides?.['finance.manage'] !== undefined ? overrides['finance.manage'] : base['finance.manage'],
    'growth.manage': overrides?.['growth.manage'] !== undefined ? overrides['growth.manage'] : base['growth.manage'],
    'marketing.manage': overrides?.['marketing.manage'] !== undefined ? overrides['marketing.manage'] : base['marketing.manage'],
    'nexus.manage': surface === 'ACADEMY' ? false : (overrides?.['nexus.manage'] !== undefined ? overrides['nexus.manage'] : base['nexus.manage']),
    'compliance.manage': overrides?.['compliance.manage'] !== undefined ? overrides['compliance.manage'] : base['compliance.manage'],
    'calendar.manage': overrides?.['calendar.manage'] !== undefined ? overrides['calendar.manage'] : base['calendar.manage'],
    ecosystem: true, // Always accessible to authenticated Nexus members
    // 🛡️ SECURITY GUARD: Institutional books NEVER grants via collaborator overrides
    institutionalBooks: role === 'SUPER_ADMIN' && surface === 'ADMIN',
    // Granular Module Overrides
    academyAdmin: overrides?.['academyAdmin'] !== undefined ? Boolean(overrides['academyAdmin']) : (role === 'SUPER_ADMIN' || role === 'ADMIN' || (role as string) === 'MANAGER'),
    dealRoom: overrides?.['dealRoom'] !== undefined ? Boolean(overrides['dealRoom']) : (role === 'SUPER_ADMIN' || role === 'ADMIN'),
    settings: overrides?.['settings'] !== undefined ? Boolean(overrides['settings']) : (role === 'SUPER_ADMIN' && (surface === 'ADMIN' || surface === 'NEXUS')),
    hermesQa: overrides?.['hermesQa'] !== undefined ? Boolean(overrides['hermesQa']) : (role === 'SUPER_ADMIN' || role === 'ADMIN'),
  };

  return effective;
}

/**
 * Resolves canonicalOrgId for a collaborator according to FC-001:
 * 1. SUPER_ADMIN is always scoped to 'pandoras'.
 * 2. For project collaborators, joins project_collaborators with projects table.
 * 3. If request context provides a requested tenant (`x-nexus-tenant` or `x-tenant-id`):
 *    - Verifies that the collaborator is assigned to that tenant.
 *    - If requested tenant is not in the assigned projects, FAILS CLOSED (returns null).
 *      No arbitrary tenant fallback is permitted.
 * 4. Returns projects.organizationId (canonical UUID). Never falls back to arbitrary slug (FC-001).
 */
export async function resolveCollaboratorCanonicalOrgId(
  collaboratorId: number,
  requestedTenant?: string | null
): Promise<string | null> {
  try {
    const assignedProjects = await db
      .select({
        projectId: projectCollaborators.projectId,
        organizationId: projects.organizationId,
        slug: projects.slug,
        assignedAt: projectCollaborators.assignedAt,
      })
      .from(projectCollaborators)
      .leftJoin(projects, eq(projects.slug, projectCollaborators.projectId))
      .where(eq(projectCollaborators.collaboratorId, collaboratorId))
      .orderBy(asc(projectCollaborators.assignedAt));

    if (!assignedProjects || assignedProjects.length === 0) {
      return null;
    }

    if (requestedTenant) {
      const match = assignedProjects.find(
        (p) =>
          p.organizationId === requestedTenant ||
          p.slug === requestedTenant ||
          p.projectId === requestedTenant
      );
      // 🛡️ Fail-closed: if the client requested an unassigned tenant, DENY (do NOT fall back)
      if (!match) {
        return null;
      }
      return match.organizationId || null;
    }

    // 🛡️ Fail-closed: Multiple assignments without explicit tenant selection MUST be rejected
    // to prevent arbitrary cross-tenant ambiguity or silent defaulting.
    if (assignedProjects.length > 1) {
      return null;
    }

    // Exactly one assigned project: resolve its canonical organizationId UUID
    const primary = assignedProjects[0];
    return primary?.organizationId || null;
  } catch (err: any) {
    console.warn('[NexusRBAC] Error resolving canonicalOrgId:', err);
    return null;
  }
}

/**
 * Resolves current actor's authenticated Nexus role and capability context.
 */
export async function getNexusAuthContext(
  customHeaders?: Headers | null,
  tokenParam?: string | null,
  surface: NexusSurface = 'UNKNOWN'
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

    // Auto-discover surface if UNKNOWN (using server-authoritative headers only, fail-closed against spoofable referer and next-url)
    let resolvedSurface = surface;
    if (resolvedSurface === 'UNKNOWN') {
      const invokePath = reqHeaders.get('x-invoke-path') || reqHeaders.get('x-matched-path') || '';
      const host = reqHeaders.get('x-forwarded-host') || reqHeaders.get('host') || '';

      if (invokePath.startsWith('/api/admin') || invokePath.startsWith('/admin')) {
        resolvedSurface = 'ADMIN';
      } else if (invokePath.startsWith('/api/nexus') || invokePath.startsWith('/nexus') || host.startsWith('nexus.')) {
        resolvedSurface = 'NEXUS';
      } else if (invokePath.startsWith('/api/academy') || invokePath.startsWith('/academy') || host.startsWith('academy.')) {
        resolvedSurface = 'ACADEMY';
      } else if (reqHeaders.get('x-tma-surface') === 'true') {
        resolvedSurface = 'TMA';
      }
    }

    // Override the function argument with the discovered surface
    surface = resolvedSurface;

    // 1. Check Web3 Authenticated Session
    const { session, isVerified } = await getAuth(reqHeaders);
    const sessionWallet = (session?.address || reqHeaders.get('x-wallet-address') || reqHeaders.get('x-thirdweb-address'))?.toLowerCase();

    if (sessionWallet && isVerified) {
      const isPlatformAdmin = await isAdmin(sessionWallet);

      if (isPlatformAdmin) {
        // Resolve completion fields for sovereign administrators so the registration gate
        // (!name && !whatsappPhone) never loops or blocks the operator.
        const [superUser] = await db
          .select({ id: users.id, name: users.name, email: users.email, role: users.role })
          .from(users)
          .where(eq(users.walletAddress, sessionWallet))
          .limit(1);

        let email: string | null = superUser?.email ?? null;
        let name: string | null = superUser?.name ?? null;
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

        // Self-heal: Synchronize users.role to 'super_admin' in background if out of sync
        if (superUser && superUser.role !== 'super_admin') {
          db.update(users)
            .set({ role: 'super_admin' })
            .where(eq(users.id, superUser.id))
            .catch(() => undefined);
        }

        return {
          isAuthenticated: true,
          role: 'SUPER_ADMIN',
          wallet: sessionWallet,
          email: email || process.env.ADMIN_EMAIL || 'admin@pandoras.finance',
          name: name || process.env.ADMIN_NAME || 'Admin',
          whatsappPhone: whatsappPhone || process.env.ADMIN_WHATSAPP_PHONE || null,
          canonicalOrgId: 'pandoras',
          surface,
          permissions: resolveEffectivePermissions('SUPER_ADMIN', null, surface),
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
        let collaboratorId: number | null = null;
        let canonicalOrgId: string | null = null;
        let collaboratorStatus: string | null = null;

        if (user.email) {
          try {
            const collabRecords = await db
              .select({
                id: nexusCollaborators.id,
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
              collaboratorId = c.id;
              collaboratorStatus = c.status;

              // 🛡️ Fail-closed: Denylisted or rejected collaborator must never authenticate,
              // even if their historical users.role record remains in database
              if (c.status === 'REJECTED' || c.status === 'DISABLED') {
                return {
                  isAuthenticated: false,
                  role: null,
                  surface,
                  permissions: DEFAULT_EMPTY_PERMISSIONS,
                  provisionStatus: c.status as NexusProvisionStatus,
                };
              }

              canonicalOrgId = await resolveCollaboratorCanonicalOrgId(
                c.id,
                reqHeaders.get('x-nexus-tenant') || reqHeaders.get('x-tenant-id')
              );

              if (!effectiveRole) {
                effectiveRole = (c.role ? c.role.toUpperCase() : 'VIEWER') as NexusRole;
              }
              if (c.permissions) {
                collaboratorOverrides = c.permissions as NexusPermissionsOverride;
              }
              if (c.whatsappPhone) {
                whatsappPhone = c.whatsappPhone;
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
            collaboratorId,
            canonicalOrgId,
            // 🛡️ P0 Fail-Closed: Ausencia de registro en nexus_collaborators NO concede 'ACTIVE'.
            // Solo SUPER_ADMIN/ADMIN confirmados en users obtienen ACTIVE si no tienen registro previo.
            provisionStatus: (collaboratorStatus || (effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'ADMIN' ? 'ACTIVE' : 'PENDING')) as NexusProvisionStatus,
            surface,
            permissions: resolveEffectivePermissions(
              effectiveRole, 
              collaboratorOverrides,
              surface
            ),
          };
        } else {
          // Si conectan su wallet pero no tienen un rol válido ni email enlazado,
          // Y NO tienen un Magic Link Token, los dejamos pasar como PENDING
          // para que puedan llenar el formulario de registro (requireCompletion=true).
          // PERO si tienen un token, dejamos que pase al paso 2 (Magic Link).
          let cookieToken: string | null = null;
          try {
            const cookieStore = await nextCookies();
            cookieToken = cookieStore.get('pandoras_nexus_token')?.value || cookieStore.get('nexus_token')?.value || null;
          } catch {
            const rawCookie = reqHeaders.get('cookie') || '';
            const match = rawCookie.match(/(?:pandoras_nexus_token|nexus_token)=([^;]+)/);
            if (match && match[1]) cookieToken = decodeURIComponent(match[1]);
          }
          const hasToken = !!(tokenParam || cookieToken || reqHeaders.get('x-nexus-token') || reqHeaders.get('authorization')?.replace(/^Bearer\s+/i, ''));

          if (!hasToken) {
            return {
              isAuthenticated: true,
              role: null,
              wallet: sessionWallet,
              email: user.email,
              name: user.name,
              whatsappPhone: null,
              collaboratorId: null,
              canonicalOrgId: null,
              provisionStatus: 'PENDING',
              surface,
              permissions: DEFAULT_EMPTY_PERMISSIONS,
            };
          }
        }
      } else {
        // El usuario no existe en la tabla users todavía (wallet nueva).
        // Los dejamos pasar como PENDING para el auto-registro, a menos que tengan token.
        let cookieToken: string | null = null;
        try {
          const cookieStore = await nextCookies();
          cookieToken = cookieStore.get('pandoras_nexus_token')?.value || cookieStore.get('nexus_token')?.value || null;
        } catch {
          const rawCookie = reqHeaders.get('cookie') || '';
          const match = rawCookie.match(/(?:pandoras_nexus_token|nexus_token)=([^;]+)/);
          if (match && match[1]) cookieToken = decodeURIComponent(match[1]);
        }
        const hasToken = !!(tokenParam || cookieToken || reqHeaders.get('x-nexus-token') || reqHeaders.get('authorization')?.replace(/^Bearer\s+/i, ''));

        if (!hasToken) {
          return {
            isAuthenticated: true,
            role: null,
            wallet: sessionWallet,
            email: null,
            name: null,
            whatsappPhone: null,
            collaboratorId: null,
            canonicalOrgId: null,
            provisionStatus: 'PENDING',
            surface,
            permissions: DEFAULT_EMPTY_PERMISSIONS,
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
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const records = await db
        .select()
        .from(nexusCollaborators)
        .where(
          and(
            eq(nexusCollaborators.token, tokenHash),
            gt(nexusCollaborators.expiresAt, now),
            sql`${nexusCollaborators.token} NOT LIKE 'consumed_%'`
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
            surface,
            permissions: DEFAULT_EMPTY_PERMISSIONS,
            provisionStatus,
          };
        }

        // 🛡️ Fixed Token Lifetime: Do NOT slide expiration.
        // Record access time only without extending token lifetime.
        db.update(nexusCollaborators)
          .set({ lastAccessAt: now })
          .where(eq(nexusCollaborators.id, collaborator.id))
          .catch((err) => console.warn('[NexusRBAC] Notice updating lastAccessAt:', err));

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

        let canonicalOrgId: string | null = null;
        if (role === 'SUPER_ADMIN') {
          canonicalOrgId = 'pandoras';
        } else {
          canonicalOrgId = await resolveCollaboratorCanonicalOrgId(
            collaborator.id,
            reqHeaders.get('x-nexus-tenant') || reqHeaders.get('x-tenant-id')
          );
        }

        const permissions = resolveEffectivePermissions(role, collaborator.permissions as NexusPermissionsOverride, surface);

        return {
          isAuthenticated: true,
          role,
          email: collaborator.email,
          name: collaborator.name,
          collaboratorId: collaborator.id,
          canonicalOrgId,
          whatsappPhone: collaborator.whatsappPhone,
          provisionStatus: provisionStatus as NexusProvisionStatus,
          surface,
          permissions,
        };
      } else {
        // Fallback for dynamically generated HMAC iframe tokens
        const { verifyAcademyToken } = await import('@saasfly/nexus-deals-sdk');
        const hmac = await verifyAcademyToken(token);
        if (hmac.valid) {
          // 🛡️ Confinement: Academy tokens can only grant elevated roles strictly within ACADEMY surface.
          // In NEXUS or ADMIN surfaces, an Academy token must never escalate to ADMIN.
          const isAcademySurface = surface === 'ACADEMY';
          const role: NexusRole = (isAcademySurface && hmac.role === 'admin') ? 'ADMIN' : 'VIEWER';
          const effectiveSurface = isAcademySurface ? 'ACADEMY' : surface;
          return {
            isAuthenticated: true,
            role,
            surface: effectiveSurface,
            permissions: resolveEffectivePermissions(role, {}, effectiveSurface),
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
      surface,
      permissions: DEFAULT_EMPTY_PERMISSIONS,
    };
  } catch (err: any) {
    console.error('[NexusRBAC] Error resolving auth context:', err);
    return {
      isAuthenticated: false,
      role: null,
      surface,
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
