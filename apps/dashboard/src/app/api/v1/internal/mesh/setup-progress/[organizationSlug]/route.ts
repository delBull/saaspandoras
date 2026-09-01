/**
 * 🌐 API Route: Ecosystem Setup Progress State
 * apps/dashboard/src/app/api/v1/internal/mesh/setup-progress/[organizationSlug]/route.ts
 *
 * Enforces fail-closed authentication and tenant ownership authorization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { setupProgressService } from '@/lib/mesh/setup-progress.service';
import { getAuth, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

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

    // 🛡️ SECURITY GUARD: Authenticate caller
    const auth = await getAuth(req.headers);
    const sessionWallet = auth.session?.address?.toLowerCase();
    const headerWallet = (
      req.headers.get('x-wallet-address') || req.headers.get('x-thirdweb-address')
    )?.toLowerCase();

    const callerWallet = sessionWallet || (auth.isVerified ? headerWallet : null);

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
      const tenantProject = await db
        .select({ applicantWalletAddress: projects.applicantWalletAddress })
        .from(projects)
        .where(eq(projects.slug, cleanSlug))
        .limit(1)
        .then((rows) => rows[0]);

      if (!tenantProject) {
        return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 });
      }

      const projectWallet = tenantProject.applicantWalletAddress?.toLowerCase();
      if (!projectWallet || projectWallet !== callerWallet) {
        return NextResponse.json(
          { error: 'FORBIDDEN_TENANT_ACCESS: You do not have permissions for this organization.' },
          { status: 403 }
        );
      }
    }

    const state = await setupProgressService.getEcosystemSetupState(cleanSlug);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error('[SetupProgressAPI] Error:', err);
    return NextResponse.json({ error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
