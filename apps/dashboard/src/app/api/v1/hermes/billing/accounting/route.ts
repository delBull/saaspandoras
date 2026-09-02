import { NextRequest, NextResponse } from 'next/server';
import { TenantBillingService } from '@/lib/hermes/compute/tenant-billing.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const ledger = await TenantBillingService.getInternalAccountingLedger({
      tenantId,
      limit,
    });

    const treasuryWallet = TenantBillingService.getTreasuryWallet();

    return NextResponse.json({
      ok: true,
      treasuryWallet,
      entriesCount: ledger.length,
      ledger,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Error fetching Hermes internal accounting ledger' },
      { status: 500 }
    );
  }
}
