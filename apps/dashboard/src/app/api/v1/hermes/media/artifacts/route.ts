import { NextRequest, NextResponse } from 'next/server';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { TenantAuthorityService } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { validateAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hermes/media/artifacts?tenantId=<slug>
 * Lists verified artifacts for a tenant.
 *
 * Authorization:
 *  - Tenant portal sessions may ONLY read their own tenant's artifacts.
 *  - Platform admins may read any tenant.
 * The `tenantId` is always resolved/rescoped server-side; the client value is
 * only used as the lookup hint.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedTenant = searchParams.get('tenantId');

    if (!requestedTenant) {
      return NextResponse.json(
        { ok: false, error: 'tenantId query parameter is required' },
        { status: 400 }
      );
    }

    const canonical = await TenantAuthorityService.resolveCanonicalTenant(requestedTenant);
    if (!canonical) {
      return NextResponse.json(
        { ok: false, error: `Tenant '${requestedTenant}' does not exist or is not provisioned.` },
        { status: 404 }
      );
    }
    const projectSlug = canonical.projectSlug;

    // Admin path: any tenant.
    const admin = await validateAdminSession(req.headers);
    if (admin.session) {
      const artifacts = await CapabilityGrantService.listArtifactsForTenant(projectSlug);
      return NextResponse.json({ ok: true, tenantId: projectSlug, count: artifacts.length, artifacts });
    }

    // Portal tenant path: portal session must be authorized for this tenant.
    try {
      const ctx = await resolvePortalContext(projectSlug);
      const authorizedSlug = ctx.organization.slug.toLowerCase();
      if (authorizedSlug !== projectSlug.toLowerCase()) {
        return NextResponse.json(
          { ok: false, error: `Tenant mismatch: session authorized for '${authorizedSlug}', not '${projectSlug}'.` },
          { status: 403 }
        );
      }
      const artifacts = await CapabilityGrantService.listArtifactsForTenant(authorizedSlug);
      return NextResponse.json({ ok: true, tenantId: authorizedSlug, count: artifacts.length, artifacts });
    } catch (err: any) {
      if (err?.code === 'NO_SESSION' || err?.code === 'INVALID_SESSION') {
        return NextResponse.json({ ok: false, error: 'Authentication required to list tenant artifacts.' }, { status: 401 });
      }
      return NextResponse.json(
        { ok: false, error: `Not authorized to list artifacts for tenant '${projectSlug}'.` },
        { status: 403 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to list tenant artifacts' },
      { status: 500 }
    );
  }
}