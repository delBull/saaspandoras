import { NextRequest, NextResponse } from 'next/server';
import { TenantAuthorityService, TenantCreditLedgerService } from '@saasfly/hermes-core';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { validateAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/v1/hermes/compute/credits?tenantId=<slug|uuid>
 *
 * Saldo del tenant.
 *
 * SEGURIDAD (hotfix 2026-11-12):
 *  - Antes leía `authorization` pero NO lo validaba: cualquiera consultaba el
 *    saldo de cualquier tenant y además CREABA la fila de créditos.
 *  - Ahora: admin de plataforma o sesión de portal del propio tenant (mismatch = 403).
 *  - Lectura sin efectos secundarios (`getCredits`), nunca `getOrCreateCredits`.
 *  - El `markupPercentage` (margen interno) solo se devuelve al admin.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantParam =
      request.nextUrl.searchParams.get('tenantId') ||
      request.nextUrl.searchParams.get('organizationId') ||
      '';
    if (!tenantParam.trim()) {
      return NextResponse.json({ ok: false, error: 'tenantId es requerido' }, { status: 400 });
    }

    const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantParam);
    if (!canonical) {
      return NextResponse.json({ ok: false, error: 'Tenant no encontrado' }, { status: 404 });
    }
    const projectSlug = canonical.projectSlug;

    const admin = await validateAdminSession(request.headers);
    let isAdminRequest = Boolean(admin.session);

    if (!isAdminRequest) {
      try {
        const ctx = await resolvePortalContext(projectSlug);
        if (ctx.organization.slug.toLowerCase() !== projectSlug.toLowerCase()) {
          return NextResponse.json({ ok: false, error: 'Tenant no autorizado' }, { status: 403 });
        }
      } catch (error: any) {
        const status = error?.code === 'NO_SESSION' || error?.code === 'INVALID_SESSION' ? 401 : 403;
        return NextResponse.json(
          { ok: false, error: 'Autenticación requerida para consultar créditos.' },
          { status }
        );
      }
    }

    const credits = await TenantCreditLedgerService.getCredits(projectSlug);

    // Sin fila de créditos = saldo $0 (hecho, no invención); no se crea nada al leer.
    const base = {
      tenantId: projectSlug,
      production: {
        availableBalanceUsd: credits?.creditBalanceUsd ?? 0,
        reservedBalanceUsd: credits?.reservedBalanceUsd ?? 0,
        totalSpentUsd: credits?.totalSpentUsd ?? 0,
      },
      sandbox: {
        enabled: credits?.isSandboxEnabled ?? true,
        availableBalanceUsd: credits?.sandboxBalanceUsd ?? 0,
        reservedBalanceUsd: credits?.sandboxReservedBalanceUsd ?? 0,
      },
      initialized: Boolean(credits),
    };

    return NextResponse.json({
      ok: true,
      credits: isAdminRequest
        ? { ...base, markupPercentage: credits?.markupPercentage ?? null }
        : base,
    });
  } catch (err: any) {
    console.error('[CreditsRoute] Error loading tenant credits:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to load credits' }, { status: 500 });
  }
}
