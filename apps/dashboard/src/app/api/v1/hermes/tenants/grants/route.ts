import { NextRequest, NextResponse } from 'next/server';
import { CapabilityGrantService, SUPPORTED_MEDIA_CAPABILITIES } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { TenantAuthorityService } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { validateAdminSession } from '@/lib/admin-auth';
import { HermesNotificationDispatcher } from '@/lib/hermes/notifications/notification-dispatcher';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hermes/tenants/grants?tenantId=<slug>
 * Lists capability grants for a tenant.
 *
 * Authorization (both server-side):
 *  - Platform admin session: may read any tenant's grants.
 *  - Tenant portal session: may ONLY read its own tenant's grants.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: 'tenantId query parameter is required' },
        { status: 400 }
      );
    }

    // Resolve the tenant server-side (fail-closed if it does not exist).
    const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantId);
    if (!canonical) {
      return NextResponse.json(
        { ok: false, error: `Tenant '${tenantId}' does not exist or is not provisioned.` },
        { status: 404 }
      );
    }
    const projectSlug = canonical.projectSlug;

    // Admin path: verified admin session governed that tenant.
    const admin = await validateAdminSession(req.headers);
    if (admin.session) {
      const grants = await CapabilityGrantService.listGrantsForTenant(projectSlug);
      return NextResponse.json({
        ok: true,
        tenantId: projectSlug,
        organizationId: canonical.canonicalOrgId,
        grants,
      });
    }

    // Portal tenant path: only its own tenant.
    try {
      const ctx = await resolvePortalContext(projectSlug);
      const authorizedSlug = ctx.organization.slug.toLowerCase();
      if (authorizedSlug !== projectSlug.toLowerCase()) {
        return NextResponse.json(
          { ok: false, error: `Tenant mismatch: session authorized for '${authorizedSlug}', not '${projectSlug}'.` },
          { status: 403 }
        );
      }
      const grants = await CapabilityGrantService.listGrantsForTenant(authorizedSlug);
      return NextResponse.json({
        ok: true,
        tenantId: authorizedSlug,
        organizationId: ctx.organization.id,
        grants,
      });
    } catch (err: any) {
      if (err?.code === 'NO_SESSION' || err?.code === 'INVALID_SESSION') {
        return NextResponse.json({ ok: false, error: 'Authentication required to list capability grants.' }, { status: 401 });
      }
      return NextResponse.json(
        { ok: false, error: `Not authorized to list capability grants for tenant '${projectSlug}'.` },
        { status: 403 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to list capability grants' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/hermes/tenants/grants
 * Authorizes or suspends a Media Co capability for a tenant.
 * ADMIN-ONLY. The acting admin identity (actorId) is derived from the verified
 * session — the client body NEVER supplies `authorizedBy`.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the admin server-side (no dev-mode bypass, no API key header).
    const { session, errorResponse } = await validateAdminSession(req.headers);
    if (errorResponse) {
      return errorResponse;
    }
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Admin session is required.' }, { status: 401 });
    }

    const actorId = `admin:${session.address.toLowerCase()}`;

    const body = await req.json();
    const { tenantId, capability, enabled } = body;

    if (!tenantId || !capability || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'tenantId, capability, and enabled (boolean) are required' },
        { status: 400 }
      );
    }

    // 2. Resolve the target tenant server-side — the admin can only govern
    //    tenants that resolve to a real, provisioned project.
    const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantId);
    if (!canonical) {
      return NextResponse.json(
        { ok: false, error: `Tenant '${tenantId}' does not exist or is not provisioned.` },
        { status: 404 }
      );
    }

    const grant = await CapabilityGrantService.setGrant(
      canonical.projectSlug,
      capability,
      enabled,
      actorId
    );

    if (enabled) {
      try {
        const known = SUPPORTED_MEDIA_CAPABILITIES.find(c => c.id === capability);
        const dispatcher = new HermesNotificationDispatcher();
        await dispatcher.dispatchMediaCoCapabilityGranted(
          canonical.canonicalOrgId,
          canonical.title || canonical.projectSlug,
          { capability, label: known?.label || capability }
        );
      } catch (notifyErr: any) {
        console.warn('[GrantsAPI] Failed to dispatch capability granted notification to tenant bot:', notifyErr?.message);
      }
    }

    return NextResponse.json({
      ok: true,
      grant,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to update capability grant' },
      { status: 500 }
    );
  }
}