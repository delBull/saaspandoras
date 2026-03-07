/**
 * POST /api/admin/telegram-bridge/alerts/evaluate
 *
 * Cron endpoint — runs the alert evaluator.
 * Protected by:
 *   1. CRON_SECRET header (for cron runners like Vercel/Render)
 *   2. Admin auth (fallback for manual admin triggers)
 *
 * Call every 1–5 minutes from your cron provider:
 *   curl -X POST /api/admin/telegram-bridge/alerts/evaluate \
 *        -H "x-cron-secret: $CRON_SECRET"
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { runAlertEvaluator } from '@/lib/alerts/evaluator';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // seconds

type ValidatedResult =
    | { ok: true }
    | { ok: false; status: number; error: string };

async function validateRequest(req: NextRequest): Promise<ValidatedResult> {
    // 1. Cron secret (for automated job runners)
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret && cronSecret === process.env.CRON_SECRET) {
        return { ok: true };
    }

    // 2. Admin auth (manual trigger from admin panel)
    const { session } = await getAuth();
    if (session?.address && await isAdmin(session.address)) {
        return { ok: true };
    }

    return { ok: false, status: 401, error: 'Unauthorized' };
}

export async function POST(req: NextRequest) {
    const validation = await validateRequest(req);
    if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const start = Date.now();

    try {
        const result = await runAlertEvaluator();

        return NextResponse.json({
            ok: true,
            durationMs: Date.now() - start,
            ...result,
        });
    } catch (err: any) {
        console.error('[Alerts Evaluate]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
