import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { tenantSubscriptions } from '@saasfly/db/schema';
import { and, eq, gte, inArray, lte, isNotNull } from '@saasfly/db-core';
import {
  applySubscriptionLifecycle,
  computeSubscriptionReminderStage,
  sendSubscriptionReminder,
} from '@/lib/billing/subscription';

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

    // ── Recordatorios de cobro (3 días antes y el último día) ────────────────
    // Se envían ANTES de aplicar el ciclo de vida: al vencer, la suscripción
    // pasa a 'grace' y ya no entraría en esta consulta.
    const reminders: Array<{ tenantId: string; stage: string }> = [];
    try {
      const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
      const due = await db
        .select({
          tenantId: tenantSubscriptions.tenantId,
          amountUsd: tenantSubscriptions.amountUsd,
          currentPeriodEnd: tenantSubscriptions.currentPeriodEnd,
        })
        .from(tenantSubscriptions)
        .where(
          and(
            eq(tenantSubscriptions.status, 'active'),
            isNotNull(tenantSubscriptions.currentPeriodEnd),
            gte(tenantSubscriptions.currentPeriodEnd, windowStart),
            lte(tenantSubscriptions.currentPeriodEnd, windowEnd)
          )
        )
        .limit(500);

      for (const sub of due) {
        const stage = computeSubscriptionReminderStage(sub.currentPeriodEnd, now);
        if (!stage) continue;
        const sent = await sendSubscriptionReminder({
          tenantId: sub.tenantId,
          stage,
          amountUsd: Number(sub.amountUsd),
          currentPeriodEnd: sub.currentPeriodEnd as Date,
          now,
        });
        reminders.push({ tenantId: sub.tenantId, stage: `${stage}:${sent.notified ? 'inapp' : 'no'}:${sent.emailed ? 'email' : 'no-email'}` });
      }
    } catch (error: unknown) {
      console.error('[Cron:subscription-lifecycle] Reminders failed:', error);
    }

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

    return NextResponse.json({ ok: true, checked: rows.length, reminders, transitions });
  } catch (error: unknown) {
    console.error('[Cron:subscription-lifecycle] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'internal_error' },
      { status: 500 }
    );
  }
}
