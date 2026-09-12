import { NextRequest, NextResponse } from 'next/server';
import { HermesReconciliationSweeperService } from '@/lib/hermes/reconciliation/hermes-reconciliation-sweeper.service';

/**
 * 🧹 HERMES AUTONOMOUS RECONCILIATION SWEEPER ENDPOINT (FASE 6)
 * POST /api/v1/hermes/reconcile/sweeper
 *
 * Dispatches an atomic, self-healing reconciliation cycle across UNKNOWN
 * distribution jobs and media generation requests.
 *
 * Protected via CRON_SECRET / internal Bearer authorization.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const cronSecretHeader = request.headers.get('x-cron-secret') || '';
    const expectedSecret = process.env.CRON_SECRET || process.env.INTERNAL_SWEEPER_SECRET;

    // P2-4: Strict fail-closed authorization check
    if (!expectedSecret) {
      console.warn('[SweeperRoute] FAIL-CLOSED: Neither CRON_SECRET nor INTERNAL_SWEEPER_SECRET configured.');
      return NextResponse.json(
        { ok: false, error: 'Sweeper secret not configured in environment (fail-closed)' },
        { status: 401 }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token !== expectedSecret && cronSecretHeader !== expectedSecret) {
      return NextResponse.json({ ok: false, error: 'Unauthorized sweeper dispatch' }, { status: 401 });
    }

    let batchSize = HermesReconciliationSweeperService.DEFAULT_BATCH_SIZE;
    try {
      const body = await request.json();
      if (body?.batchSize && typeof body.batchSize === 'number') {
        batchSize = Math.min(Math.max(1, body.batchSize), 100);
      }
    } catch {
      // JSON body optional
    }

    const cycleResult = await HermesReconciliationSweeperService.sweepAll(batchSize);

    return NextResponse.json({
      ok: true,
      cycle: cycleResult,
    });
  } catch (err: any) {
    console.error('[SweeperRoute] Error running reconciliation cycle:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Sweeper cycle execution failed' }, { status: 500 });
  }
}
