import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { MarketingEngine } from '@/lib/marketing/engine';

export async function GET(req: NextRequest) {
    // 1. Authenticate Cron (Bearer token or URL secret param)
    const authHeader = req.headers.get('authorization');
    const urlSecret = req.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized = 
        (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
        (cronSecret && urlSecret === cronSecret) ||
        process.env.NODE_ENV !== 'production';

    if (!isAuthorized) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
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
