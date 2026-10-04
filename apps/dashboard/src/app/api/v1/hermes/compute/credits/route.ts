import { NextRequest, NextResponse } from 'next/server';
import { TenantCreditLedgerService } from '@saasfly/hermes-core';
import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { eq, or } from "@saasfly/db-core";
export const dynamic = 'force-dynamic';

/**
 * 💳 HERMES TENANT CREDITS & LEDGER API
 * GET /api/v1/hermes/compute/credits
 *
 * Exposes the durable tenant GPU compute ledger (available & reserved balances).
 * Enforces strict isolation between sandbox and production balances (F6-12).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const tenantParam = request.nextUrl.searchParams.get('tenantId') || request.nextUrl.searchParams.get('organizationId');

    // Production Truth: no snarai default — tenant must be explicitly provided.
    let canonicalTenant = (tenantParam || '').replace(/^org_/, '');

    if (db && tenantParam && canonicalTenant) {
      const [proj] = await db
        .select({ slug: projects.slug })
        .from(projects)
        .where(or(eq(projects.slug, tenantParam), eq(projects.organizationId, tenantParam)))
        .limit(1);
      if (proj?.slug) {
        canonicalTenant = proj.slug;
      }
    }

    const credits = await TenantCreditLedgerService.getOrCreateCredits(canonicalTenant);

    return NextResponse.json({
      ok: true,
      credits: {
        tenantId: credits.tenantId,
        production: {
          availableBalanceUsd: credits.creditBalanceUsd,
          reservedBalanceUsd: credits.reservedBalanceUsd,
          totalSpentUsd: credits.totalSpentUsd,
        },
        sandbox: {
          enabled: credits.isSandboxEnabled,
          availableBalanceUsd: credits.sandboxBalanceUsd,
          reservedBalanceUsd: credits.sandboxReservedBalanceUsd,
        },
        markupPercentage: credits.markupPercentage,
      },
    });
  } catch (err: any) {
    console.error('[CreditsRoute] Error loading tenant credits:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to load credits' }, { status: 500 });
  }
}
