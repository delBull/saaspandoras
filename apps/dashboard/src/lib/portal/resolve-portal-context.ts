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

import { cookies } from 'next/headers';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
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

  // 4. Verify the requested slug matches the authorized organization
  //    This is the critical cross-tenant URL attack prevention.
  if (organization.slug !== requestedOrganizationSlug) {
    throw new PortalAuthorizationError(
      'ORGANIZATION_ACCESS_DENIED',
      `Actor session is authorized for '${organization.slug}', not '${requestedOrganizationSlug}'.`
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
    organizationId: organization.slug,
    organizationSlug: organization.slug,
    role,
    permissions,
  };

  const portalOrg: PortalOrganization = {
    id: organization.slug,
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
