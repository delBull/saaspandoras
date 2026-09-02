/**
 * Portal Context Resolver — Phase 6.1
 *
 * THE security boundary for the Customer Operating Console.
 *
 * This function is the ONLY authorized way to establish a PortalTenantContext.
 * It must be called from Server Components / Server Actions BEFORE any data access.
 *
 * Flow:
 *   requestedOrganizationId (from URL)
 *     ↓
 *   Validate portal session (JWT)
 *     ↓
 *   Resolve actor from session
 *     ↓
 *   Verify organization exists
 *     ↓
 *   Verify actor has access to organization
 *     ↓
 *   Resolve role & permissions
 *     ↓
 *   Return PortalTenantContext
 *
 * On failure, throws PortalAuthorizationError — never silently downgrades.
 */

import { cookies, headers } from 'next/headers';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { getAuth, isAdmin } from '@/lib/auth';
import { isWalletAuthorizedForTenant } from '@/lib/hermes/auth/wallet-tenant-membership';
import {
  PortalTenantContext,
  PortalOrganization,
  PortalContext,
  PortalAuthorizationError,
} from './portal-types';
import { PortalRole, PORTAL_ROLE_PERMISSIONS } from './permissions';

const PORTAL_SESSION_COOKIE = 'pandoras_portal_session';

/**
 * Resolve an authorized PortalContext for a Server Component.
 *
 * @param requestedOrganizationSlug - The slug from URL params (routing context only)
 * @throws PortalAuthorizationError on any auth/access failure
 */
export async function resolvePortalContext(
  requestedOrganizationSlug: string
): Promise<PortalContext> {
  // 1. Extract session token from cookie (set by magic link auth flow)
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    // 1.5 Fallback: Web3 Wallet / Admin Dashboard Session
    try {
      const reqHeaders = await headers();
      const auth = await getAuth(reqHeaders);
      const callerWallet = auth.session?.address?.toLowerCase() ||
        reqHeaders.get('x-wallet-address')?.toLowerCase() ||
        reqHeaders.get('x-thirdweb-address')?.toLowerCase();

      if (callerWallet) {
        const isUserAdmin = await isAdmin(callerWallet);
        const isTenantAuthorized = await isWalletAuthorizedForTenant(callerWallet, requestedOrganizationSlug);

        if (isUserAdmin || isTenantAuthorized) {
          const organization = await OrganizationSDK.resolve(requestedOrganizationSlug, 'HERMES');
          const role: PortalRole = 'owner';
          const permissions = PORTAL_ROLE_PERMISSIONS[role];

          const tenant: PortalTenantContext = {
            actorId: `wallet_${callerWallet.slice(0, 10)}`,
            sessionId: `wallet_session_${callerWallet}`,
            organizationId: organization.organizationId,
            organizationSlug: organization.slug,
            role,
            permissions,
          };

          const portalOrg: PortalOrganization = {
            id: organization.organizationId,
            slug: organization.slug,
            name: organization.name,
            logoUrl: organization.logoUrl ?? null,
            projectId: organization.projectId,
            activeProduct: 'HERMES',
          };

          return { tenant, organization: portalOrg };
        }
      }
    } catch (e) {
      console.warn('[resolvePortalContext] Wallet fallback probe:', e);
    }

    throw new PortalAuthorizationError('NO_SESSION', 'No portal session found.');
  }

  // 2. Validate JWT session
  const session = await validatePortalSession(sessionToken);
  if (!session) {
    throw new PortalAuthorizationError('INVALID_SESSION', 'Portal session is invalid or expired.');
  }

  // 3. Resolve organization from SDK (single source of truth)
  let organization;
  try {
    organization = await OrganizationSDK.resolve(session.projectId, session.product as any);
  } catch (err) {
    throw new PortalAuthorizationError(
      'ORGANIZATION_NOT_FOUND',
      `Organization for project ${session.projectId} could not be resolved.`
    );
  }

  // 4. Verify the requested slug/UUID matches the authorized organization
  //    Accepts either canonical organizationId (UUID) or human slug.
  const isAuthorized =
    organization.organizationId === requestedOrganizationSlug ||
    organization.slug === requestedOrganizationSlug;

  if (!isAuthorized) {
    throw new PortalAuthorizationError(
      'ORGANIZATION_ACCESS_DENIED',
      `Actor session is authorized for '${organization.slug}' (${organization.organizationId}), not '${requestedOrganizationSlug}'.`
    );
  }

  // 5. Resolve role (default: owner for portal sessions — single-org model)
  //    Extend this when multi-user organizations are introduced.
  const role: PortalRole = 'owner';
  const permissions = PORTAL_ROLE_PERMISSIONS[role];

  // 6. Build the authorized context
  const tenant: PortalTenantContext = {
    actorId: `session_${session.installedProductId}`,
    sessionId: sessionToken,
    organizationId: organization.organizationId, // Canonical UUID
    organizationSlug: organization.slug,         // Legacy/Human slug
    role,
    permissions,
  };

  const portalOrg: PortalOrganization = {
    id: organization.organizationId,
    slug: organization.slug,
    name: organization.name,
    logoUrl: organization.logoUrl ?? null,
    projectId: organization.projectId,
    activeProduct: session.product,
  };

  return { tenant, organization: portalOrg };
}

/**
 * Convenience: resolve context OR return null (for layouts that redirect instead of throw).
 * Use resolvePortalContext() when you want hard failures.
 */
export async function tryResolvePortalContext(
  requestedOrganizationSlug: string
): Promise<PortalContext | null> {
  try {
    return await resolvePortalContext(requestedOrganizationSlug);
  } catch {
    return null;
  }
}

/**
 * Check onboarding stage for a tenant context without leaking db into layout components.
 */
export async function getTenantOnboardingStage(context: PortalContext, requestedSlug: string): Promise<string | null> {
  try {
    const { db } = await import('@/db');
    const { portalOnboardingState } = await import('@/db/schema');
    const { eq, or } = await import('drizzle-orm');

    const [onboarding] = await db
      .select({ stage: portalOnboardingState.stage })
      .from(portalOnboardingState)
      .where(
        or(
          eq(portalOnboardingState.tenantId, context.tenant.organizationId),
          eq(portalOnboardingState.tenantId, context.tenant.organizationSlug),
          eq(portalOnboardingState.tenantId, requestedSlug),
          eq(portalOnboardingState.tenantId, String(context.organization.projectId))
        )
      )
      .limit(1);

    return onboarding?.stage || null;
  } catch {
    return null;
  }
}
