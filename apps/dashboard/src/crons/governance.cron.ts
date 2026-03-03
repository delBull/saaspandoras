import { db } from '@/db';
import { GovernanceService } from '@pandoras/agora-engine';
import { DrizzleGovernanceStorageAdapter } from '@/agora-adapters/drizzle.governance.adapter';

/**
 * Periodically promotes time-locked configuration proposals to active configurations.
 */
export async function runGovernanceCron() {
    console.log('[CRON:GOVERNANCE] Checking for pending configuration updates');

    const storageAdapter = new DrizzleGovernanceStorageAdapter();
    const governanceService = new GovernanceService(storageAdapter);

    try {
        const processedCount = await governanceService.processPendingConfigs();
        if (processedCount > 0) {
            console.log(`[CRON:GOVERNANCE] Successfully applied ${processedCount} configuration updates.`);
        }
    } catch (error: any) {
        console.error('[CRON:GOVERNANCE] Fatal error:', error.message);
    }
}
