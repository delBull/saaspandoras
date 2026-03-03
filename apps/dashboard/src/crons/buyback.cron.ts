import { db } from '@/db';
import { projects, protocolNavs } from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { BuybackService } from '@pandoras/agora-engine';
import { DrizzleBuybackStorageAdapter } from '@/agora-adapters/drizzle.buyback.adapter';
import { DrizzleMarketDiscoveryAdapter } from '@/agora-adapters/drizzle.discovery.adapter';
import { DrizzleProtocolConfigAdapter } from '@/agora-adapters/drizzle.config.adapter';
import { v4 as uuidv4 } from 'uuid';

/**
 * High-frequency job to detect and act on ROFR (Right of First Refusal) opportunities.
 * Runs independently for each active protocol.
 */
export async function executeBuybackJobs() {
    console.log('[CRON:BUYBACK] Starting automated ROFR sweep');
    const correlationId = `CRON_BUYBACK_${uuidv4()}`;

    const buybackAdapter = new DrizzleBuybackStorageAdapter();
    const discoveryAdapter = new DrizzleMarketDiscoveryAdapter();
    const configAdapter = new DrizzleProtocolConfigAdapter();
    const buybackService = new BuybackService(buybackAdapter, discoveryAdapter, configAdapter);

    try {
        // 1. Fetch active projects
        const activeProjects = await db.query.projects.findMany({
            where: inArray(projects.status, ['active_client', 'approved']),
            columns: { id: true }
        });

        for (const project of activeProjects) {
            try {
                // 2. Get latest NAV to find the floor price (minPrice)
                const latestNav = await db.query.protocolNavs.findFirst({
                    where: eq(protocolNavs.protocolId, project.id),
                    orderBy: [desc(protocolNavs.createdAt)]
                });

                if (!latestNav) {
                    console.warn(`[CRON:BUYBACK] No NAV snapshot for Protocol ${project.id}, skipping.`);
                    continue;
                }

                // 3. Process Undervalued Listings
                const buybackCount = await buybackService.processUndervaluedListings(
                    project.id,
                    latestNav.minPrice,
                    correlationId
                );

                if (buybackCount > 0) {
                    console.log(`[CRON:BUYBACK] Protocol ${project.id}: Successfully executed ${buybackCount} automated buybacks.`);
                }
            } catch (pErr: any) {
                console.error(`[CRON:BUYBACK] Error for Protocol ${project.id}:`, pErr.message);
            }
        }
    } catch (err: any) {
        console.error('[CRON:BUYBACK] Fatal error:', err.message);
    }
}
