import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { MarketingEngine } from '@/lib/marketing/engine';
import { countWorkableLeads } from '@/lib/marketing/growth-engine/engine-service';

export async function GET(req: NextRequest) {
    // 1. Authenticate Cron (Bearer token, x-cron-secret or URL secret param)
    const authHeader = req.headers.get('authorization');
    const xCronSecret = req.headers.get('x-cron-secret');
    const urlSecret = req.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized = 
        (cronSecret && (authHeader === `Bearer ${cronSecret}` || xCronSecret === cronSecret || urlSecret === cronSecret)) ||
        process.env.NODE_ENV !== 'production';

    if (!isAuthorized) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        /**
         * Fluid CPU: este cron corre cada 2 h. Antes ejecutaba los dos motores
         * siempre, aunque no hubiera nada vencido ni leads por evaluar. Se cuenta
         * primero (dos counts indexados) y si no hay trabajo se sale en milisegundos.
         */
        const [dueExecutions, workableLeads] = await Promise.all([
            MarketingEngine.countDueExecutions(),
            countWorkableLeads(),
        ]);

        if (dueExecutions === 0 && workableLeads === 0) {
            return NextResponse.json({
                ok: true,
                skipped: 'sin trabajo pendiente',
                dueExecutions,
                workableLeads,
            });
        }

        // 2. Run Legacy Engine
        console.log('🚀 [CRON] Starting Legacy Marketing Automation Check...');
        const result = await MarketingEngine.processDueExecutions();

        // 3. Run Growth OS Heartbeat (Phase 55 Integration)
        const { processHeartbeat } = await import("@/lib/marketing/growth-engine/engine-service");
        const growthResult = await processHeartbeat();

        console.log(`✅ [CRON] Completed. Legacy: ${result.processed}, Growth OS: ${growthResult.processed}`);

        return NextResponse.json({
            ok: true,
            legacy: result,
            growthOS: growthResult
        });
    } catch (error) {
        console.error('❌ [CRON] Critical Error:', error);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
