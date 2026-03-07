import { NextResponse } from 'next/server';
import { db } from '@/db';
import { protocolConfigs } from '@/db/schema';
import { sql } from 'drizzle-orm';

/**
 * POST /api/v1/admin/agora/emergency/pause-all
 * Emergency Global Kill-Switch used to pause all Agora settlements immediately.
 * Restricted to Super Admin in practice (Auth handled by middleware).
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { confirmed } = body;

        if (confirmed !== true) {
            return NextResponse.json({ success: false, error: 'Confirmation required' }, { status: 400 });
        }

        // Atomic update for ALL protocols
        const results = await db.update(protocolConfigs)
            .set({
                settlementPaused: true,
                updatedAt: new Date()
            })
            .returning();

        return NextResponse.json({
            success: true,
            count: results.length,
            message: `GLOBAL KILL-SWITCH ACTIVATED: ${results.length} protocols paused.`
        });
    } catch (error: any) {
        console.error('[EMERGENCY_GLOBAL_PAUSE] Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
