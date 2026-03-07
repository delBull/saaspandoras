import { NextResponse } from 'next/server';
import { SettlementService } from '@pandoras/agora-engine';
import { DrizzleSettlementStorageAdapter } from '@/agora-adapters/drizzle.settlement.adapter';
import { DrizzleNAVStorageAdapter } from '@/crons/nav.cron';
import { DrizzleProtocolConfigAdapter } from '@/agora-adapters/drizzle.config.adapter';
import crypto from 'crypto';

/**
 * POST /api/v1/internal/agora/settlements
 * Core Phase 2B Atomic Engine Hook
 * 
 * Invokes the atomic DB operation to lock listing, validate, transfer funds,
 * calculate fees, transfer ownership, emit action logs, and mark status SOLD.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { listingId, buyerId } = body;

        if (!listingId || !buyerId) {
            return NextResponse.json({ success: false, error: 'Missing listingId or buyerId' }, { status: 400 });
        }

        const correlationId = `SETTLE_${crypto.randomUUID()}`;

        const settlementAdapter = new DrizzleSettlementStorageAdapter();
        const navAdapter = new DrizzleNAVStorageAdapter();
        const configAdapter = new DrizzleProtocolConfigAdapter();

        const settlementService = new SettlementService(
            settlementAdapter,
            navAdapter,
            configAdapter
        );

        await settlementService.executeSettlement(listingId, buyerId, correlationId);

        return NextResponse.json({
            success: true,
            correlationId,
            message: 'Settlement executed successfully within an atomic transaction.'
        });
    } catch (error: any) {
        console.error('[API_AGORA_SETTLEMENT] Settlement execution failed:', error.message);

        let status = 500;
        if (error.message.includes('not found')) status = 404;
        else if (error.message.includes('MARKET_PAUSED')) status = 503;
        else if (error.message.includes('OUT_OF_BAND')) status = 409;
        else if (error.message.includes('INVALID_STATUS')) status = 409;
        else if (error.message.includes('INSUFFICIENT_FUNDS')) status = 402;
        else if (error.message.includes('NOT_OWNER')) status = 409; // Changed hands before lock

        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
