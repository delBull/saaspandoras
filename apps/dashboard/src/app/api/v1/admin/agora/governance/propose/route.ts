import { NextResponse } from 'next/server';
import { db } from '@/db';
import { protocolConfigQueues, protocolConfigs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * POST /api/v1/admin/agora/governance/propose
 * Proposes a new monetary policy configuration with a time-delay.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            protocolId,
            feeRate,
            inventoryMaxRatio,
            earlyExitPenalty,
            buybackAllocationRatio,
            settlementPaused,
            delayHours
        } = body;

        if (!protocolId || delayHours === undefined) {
            return NextResponse.json({ success: false, error: 'Missing protocolId or delayHours' }, { status: 400 });
        }

        const effectiveAt = new Date();
        const delay = parseInt(delayHours, 10);

        // --- HARDENING: Governance Delay Enforcement ---
        const MIN_DELAY = 6;
        const MAX_DELAY = 72;

        // Emergency Exception: 0h allowed ONLY if settlementPaused: true is the ONLY change
        const isEmergencyPause = delay === 0 &&
            settlementPaused === true &&
            feeRate === undefined &&
            inventoryMaxRatio === undefined &&
            earlyExitPenalty === undefined;

        if (!isEmergencyPause) {
            if (delay < MIN_DELAY || delay > MAX_DELAY) {
                return NextResponse.json({
                    success: false,
                    error: `Governance delay must be between ${MIN_DELAY}h and ${MAX_DELAY}h (except for emergency pause).`
                }, { status: 400 });
            }
        }

        // --- HARDENING: Stacking Block ---
        const existingPending = await db.query.protocolConfigQueues.findFirst({
            where: (q, { and, eq }) => and(
                eq(q.protocolId, parseInt(protocolId, 10)),
                eq(q.status, 'PENDING')
            )
        });

        if (existingPending) {
            return NextResponse.json({
                success: false,
                error: `A proposal for this protocol is already PENDING (${existingPending.id}). Execute or Cancel it before proposing again.`
            }, { status: 400 });
        }

        effectiveAt.setHours(effectiveAt.getHours() + delay);

        // Create the queue entry
        const results = await db.insert(protocolConfigQueues).values({
            protocolId: parseInt(protocolId, 10),
            proposedFeeRate: feeRate !== undefined ? String(feeRate) : null,
            proposedInventoryMaxRatio: inventoryMaxRatio !== undefined ? String(inventoryMaxRatio) : null,
            proposedEarlyExitPenalty: earlyExitPenalty !== undefined ? String(earlyExitPenalty) : null,
            proposedBuybackAllocationRatio: buybackAllocationRatio !== undefined ? String(buybackAllocationRatio) : null,
            proposedSettlementPaused: settlementPaused !== undefined ? settlementPaused : null,
            effectiveAt,
            status: 'PENDING',
            proposedBy: 'ADMIN_DASHBOARD'
        }).returning();

        const newItem = results[0];

        return NextResponse.json({
            success: true,
            data: newItem,
            message: `Proposal queued. Effective at ${effectiveAt.toISOString()}`
        });
    } catch (error: any) {
        console.error('[GOVERNANCE_PROPOSE] Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
