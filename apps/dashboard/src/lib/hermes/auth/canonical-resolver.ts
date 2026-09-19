import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { getAuth, isAdmin } from '@/lib/auth';
import { isWalletAuthorizedForTenant } from '@/lib/hermes/auth/wallet-tenant-membership';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';

const PORTAL_SESSION_COOKIE = 'pandoras_portal_session';
const sessionTokenService = new SessionTokenService();

export interface CanonicalAuthSession {
  actorId: string;
  sessionId: string;
  canonicalOrgId: string;
  projectSlug: string;
  role: 'TENANT_ADMIN' | 'OPERATOR' | 'OWNER';
  isTrial: boolean;
  /** Real EVM wallet of the caller when resolved via the wallet branch (owner gate for secrets). */
  actorWallet?: string | null;
}

/**
 * Core canonical resolver for establishing a secure authenticated session.
 * Supports:
 * 1. Portal Session (JWT Cookie)
 * 2. Web3 Wallet (Thirdweb/x-wallet-address headers)
 * 3. Bearer Token (TMA/API)
 */
export async function resolveCanonicalAuthSession(
  req?: NextRequest,
  requestedOrganizationSlug?: string
): Promise<CanonicalAuthSession | null> {
  // Try retrieving headers and cookies (from NextRequest or Next.js app router context)
  const reqHeaders = req ? req.headers : await headers();
  const cookieStore = req ? { get: (name: string) => req.cookies.get(name) } : await cookies();

  let sessionToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  let tenantIdentifier: string | null = null;
  let actorId = 'anonymous_actor';
  let sessionId = '';
  let role: 'TENANT_ADMIN' | 'OPERATOR' | 'OWNER' = 'OPERATOR';
  let isTrial = false;

  // 1. Fallback: Web3 Wallet / Admin Dashboard Session (Highest precedence if requested)
  // Only attempt if we know what organization is requested
  if (!sessionToken && requestedOrganizationSlug) {
    try {
      const auth = await getAuth(reqHeaders);
      const callerWallet = auth.session?.address?.toLowerCase() ||
        (auth.isVerified ? (reqHeaders.get('x-wallet-address')?.toLowerCase() || reqHeaders.get('x-thirdweb-address')?.toLowerCase()) : null);

      if (callerWallet) {
        const isUserAdmin = await isAdmin(callerWallet);
        const isTenantAuthorized = await isWalletAuthorizedForTenant(callerWallet, requestedOrganizationSlug);

        if (isUserAdmin || isTenantAuthorized) {
          const organization = await OrganizationSDK.resolve(requestedOrganizationSlug, 'HERMES');
          
          return {
            actorId: `wallet_${callerWallet.slice(0, 10)}`,
            sessionId: `wallet_session_${callerWallet}`,
            canonicalOrgId: organization.organizationId,
            projectSlug: organization.slug,
            role: 'OWNER',
            isTrial: organization.tenantType === 'TRIAL',
            actorWallet: callerWallet,
          };
        }
      }
    } catch (e) {
      console.warn('[resolveCanonicalAuthSession] Wallet fallback probe:', e);
    }
  }

  // 2. Validate JWT Portal Session
  if (sessionToken) {
    const session = await validatePortalSession(sessionToken);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        tenantIdentifier = org.slug || org.organizationId;
        actorId = `session_${session.installedProductId}`;
        sessionId = sessionToken;
        role = 'TENANT_ADMIN';
        isTrial = session.isTrial || session.plan === 'trial' || org.tenantType === 'TRIAL';
      }
    }
  }

  // 3. Check Bearer token if no cookie (for TMA or API integrations)
  if (!tenantIdentifier) {
    const authHeader = reqHeaders.get('authorization') || '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (bearerToken) {
      try {
        const payload = sessionTokenService.verifyToken(bearerToken);
        tenantIdentifier = payload.organizationId;
        actorId = (payload as any).actorId || (payload as any).sub || 'tma_actor';
        sessionId = bearerToken;
        role = 'OPERATOR';
      } catch {
        // invalid token
      }
    }
  }

  if (!tenantIdentifier) {
    return null;
  }

  // Double check matching if requestedOrganizationSlug is provided
  if (requestedOrganizationSlug) {
    const isAuthorized = tenantIdentifier === requestedOrganizationSlug;
    if (!isAuthorized) {
       // Could be that tenantIdentifier is the UUID and requested is slug, we resolve it safely
       const org = await OrganizationSDK.resolve(tenantIdentifier, 'HERMES');
       if (!org || (org.slug !== requestedOrganizationSlug && org.organizationId !== requestedOrganizationSlug)) {
          return null; // Cross-tenant spoofing rejected
       }
       tenantIdentifier = org.organizationId;
       const projectSlug = org.slug;
       
       return {
         actorId,
         sessionId,
         canonicalOrgId: tenantIdentifier,
         projectSlug,
         role,
         isTrial,
       };
    }
  }
  
  // Resolve completely
  const org = await OrganizationSDK.resolve(tenantIdentifier, 'HERMES');
  if (!org) return null;
  return {
    actorId,
    sessionId,
    canonicalOrgId: org.organizationId,
    projectSlug: org.slug,
    role,
    isTrial: isTrial || org.tenantType === 'TRIAL',
  };
}
