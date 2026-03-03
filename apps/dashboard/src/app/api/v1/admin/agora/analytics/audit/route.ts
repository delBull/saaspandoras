import { NextResponse } from 'next/server';
import { db } from '@/db';
import { actionLogs } from '@/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';

/**
 * GET /api/v1/admin/agora/analytics/audit
 * FASE 4B: Institutional Analytics - Settlement Integrity Monitor
 * 
 * Extracts raw Action Logs specifically for SETTLEMENT_EXECUTED and EARLY_EXIT_EXECUTED
 * to display atomic operation history, correlation hashes and metadata dissecction.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const protocolIdStr = searchParams.get('protocolId');
        const limitStr = searchParams.get('limit') || '50';
        const offsetStr = searchParams.get('offset') || '0';

        if (!protocolIdStr) {
            return NextResponse.json({ success: false, error: 'Missing protocolId parameter' }, { status: 400 });
        }

        const protocolId = parseInt(protocolIdStr, 10);
        const limit = parseInt(limitStr, 10);
        const offset = parseInt(offsetStr, 10);

        const logs = await db.query.actionLogs.findMany({
            where: and(
                eq(actionLogs.protocolId, protocolId),
                inArray(actionLogs.actionType, ['SETTLEMENT_EXECUTED', 'EARLY_EXIT_EXECUTED'])
            ),
            orderBy: [desc(actionLogs.createdAt)],
            limit,
            offset,
            columns: {
                id: true,
                correlationId: true,
                actionType: true,
                artifactId: true,
                userId: true,
                metadata: true,
                createdAt: true
            }
        });

        return NextResponse.json({
            success: true,
            data: logs,
            pagination: {
                limit,
                offset,
                count: logs.length
            }
        });

    } catch (error: any) {
        console.error('[ADMIN_ANALYTICS] Error fetching audit logs:', error);
        return NextResponse.json({ success: false, error: 'Failed to retrieve settlement audit logs' }, { status: 500 });
    }
}
