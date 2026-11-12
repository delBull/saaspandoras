import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { projects } from '@saasfly/db/schema';
import { and, eq, gte, lte, isNotNull } from '@saasfly/db-core';
import { ensureTrialReminder } from '@/lib/notifications/tenant-notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/cron/trial-reminders
 *
 * Crea los avisos in-app del periodo de gracia (7 días):
 *   · 2 días restantes  (día 5)
 *   · 1 día restante    (día 6)
 *   · último día        (día 7)
 *
 * Idempotente: `ensureTrialReminder` usa dedupeKey `trial:<fin>:<stage>`, así
 * que puede correr varias veces al día sin duplicar avisos.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` (mismo patrón que los demás crons).
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
    // Ventana: trials que terminan en los próximos 3 días (cubre días 5, 6 y 7).
    const until = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const rows = await db
      .select({
        slug: projects.slug,
        trialEndsAt: projects.trialEndsAt,
        trialStatus: projects.trialStatus,
      })
      .from(projects)
      .where(
        and(
          eq(projects.tenantType, 'TRIAL'),
          isNotNull(projects.trialEndsAt),
          gte(projects.trialEndsAt, now),
          lte(projects.trialEndsAt, until)
        )
      )
      .limit(500);

    const created: Array<{ tenant: string; stage: string; daysLeft: number }> = [];

    for (const row of rows) {
      if (row.trialStatus && row.trialStatus !== 'ACTIVE') continue;
      const stage = await ensureTrialReminder({ tenantId: row.slug, trialEndsAt: row.trialEndsAt, now });
      if (stage) {
        const daysLeft = Math.max(
          0,
          Math.ceil((new Date(row.trialEndsAt as Date).getTime() - now.getTime()) / 86400000)
        );
        created.push({ tenant: row.slug, stage, daysLeft });
      }
    }

    return NextResponse.json({
      ok: true,
      checked: rows.length,
      notified: created.length,
      reminders: created,
    });
  } catch (error: unknown) {
    console.error('[Cron:trial-reminders] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'internal_error' },
      { status: 500 }
    );
  }
}
