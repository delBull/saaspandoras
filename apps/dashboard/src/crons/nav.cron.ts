import { db } from '@/db';
import { projects, protocolNavs, actionLogs } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { NAVService } from '@pandoras/agora-engine';
import type { INAVStorageAdapter, ProtocolState } from '@pandoras/agora-engine';
import { getPriceBands } from '@pandoras/agora-engine';
import { v4 as uuidv4 } from 'uuid';

export class DrizzleNAVStorageAdapter implements INAVStorageAdapter {
    async getLiveProtocolState(protocolId: number): Promise<ProtocolState> {
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, protocolId),
            columns: {
                raisedAmount: true,
                totalTokens: true,
            },
        });

        if (!project) {
            throw new Error(`Protocol ${protocolId} not found`);
        }

        const treasury = project.raisedAmount || '0';
        const supply = project.totalTokens || 0;

        return { treasury, supply };
    }

    async saveSnapshot(protocolId: number, nav: string, treasury: string, supply: number): Promise<void> {
        const { minPrice, maxPrice } = getPriceBands(nav);

        await db.insert(protocolNavs).values({
            protocolId,
            nav,
            treasury,
            supply,
            minPrice: minPrice.toFixed(8),
            maxPrice: maxPrice.toFixed(8),
        });
    }

    async logAction(correlationId: string, actionType: string, protocolId: number, metadata: Record<string, any>): Promise<void> {
        await db.insert(actionLogs).values({
            correlationId,
            actionType,
            protocolId,
            metadata,
        });
    }

    async getLatestSnapshot(protocolId: number) {
        const snapshot = await db.query.protocolNavs.findFirst({
            where: eq(protocolNavs.protocolId, protocolId),
            orderBy: [desc(protocolNavs.createdAt)],
        });

        if (!snapshot) return null;

        const { minPrice, maxPrice } = getPriceBands(snapshot.nav);

        return {
            nav: snapshot.nav.toString(),
            treasury: snapshot.treasury.toString(),
            supply: snapshot.supply,
            minPrice: minPrice.toFixed(8),
            maxPrice: maxPrice.toFixed(8),
            updatedAt: snapshot.createdAt.toISOString(),
        };
    }
}

/**
 * Automates NAV calculations for all active protocols.
 * To be run via cron (e.g., every 10 mins).
 */
export async function executeNavSnapshots() {
    console.log('[CRON:NAV] Starting automated NAV snapshots across all protocols');
    const correlationId = `CRON_NAV_${uuidv4()}`;

    const navStorageAdapter = new DrizzleNAVStorageAdapter();
    const navService = new NAVService(navStorageAdapter);

    try {
        // 1. Fetch only active protocols holding liquidity
        const activeProjects = await db.query.projects.findMany({
            where: inArray(projects.status, ['active_client', 'approved']),
            columns: { id: true }
        });

        console.log(`[CRON:NAV] Found ${activeProjects.length} active protocols to process.`);

        let successCount = 0;
        let failCount = 0;

        // 2. Process each project systematically
        for (const project of activeProjects) {
            try {
                const generatedNav = await navService.calculateAndSnapshotNAV(project.id, correlationId);
                console.log(`[CRON:NAV] Evaluated Protocol ${project.id} -> NAV: ${generatedNav}`);
                successCount++;
            } catch (err: any) {
                console.error(`[CRON:NAV] Error processing Protocol ${project.id}:`, err.message);
                failCount++;
                // Do not break the loop to allow other protocols to succeed
            }
        }

        console.log(`[CRON:NAV] Finished. Success: ${successCount}, Failed: ${failCount}`);
    } catch (globalError) {
        console.error('[CRON:NAV] FATAL Crash executing NAV snapshots:', globalError);
    }
}
