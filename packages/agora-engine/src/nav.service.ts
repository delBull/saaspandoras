import { Decimal } from 'decimal.js';
import { calculateNAV } from './nav.calculator';
import { logger } from './common/logger';

export interface ProtocolState {
    treasury: Decimal | string | number;
    supply: number;
}

export interface INAVStorageAdapter {
    /**
     * Fetches the current live treasury and circulating supply for a protocol.
     */
    getLiveProtocolState(protocolId: number): Promise<ProtocolState>;

    /**
     * Persists a new NAV calculation snapshot into the database.
     */
    saveSnapshot(
        protocolId: number,
        nav: string,
        treasury: string,
        supply: number
    ): Promise<void>;

    /**
     * Logs an action to the institutional audit table (`action_logs`).
     */
    logAction(
        correlationId: string,
        actionType: string,
        protocolId: number,
        metadata: Record<string, any>
    ): Promise<void>;

    /**
     * Retrieves the latest persisted NAV snapshot.
     */
    getLatestSnapshot(protocolId: number): Promise<{ nav: string; treasury: string; supply: number; minPrice: string; maxPrice: string; updatedAt: string } | null>;
}

export class NAVService {
    constructor(private readonly storage: INAVStorageAdapter) { }

    /**
     * Calculates the NAV from live treasury state, persists a snapshot, and logs the action.
     * This should be called by a Cron job or event-driven hook (e.g., after early exit or supply change).
     */
    async calculateAndSnapshotNAV(protocolId: number, correlationId: string): Promise<string> {
        const state = await this.storage.getLiveProtocolState(protocolId);

        // --- HARDENING: Supply = 0 Security ---
        if (state.supply <= 0) {
            logger.critical('NAV_CALCULATION_FAILED_ZERO_SUPPLY', {
                correlationId,
                protocolId,
                data: { treasury: state.treasury, supply: state.supply }
            });
            return "0.00000000"; // Return 0 if no artifacts exist
        }

        // Core pure math execution
        const navDec = calculateNAV(state.treasury, state.supply);
        const navString = navDec.toFixed(8);
        const treasuryString = new Decimal(state.treasury).toFixed(8);

        // Fetch previous for audit context
        const previous = await this.storage.getLatestSnapshot(protocolId);

        // Persist snapshot
        await this.storage.saveSnapshot(protocolId, navString, treasuryString, state.supply);

        // Log institutional action
        await this.storage.logAction(correlationId, 'NAV_SNAPSHOT_GENERATED', protocolId, {
            previousNAV: previous?.nav || '0',
            newNAV: navString,
            treasury: treasuryString,
            supply: state.supply,
        });

        return navString;
    }

    /**
     * Consumes the latest persisted snapshot to serve internal pricing APIs securely
     * without recalculating on the fly.
     */
    async getLatestPersistedNAV(protocolId: number) {
        const snapshot = await this.storage.getLatestSnapshot(protocolId);
        if (!snapshot) {
            throw new Error(`No NAV snapshot found for protocol ${protocolId}`);
        }
        return snapshot;
    }
}
