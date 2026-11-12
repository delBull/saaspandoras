import { NextRequest, NextResponse } from 'next/server';
import { TenantCreditLedgerService, TenantAuthorityService } from '@saasfly/hermes-core';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { validateAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hermes/media/credits?tenantId=<slug>
 *
 * Devuelve el saldo del tenant.
 *
 * ANTES: se aceptaba cualquier `tenantId` sin autenticación y además **creaba**
 * la fila de créditos (`getOrCreateCredits`) para tenants arbitrarios. Cualquiera
 * podía leer el saldo de otro tenant y fabricar registros.
 *
 * AHORA:
 *  - El `tenantId` del cliente es sólo una pista; se resuelve al tenant canónico.
 *  - Admin de plataforma → cualquier tenant.
 *  - Sesión de portal → sólo su propio tenant (mismatch = 403, sin sesión = 401).
 *  - Sólo se leen créditos de un tenant autorizado y existente.
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

    // Admin de plataforma: acceso a cualquier tenant.
    const admin = await validateAdminSession(req.headers);
    if (admin.session) {
      const credits = await TenantCreditLedgerService.getOrCreateCredits(projectSlug);
      return NextResponse.json({ ok: true, tenantId: projectSlug, credits });
    }

    // Portal: la sesión manda; el slug pedido debe coincidir con el autorizado.
    try {
      const ctx = await resolvePortalContext(projectSlug);
      const authorizedSlug = ctx.organization.slug.toLowerCase();
      if (authorizedSlug !== projectSlug.toLowerCase()) {
        return NextResponse.json(
          {
            ok: false,
            error: `Tenant mismatch: session authorized for '${authorizedSlug}', not '${projectSlug}'.`,
          },
          { status: 403 }
        );
      }

      const credits = await TenantCreditLedgerService.getOrCreateCredits(authorizedSlug);
      return NextResponse.json({ ok: true, tenantId: authorizedSlug, credits });
    } catch (err: any) {
      if (err?.code === 'NO_SESSION' || err?.code === 'INVALID_SESSION') {
        return NextResponse.json(
          { ok: false, error: 'Authentication required to read tenant credits.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { ok: false, error: `Not authorized to read credits for tenant '${projectSlug}'.` },
        { status: 403 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Error fetching tenant credits' },
      { status: 500 }
    );
  }
}
