import { NextResponse } from 'next/server';
import { getAuth, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { gamificationLogs } from '@/db/schema';
import { desc, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/admin/gamification/logs - List high-risk or recent logs
export async function GET(req: Request) {
    try {
        const { session } = await getAuth();
        if (!session?.address || !await isAdmin(session.address)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const riskThreshold = parseFloat(searchParams.get('risk') || '0.7');

        const logs = await db.select()
            .from(gamificationLogs)
            .where(gt(gamificationLogs.riskScore, riskThreshold.toString()))
            .orderBy(desc(gamificationLogs.createdAt))
            .limit(50);

        return NextResponse.json(logs);
    } catch (err: any) {
        console.error('[Admin Gamification Logs GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
