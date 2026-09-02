import { NextRequest, NextResponse } from 'next/server';
import { TenantBillingService } from '@/lib/hermes/compute/tenant-billing.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, amountUsd, isSandbox = false, paymentMethod = 'thirdweb_pay', transactionHash, payerWallet } = body;

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: 'tenantId es requerido' }, { status: 400 });
    }

    const numAmount = parseFloat(amountUsd);
    if (isNaN(numAmount) || numAmount < 5.0) {
      return NextResponse.json(
        { ok: false, error: 'El monto mínimo de recarga es de $5.00 USD' },
        { status: 400 }
      );
    }

    const result = await TenantBillingService.processDeposit({
      tenantId,
      amountUsd: numAmount,
      isSandbox: Boolean(isSandbox),
      paymentMethod,
      transactionHash,
      payerWallet,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Error al procesar depósito de créditos' },
      { status: 500 }
    );
  }
}
