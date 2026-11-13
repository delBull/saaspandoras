import { NextRequest, NextResponse } from 'next/server';
import { TenantBillingService } from '@saasfly/hermes-core';
import { validateAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/v1/hermes/billing/accounting
 *
 * Libro mayor interno (markup, fondeos, costos) + wallet de tesorería.
 *
 * SEGURIDAD (hotfix 2026-11-12): antes esta ruta NO tenía autenticación y
 * devolvía el ledger de cualquier `tenantId` más la wallet de tesorería.
 * Es información contable INTERNA (el markup nunca se comparte con el tenant),
 * así que queda restringida a administradores de plataforma.
 */
export async function GET(req: NextRequest) {
  const { session, errorResponse } = await validateAdminSession(req.headers);
  if (!session) {
    return (
      errorResponse ??
      NextResponse.json({ ok: false, error: 'Se requiere sesión de administrador.' }, { status: 403 })
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const ledger = await TenantBillingService.getInternalAccountingLedger({
      tenantId,
      limit: Number.isFinite(limit) ? Math.min(limit, 200) : 50,
    });

    const treasuryWallet = TenantBillingService.getTreasuryWallet();

    return NextResponse.json({
      ok: true,
      treasuryWallet,
      entriesCount: ledger.length,
      ledger,
    });
  } catch (err: any) {
    console.error('[AccountingRoute] Error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Error fetching Hermes internal accounting ledger' },
      { status: 500 }
    );
  }
}
