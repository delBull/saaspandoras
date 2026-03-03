import { Decimal } from 'decimal.js';
import { IProtocolConfigAdapter } from '../governance/config.service';
import { INAVStorageAdapter } from '../nav.service';
import { logger } from '../common/logger';

export interface IEarlyExitStorageAdapter {
    executeAtomicExit<T>(callback: (tx: any) => Promise<T>): Promise<T>;

    /**
     * Proves the caller is the legitimate owner.
     */
    verifyOwnership(tx: any, artifactId: string, sellerId: string): Promise<boolean>;

    /**
     * Validates that the Pandoraas treasury (`availableCapital` in `pandora_buyback_pools`)
     * holds enough unreserved stablecoin to fulfill the penalty exit payout.
     */
    hasAvailableCapital(tx: any, protocolId: number, requiredPayout: string): Promise<boolean>;

    /**
     * Reduces the available capital and credits the User's balance.
     */
    processExitPayout(tx: any, protocolId: number, sellerId: string, payout: string): Promise<void>;

    /**
     * Transfers ownership to 'PANDORAS_INTERNAL' and sets inventory status to 'HELD'
     */
    confiscateArtifact(tx: any, protocolId: number, artifactId: string): Promise<void>;

    /**
     * Generates a buyback transaction receipt for institutional audits
     */
    logExitTransaction(tx: any, correlationId: string, protocolId: number, artifactId: string, payout: string): Promise<void>;

    /**
     * Updates global Circulating Supply via trigger / manual update post transaction.
     * Note: The execution adapter handles the supply reduction.
     */
    triggerNAVSnapshot(protocolId: number, correlationId: string): Promise<void>;
}

export class EarlyExitService {
    constructor(
        private readonly storage: IEarlyExitStorageAdapter,
        private readonly navStorage: INAVStorageAdapter,
        private readonly configStorage: IProtocolConfigAdapter
    ) { }

    /**
     * Executes a FASE 2C Early Exit liquidation.
     * It enforces the current NAV snapshot and the dynamic institutional penalty rate.
     */
    async executeEarlyExit(protocolId: number, artifactId: string, sellerId: string, correlationId: string): Promise<void> {

        // 1. Fetch current Governance state (Outside DB TX)
        const config = await this.configStorage.getActiveConfig(protocolId);
        if (config.settlementPaused) {
            throw new Error('MARKET_PAUSED: Liquidity exits are currently suspended.');
        }

        // 2. Fetch trailing NAV snapshot for calculation
        const snapshot = await this.navStorage.getLatestSnapshot(protocolId);
        if (!snapshot) throw new Error('Protocol NAV Snapshot missing.');

        // 3. Abstract Penalty Computation
        // e.g. NAV $100 * (1 - 0.15) = Payout $85.
        const penaltyRate = new Decimal(config.earlyExitPenalty);
        const retainedMultiplier = new Decimal(1).minus(penaltyRate);
        const payoutPrice = new Decimal(snapshot.nav).mul(retainedMultiplier).toFixed(8);

        await this.storage.executeAtomicExit(async (tx) => {
            // 4. Validate Asset Ownership logically (Can use Lock mechanism inside via adapters)
            const isOwner = await this.storage.verifyOwnership(tx, artifactId, sellerId);
            if (!isOwner) throw new Error('NOT_OWNER');

            // 5. Verify Liquidity
            const hasCapital = await this.storage.hasAvailableCapital(tx, protocolId, payoutPrice);
            if (!hasCapital) throw new Error('INSUFFICIENT_TREASURY_LIQUIDITY');

            // 6. Execute Payments
            await this.storage.processExitPayout(tx, protocolId, sellerId, payoutPrice);

            // 7. Confiscate Artifact physically (To HELD state)
            await this.storage.confiscateArtifact(tx, protocolId, artifactId);

            // 8. Log the Liquidation mathematically
            await this.storage.logExitTransaction(tx, correlationId, protocolId, artifactId, payoutPrice);
        });

        // 9. Acknowledge Circulating Supply Mutation & Snapshot
        // When the artifact entered HELD state, circulating supply dropped by 1.
        // By re-triggering the NAV calculation here, the NAV mathematical model automatically stabilizes.
        await this.storage.triggerNAVSnapshot(protocolId, correlationId);

        logger.info('EARLY_EXIT_EXECUTED', {
            correlationId,
            protocolId,
            data: { artifactId, sellerId, payoutPrice }
        });
    }
}
