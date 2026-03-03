import { NextResponse } from 'next/server';
import { db } from '@/db';
import { protocolNavs } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

/**
 * GET /api/v1/admin/agora/analytics/nav-history
 * FASE 4A: Institutional Analytics - Protocol Overview
 * 
 * Returns the raw, immutable history of the NAV mathematically calculated over time
 * for a specific protocol. Bypasses caching for maximum consistency.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const protocolIdStr = searchParams.get('protocolId');
        const timeframe = searchParams.get('timeframe') || '30d'; // '7d', '30d', 'all'

        if (!protocolIdStr) {
            return NextResponse.json({ success: false, error: 'Missing protocolId parameter' }, { status: 400 });
        }

        const protocolId = parseInt(protocolIdStr, 10);
        const conditions = [];
        conditions.push(eq(protocolNavs.protocolId, protocolId));

        // Timeframe filtering
        if (timeframe !== 'all') {
            const daysStr = timeframe.replace('d', '');
            const days = parseInt(daysStr, 10);
            if (!isNaN(days)) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - days);
                conditions.push(gte(protocolNavs.createdAt, dateLimit));
            }
        }

        const history = await db.query.protocolNavs.findMany({
            where: and(...conditions),
            orderBy: [desc(protocolNavs.createdAt)],
            columns: {
                id: true,
                nav: true,
                treasury: true,
                supply: true,
                minPrice: true,
                maxPrice: true,
                createdAt: true
            }
        });

        return NextResponse.json({
            success: true,
            data: history
        });

    } catch (error: any) {
        console.error('[ADMIN_ANALYTICS] Error fetching NAV history:', error);
        return NextResponse.json({ success: false, error: 'Failed to retrieve NAV history' }, { status: 500 });
    }
}
