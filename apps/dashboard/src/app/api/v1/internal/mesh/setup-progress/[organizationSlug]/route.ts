/**
 * 🌐 API Route: Ecosystem Setup Progress State
 * apps/dashboard/src/app/api/v1/internal/mesh/setup-progress/[organizationSlug]/route.ts
 *
 * Enforces fail-closed authentication and tenant ownership authorization.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ProductKey } from '@saasfly/shared';
import { setupProgressService } from '@saasfly/shared';
import { getAuth, isAdmin } from '@saasfly/auth-sdk';
import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ organizationSlug: string }> }
) {
  try {
    const { organizationSlug } = await params;
    if (!organizationSlug) {
      return NextResponse.json({ error: 'ORGANIZATION_SLUG_REQUIRED' }, { status: 400 });
    }

    const cleanSlug = organizationSlug.toLowerCase().trim();

    // 🛡️ SECURITY GUARD: Authenticate caller via Portal Session or Web Wallet / Admin
    let isCallerAuthorized = false;

    // 1. Try portal session
    const portalCookie = req.cookies.get('pandoras_portal_session')?.value;
    const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    const portalToken = portalCookie ?? authHeader;

    if (portalToken) {
      try {
        const { validatePortalSession, OrganizationSDK } = await import('@saasfly/shared');
        const session = await validatePortalSession(portalToken);
        if (session) {
          const org = await OrganizationSDK.resolve(session.projectId, session.product as ProductKey | undefined);
          if (org && (org.slug === cleanSlug || org.organizationId === cleanSlug)) {
            isCallerAuthorized = true;
          }
        }
      } catch (_pErr) {
        // Fallback to wallet auth
      }
    }

    if (!isCallerAuthorized) {
      const auth = await getAuth(req.headers);
      const sessionWallet = typeof auth.session?.address === 'string' ? auth.session.address.toLowerCase() : null;
      const rawHeaderWallet = req.headers.get('x-wallet-address') ?? req.headers.get('x-thirdweb-address');
      const headerWallet = typeof rawHeaderWallet === 'string' ? rawHeaderWallet.toLowerCase() : null;

      const callerWallet = sessionWallet ?? (auth.isVerified ? headerWallet : null);

      if (!callerWallet) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED: Authentication is required to access tenant setup signals.' },
          { status: 401 }
        );
      }

      // Check if caller is super admin or platform admin
      const isUserAdmin = await isAdmin(callerWallet);

      if (!isUserAdmin) {
        // Verify tenant ownership
        const [tenantProject] = await db
          .select({ applicantWalletAddress: projects.applicantWalletAddress })
          .from(projects)
          .where(eq(projects.slug, cleanSlug))
          .limit(1);

        if (!tenantProject) {
          return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 });
        }

        const projectWallet = typeof tenantProject.applicantWalletAddress === 'string'
          ? tenantProject.applicantWalletAddress.toLowerCase()
          : null;
        if (!projectWallet || projectWallet !== callerWallet) {
          return NextResponse.json(
            { error: 'FORBIDDEN_TENANT_ACCESS: You do not have permissions for this organization.' },
            { status: 403 }
          );
        }
      }
    }

    const state = await setupProgressService.getEcosystemSetupState(cleanSlug);
    return NextResponse.json(state);
  } catch (err: unknown) {
    console.error('[SetupProgressAPI] Error:', err);
    const message = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
