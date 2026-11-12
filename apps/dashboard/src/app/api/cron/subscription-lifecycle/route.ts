import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { tenantSubscriptions } from '@saasfly/db/schema';
import { and, inArray, lte, isNotNull } from '@saasfly/db-core';
import { applySubscriptionLifecycle } from '@/lib/billing/subscription';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/cron/subscription-lifecycle
 *
 * Aplica el ciclo de vida del plan mensual:
 *   activo (periodo vencido) → gracia 7 días → suspendido (solo lectura).
 * Crea avisos in-app en cada transición (idempotentes).
 *
 * Auth: Bearer $CRON_SECRET (mismo patrón que el resto de crons).
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET_NOT_CONFIGURED' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${expected}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();
    const rows = await db
      .select({ tenantId: tenantSubscriptions.tenantId })
      .from(tenantSubscriptions)
      .where(
        and(
          inArray(tenantSubscriptions.status, ['active', 'grace']),
          isNotNull(tenantSubscriptions.currentPeriodEnd),
          lte(tenantSubscriptions.currentPeriodEnd, now)
        )
      )
      .limit(500);

    const transitions: Array<{ tenantId: string; status: string }> = [];
    for (const row of rows) {
      const result = await applySubscriptionLifecycle(row.tenantId, now);
      if (result.changed) transitions.push({ tenantId: row.tenantId, status: result.status });
    }

    return NextResponse.json({ ok: true, checked: rows.length, transitions });
  } catch (error: unknown) {
    console.error('[Cron:subscription-lifecycle] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'internal_error' },
      { status: 500 }
    );
  }
}
