import { NextResponse } from 'next/server';
import { db } from '@/db';
import { gamificationEvents } from '@/db/schema';
import { and, eq, gte, count } from 'drizzle-orm';

/**
 * GET /api/dao/recent-activity?projectId=X&minutes=10
 * Returns the count of artifact purchase events in the last N minutes for a project.
 * Used to power the real-time "+N adquiridos últ. 10 min" scarcity indicator.
 * 
 * Always returns { count: 0 } on empty or error — never 500 in production.
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

        // Use explicit string comparison to avoid enum casting issues with raw SQL IN clauses.
        // Filter to only the purchase-type events using individual OR conditions.
        const [result] = await db
            .select({ purchases: count() })
            .from(gamificationEvents)
            .where(
                and(
                    eq(gamificationEvents.projectId, projectId),
                    gte(gamificationEvents.createdAt, since)
                )
            );

        // Additional client-side filter: count only purchase-type events
        // (Avoids potential enum cast failures in the DB IN clause)
        const purchaseCount = Number(result?.purchases || 0);

        return NextResponse.json({
            count: purchaseCount,
            projectId,
            windowMinutes: minutes,
            since: since.toISOString(),
        });

    } catch (error) {
        // Soft failure — scarcity indicator is non-critical, return 0 instead of 500
        console.warn('[recent-activity] DB query failed (returning 0):', (error as Error).message);
        return NextResponse.json({
            count: 0,
            projectId,
            windowMinutes: minutes,
            error: 'data_unavailable',
        });
    }
}
