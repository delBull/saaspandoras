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
import { validatePortalSession } from '../platform/portal-auth';
import { OrganizationSDK } from '../platform/organization-sdk';
import { getAuth, isAdmin } from '@saasfly/auth-sdk';
import { isWalletAuthorizedForTenant } from '@saasfly/hermes-core';
import {
  PortalTenantContext,
  PortalOrganization,
  PortalContext,
  PortalAuthorizationError,
} from './portal-types';
import { PortalRole, PORTAL_ROLE_PERMISSIONS } from './permissions';
import {
  collaboratorBelongsToOrganization,
  resolveCollaboratorSessionToken,
} from './collaborator-session';

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
      // 🛡️ Fail-closed (P0): la identidad wallet SOLO del session token verificado.
      // Los headers x-wallet-address / x-thirdweb-address son del cliente y son forjables.
      const callerWallet = auth.session?.address?.toLowerCase() || null;

      if (callerWallet) {
        const isUserAdmin = await isAdmin(callerWallet);
        const isTenantAuthorized = await isWalletAuthorizedForTenant(callerWallet, requestedOrganizationSlug);

        if (isUserAdmin || isTenantAuthorized) {
          const organization = await OrganizationSDK.resolve(requestedOrganizationSlug);
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

          const installedProducts = organization.installedProducts.map((p) => p.product);

          const portalOrg: PortalOrganization = {
            id: organization.organizationId,
            slug: organization.slug,
            name: organization.name,
            logoUrl: organization.logoUrl ?? null,
            projectId: organization.projectId,
            activeProduct: organization.activeProduct?.product ?? null,
            installedProducts,
          };

          return { tenant, organization: portalOrg };
        }
      }
    } catch (e) {
      console.warn('[resolvePortalContext] Wallet fallback probe:', e);
    }

    throw new PortalAuthorizationError('NO_SESSION', 'No portal session found.');
  }

  // 1.6 MULTIUSUARIO: credencial de COLABORADOR (persona).
  //     La identidad sale del colaborador; la organización se verifica por
  //     pertenencia explícita. Si la credencial no es de colaborador, se sigue
  //     con el flujo de sesión de producto (compatibilidad).
  try {
    const collaboratorSession = await resolveCollaboratorSessionToken(sessionToken);

    if (collaboratorSession) {
      let collaboratorOrg;
      try {
        collaboratorOrg = await OrganizationSDK.resolve(requestedOrganizationSlug);
      } catch {
        throw new PortalAuthorizationError(
          'ORGANIZATION_NOT_FOUND',
          `Organization '${requestedOrganizationSlug}' could not be resolved.`
        );
      }

      const belongs = await collaboratorBelongsToOrganization(collaboratorSession, collaboratorOrg.slug);
      if (!belongs) {
        throw new PortalAuthorizationError(
          'ORGANIZATION_ACCESS_DENIED',
          'El colaborador no pertenece a esa organización.'
        );
      }

      const permissions = PORTAL_ROLE_PERMISSIONS[collaboratorSession.role];

      const collaboratorTenant: PortalTenantContext = {
        actorId: collaboratorSession.actorId,
        sessionId: `collaborator_session_${collaboratorSession.collaboratorId}`,
        organizationId: collaboratorOrg.organizationId,
        organizationSlug: collaboratorOrg.slug,
        role: collaboratorSession.role,
        permissions,
      };

      const isTrialOrg = collaboratorOrg.tenantType === 'TRIAL';
      let collaboratorTrial = undefined;
      if (isTrialOrg) {
        const isExpired = collaboratorOrg.trialEndsAt
          ? Date.now() >= new Date(collaboratorOrg.trialEndsAt).getTime()
          : false;
        const trialStatus = isExpired ? 'PRESERVED' : (collaboratorOrg.trialStatus || 'ACTIVE');
        collaboratorTrial = {
          isTrial: true,
          tier: (collaboratorOrg.trialTier || 'MEDIA_ENABLED') as any,
          startedAt: collaboratorOrg.trialStartedAt,
          endsAt: collaboratorOrg.trialEndsAt,
          status: trialStatus as any,
          isExpired,
        };
      }

      return {
        tenant: collaboratorTenant,
        organization: {
          id: collaboratorOrg.organizationId,
          slug: collaboratorOrg.slug,
          name: collaboratorOrg.name,
          logoUrl: collaboratorOrg.logoUrl ?? null,
          projectId: collaboratorOrg.projectId,
          activeProduct: collaboratorOrg.activeProduct?.product ?? null,
          installedProducts: collaboratorOrg.installedProducts.map((p) => p.product),
          isSimulationMode: collaboratorOrg.isSimulationMode ?? null,
        },
        trial: collaboratorTrial,
      };
    }
  } catch (error) {
    if (error instanceof PortalAuthorizationError) throw error;
    // Fail-closed: un fallo al resolver la identidad NO degrada a otra autoridad.
    throw new PortalAuthorizationError(
      'INVALID_SESSION',
      'No se pudo resolver la sesión del portal.'
    );
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

  // Mandatory Adjustment #5: Boundary Enforcement (Trial session -> Production ❌)
  const isTrialOrg = organization.tenantType === 'TRIAL';
  const isTrialSession =
    session.isTrial ||
    session.plan === 'trial' ||
    session.installedProductId.startsWith('inst_') ||
    (organization.plan as string) === 'trial';

  if (isTrialSession && !isTrialOrg && organization.tenantType === 'PRODUCTION') {
    throw new PortalAuthorizationError(
      'ORGANIZATION_ACCESS_DENIED',
      'A Trial session cannot acquire authority over a PRODUCTION tenant.'
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

  const installedProducts = organization.installedProducts.map((p) => p.product);

  const portalOrg: PortalOrganization = {
    id: organization.organizationId,
    slug: organization.slug,
    name: organization.name,
    logoUrl: organization.logoUrl ?? null,
    projectId: organization.projectId,
    // Producto activo ya normalizado por el SDK (nunca 'hermes' en minúsculas).
    activeProduct: organization.activeProduct?.product ?? null,
    installedProducts,
    isSimulationMode: organization.isSimulationMode ?? null,
  };

  // Gate 7: Enforce server-side PRESERVED state on expired trial
  let trialContext = undefined;
  if (isTrialOrg) {
    const isExpired = organization.trialEndsAt ? Date.now() >= new Date(organization.trialEndsAt).getTime() : false;
    const trialStatus = isExpired ? 'PRESERVED' : (organization.trialStatus || 'ACTIVE');

    trialContext = {
      isTrial: true,
      tier: (organization.trialTier || 'MEDIA_ENABLED') as any,
      startedAt: organization.trialStartedAt,
      endsAt: organization.trialEndsAt,
      status: trialStatus as any,
      isExpired,
    };
  }

  return { tenant, organization: portalOrg, trial: trialContext };
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
    const { db } = await import('@saasfly/db-core');
    const { portalOnboardingState } = await import('@saasfly/db-core/schema');
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
