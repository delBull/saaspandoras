import { NextRequest, NextResponse } from 'next/server';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { resolveTreasuryWallet } from '@/lib/payments/treasury';
import { isTxHash, verifyOnChainUsdcTransfer, USDC_BASE } from '@/lib/payments/onchain-verify';
import { getOrCreateSubscription, markSubscriptionPaid } from '@/lib/billing/subscription';
import { validateAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/v1/hermes/billing/subscription
 *
 * GET  → plan del tenant: importe mensual (suma de paquetes), estado, próximo
 *        cargo y datos para pagar (treasury + USDC).
 * POST → declara el txHash del pago del plan; el servidor verifica on-chain y
 *        extiende 30 días (idempotente por txHash).
 *
 * El pago del plan es SEPARADO de los créditos de media.
 */

async function authorize(req: NextRequest, tenantId: string): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const admin = await validateAdminSession(req.headers);
  if (admin.session) return { ok: true };
  try {
    const ctx = await resolvePortalContext(tenantId);
    if (ctx.organization.slug.toLowerCase() !== tenantId.toLowerCase()) {
      return { ok: false, res: NextResponse.json({ ok: false, error: 'Tenant no autorizado' }, { status: 403 }) };
    }
    return { ok: true };
  } catch (error: any) {
    const status = error?.code === 'NO_SESSION' || error?.code === 'INVALID_SESSION' ? 401 : 403;
    return { ok: false, res: NextResponse.json({ ok: false, error: 'Acceso denegado' }, { status }) };
  }
}

export async function GET(req: NextRequest) {
  const tenantId = (new URL(req.url).searchParams.get('tenantId') ?? '').toLowerCase().trim();
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: 'tenantId es requerido' }, { status: 400 });
  }

  const auth = await authorize(req, tenantId);
  if (!auth.ok) return auth.res;

  const snapshot = await getOrCreateSubscription(tenantId);
  if (!snapshot) return NextResponse.json({ ok: false, error: 'Suscripción no disponible' }, { status: 404 });

  const treasury = resolveTreasuryWallet();

  return NextResponse.json({
    ok: true,
    tenantId,
    plan: {
      amountUsd: snapshot.amountUsd,
      currency: 'USD',
      lines: snapshot.lines,
      status: snapshot.state.status,
      isReadOnly: snapshot.state.isReadOnly,
      daysToCharge: snapshot.state.daysToCharge,
      graceDaysLeft: snapshot.state.graceDaysLeft,
      currentPeriodEnd: snapshot.currentPeriodEnd,
      graceEndsAt: snapshot.graceEndsAt,
    },
    payment: {
      treasury: treasury.ok ? treasury.wallet : null,
      treasuryConfigured: treasury.ok,
      chainId: 8453,
      usdc: USDC_BASE,
    },
    note: 'El pago del plan es independiente del saldo de créditos de media.',
  });
}

export async function POST(req: NextRequest) {
  let body: { tenantId?: unknown; txHash?: unknown; chainId?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }

  const tenantId = typeof body.tenantId === 'string' ? body.tenantId.toLowerCase().trim() : '';
  if (!tenantId) return NextResponse.json({ ok: false, error: 'tenantId es requerido' }, { status: 400 });

  const auth = await authorize(req, tenantId);
  if (!auth.ok) return auth.res;

  const txHash = body.txHash;
  if (!isTxHash(txHash)) {
    return NextResponse.json({ ok: false, error: 'txHash inválido (0x + 64 hex)' }, { status: 422 });
  }

  const treasury = resolveTreasuryWallet();
  if (!treasury.ok) {
    return NextResponse.json({ ok: false, error: treasury.reason, code: 'TREASURY_NOT_CONFIGURED' }, { status: 503 });
  }

  const chainId = Number(body.chainId ?? 8453);
  const verification = await verifyOnChainUsdcTransfer({
    txHash,
    chainId,
    treasury: treasury.wallet,
    context: 'subscription',
  });
  if (!verification.ok) {
    return NextResponse.json(
      { ok: false, error: 'El pago no se pudo verificar on-chain.', reason: verification.reason },
      { status: 422 }
    );
  }

  const result = await markSubscriptionPaid({
    tenantId,
    txHash: txHash.toLowerCase(),
    amountUsd: verification.amountUsd,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          result.reason === 'AMOUNT_BELOW_PLAN_FEE'
            ? 'El importe verificado es menor al precio del plan.'
            : 'No se pudo registrar el pago del plan.',
        code: result.reason ?? null,
        verifiedAmountUsd: verification.amountUsd,
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    ok: true,
    alreadyPaid: Boolean(result.alreadyPaid),
    verifiedAmountUsd: verification.amountUsd,
    plan: result.snapshot
      ? {
          amountUsd: result.snapshot.amountUsd,
          status: result.snapshot.state.status,
          currentPeriodEnd: result.snapshot.currentPeriodEnd,
          daysToCharge: result.snapshot.state.daysToCharge,
        }
      : null,
  });
}
