import { NextResponse } from 'next/server';
import { db } from '@/db';
import { gamificationEvents } from '@/db/schema';
import { and, eq, gte, count, sql } from 'drizzle-orm';

/**
 * GET /api/dao/recent-activity?projectId=X&minutes=10
 * Returns the count of artifact purchase events in the last N minutes for a project.
 * Used to power the real-time "+N adquiridos últ. 10 min" scarcity indicator.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectIdStr = searchParams.get('projectId');
    const minutesStr = searchParams.get('minutes') || '10';

    if (!projectIdStr) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const projectId = Number(projectIdStr);
    const minutes = Math.min(60, Math.max(1, Number(minutesStr) || 10));

    if (isNaN(projectId)) {
        return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
    }

    try {
        const since = new Date(Date.now() - minutes * 60 * 1000);

        const [result] = await db
            .select({ purchases: count() })
            .from(gamificationEvents)
            .where(
                and(
                    eq(gamificationEvents.projectId, projectId),
                    // Match artifact purchase event types
                    sql`${gamificationEvents.type} IN ('artifact_purchased', 'artifact_acquired', 'access_card_acquired')`,
                    gte(gamificationEvents.createdAt, since)
                )
            );

        const purchaseCount = Number(result?.purchases || 0);

        return NextResponse.json({
            count: purchaseCount,
            projectId,
            windowMinutes: minutes,
            since: since.toISOString(),
        });

    } catch (error) {
        console.error('[recent-activity] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
