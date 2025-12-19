import { NextRequest, NextResponse } from 'next/server';
import { MarketingEngine } from '@/lib/marketing/engine';

export async function GET(req: NextRequest) {
    // 1. Authenticate Vercel Cron
    // Vercel automatically injects CRON_SECRET into the Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 2. Run the Engine
        console.log('🚀 [CRON] Starting Marketing Automation Check...');
        const result = await MarketingEngine.processDueExecutions();

        console.log(`✅ [CRON] Completed. Processed: ${result.processed}, Errors: ${result.errors}`);

        return NextResponse.json({
            ok: true,
            processed: result.processed,
            errors: result.errors
        });
    } catch (error) {
        console.error('❌ [CRON] Critical Error:', error);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
