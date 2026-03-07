import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, protocolNavs, actionLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NAVService, INAVStorageAdapter, ProtocolState } from '@pandoras/agora-engine';
import { getPriceBands } from '@pandoras/agora-engine';
import { Decimal } from 'decimal.js';

import { DrizzleNAVStorageAdapter } from '@/crons/nav.cron';

// Singleton instantiation
const navStorageAdapter = new DrizzleNAVStorageAdapter();
const navService = new NAVService(navStorageAdapter);

export async function GET(
    request: Request,
    { params }: { params: Promise<{ protocolId: string }> }
) {
    let pIdString = 'unknown';
    try {
        const { protocolId: pId } = await params;
        pIdString = pId;
        const protocolId = parseInt(pId, 10);

        if (isNaN(protocolId)) {
            return NextResponse.json({ error: 'Invalid protocol ID' }, { status: 400 });
        }

        // Attempt to fetch the latest snapshot
        const snapshot = await navService.getLatestPersistedNAV(protocolId);

        return NextResponse.json(snapshot);

    } catch (error: any) {
        console.error(`[API] GET /internal/nav/${pIdString} Error:`, error);

        if (error.message.includes('No NAV snapshot found')) {
            return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
