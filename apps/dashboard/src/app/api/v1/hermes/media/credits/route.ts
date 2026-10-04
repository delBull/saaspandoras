import { NextRequest, NextResponse } from 'next/server';
import { TenantCreditLedgerService } from '@saasfly/hermes-core';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: 'tenantId is required' }, { status: 400 });
    }

    const credits = await TenantCreditLedgerService.getOrCreateCredits(tenantId);

    return NextResponse.json({
      ok: true,
      credits,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Error fetching tenant credits' },
      { status: 500 }
    );
  }
}
