export interface PendingConfigUpdate {
    queueId: string;
    protocolId: number;
    proposedFeeRate: string | number | null;
    proposedInventoryMaxRatio: string | number | null;
    proposedEarlyExitPenalty: string | number | null;
    proposedBuybackAllocationRatio: string | number | null;
    proposedSettlementPaused: boolean | null;
}

export interface IGovernanceStorageAdapter {
    /**
     * Retrieves config updates where effectiveAt <= NOW() and status = PENDING
     */
    getPendingExecutableConfigs(): Promise<PendingConfigUpdate[]>;

    /**
     * Transactionally applies the new configuration values to ProtocolConfig,
     * updates the Queue status to EXECUTED, and logs the Event.
     */
    executeConfigUpdate(update: PendingConfigUpdate): Promise<void>;
}

export class GovernanceService {
    constructor(private readonly storage: IGovernanceStorageAdapter) { }

    /**
     * Processes all pending time-locked configuration changes whose effective time has arrived.
     * This should be called by a repeating Cron job (e.g. every minute).
     */
    async processPendingConfigs(): Promise<number> {
        const pendingUpdates = await this.storage.getPendingExecutableConfigs();
        let processed = 0;

        for (const update of pendingUpdates) {
            try {
                await this.storage.executeConfigUpdate(update);
                processed++;
            } catch (error) {
                console.error(`Failed to execute governance update for queueId ${update.queueId}:`, error);
                // We continue processing others so one failure doesn't halt the whole governance layer
            }
        }

        return processed;
    }
}
