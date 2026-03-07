import { NextResponse } from 'next/server';
import { EarlyExitService } from '@pandoras/agora-engine';
import { DrizzleEarlyExitStorageAdapter } from '@/agora-adapters/drizzle.early-exit.adapter';
import { DrizzleNAVStorageAdapter } from '@/crons/nav.cron';
import { DrizzleProtocolConfigAdapter } from '@/agora-adapters/drizzle.config.adapter';
import crypto from 'crypto';

/**
 * POST /api/v1/internal/agora/early-exit
 * Core Phase 2C Liquidation Hook
 * 
 * Invokes the atomic DB operation to burn/liquidate an artifact to the Pandora Treasury,
 * enforcing dynamic Governance penalties and restoring market sanity implicitly.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { protocolId, artifactId, sellerId } = body;

        if (!protocolId || !artifactId || !sellerId) {
            return NextResponse.json({ success: false, error: 'Missing protocolId, artifactId or sellerId' }, { status: 400 });
        }

        const correlationId = `EARLY_EXIT_${crypto.randomUUID()}`;

        const earlyExitAdapter = new DrizzleEarlyExitStorageAdapter();
        const navAdapter = new DrizzleNAVStorageAdapter();
        const configAdapter = new DrizzleProtocolConfigAdapter();

        const earlyExitService = new EarlyExitService(
            earlyExitAdapter,
            navAdapter,
            configAdapter
        );

        // Provide the dynamic parsing for numerical stability if the user inputted a string
        await earlyExitService.executeEarlyExit(parseInt(protocolId, 10), artifactId, sellerId, correlationId);

        return NextResponse.json({
            success: true,
            correlationId,
            message: 'Liquidated via Early Exit successfully within an atomic transaction. Circulating Supply decreased and NAV calculation re-triggered.'
        });
    } catch (error: any) {
        console.error('[API_EARLY_EXIT] Execution failed:', error.message);

        let status = 500;
        if (error.message.includes('not found') || error.message.includes('missing')) status = 404;
        else if (error.message.includes('MARKET_PAUSED')) status = 503;
        else if (error.message.includes('INSUFFICIENT_TREASURY_LIQUIDITY')) status = 409;
        else if (error.message.includes('NOT_OWNER')) status = 403;

        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
