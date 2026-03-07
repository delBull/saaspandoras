import { Decimal } from 'decimal.js';
import { logger } from '../common/logger';
import { IProtocolConfigAdapter } from '../governance/config.service';

export interface IBuybackStorageAdapter {
    executeAtomicBuyback<T>(callback: (tx: any) => Promise<T>): Promise<T>;
    lockListing(tx: any, listingId: string): Promise<{
        protocolId: number;
        artifactId: string;
        sellerId: string;
        price: string;
    } | null>;
    hasAvailableCapital(tx: any, protocolId: number, amount: string): Promise<boolean>;
    executeBuybackPayment(tx: any, protocolId: number, sellerId: string, amount: string): Promise<void>;
    getBuybackPool(protocolId: number): Promise<{ availableCapital: string }>;
    transferToTreasury(tx: any, artifactId: string, listingId: string): Promise<void>;
    logBuyback(tx: any, correlationId: string, protocolId: number, artifactId: string, price: string): Promise<void>;
}

export interface IMarketDiscoveryAdapter {
    findUndervaluedListings(protocolId: number, minPrice: string): Promise<any[]>;
}

export class BuybackService {
    constructor(
        private readonly storage: IBuybackStorageAdapter,
        private readonly discovery: IMarketDiscoveryAdapter,
        private readonly configStorage: IProtocolConfigAdapter
    ) { }

    /**
     * High-level orchestration for ROFR (Right of First Refusal).
     * Scans for undervalued listings and buys them on behalf of the protocol.
     */
    async processUndervaluedListings(protocolId: number, minPrice: string, correlationId: string): Promise<number> {
        // --- HARDENING: Kill-Switch Transversality ---
        const activeConfig = await this.configStorage.getActiveConfig(protocolId);
        if (activeConfig.settlementPaused) {
            logger.warn('BUYBACK_SKIPPED_MARKET_PAUSED', { correlationId, protocolId });
            return 0;
        }

        // Dynamic Treasury Allocation Rule:
        // buybackAllocationRatio defines what % of the available pool can be used for a single batch
        // or the total limit for this run.
        const allocationLimit = activeConfig.buybackAllocationRatio;

        const opportunities = await this.discovery.findUndervaluedListings(protocolId, minPrice);

        // --- HARDENING: Treasury Rule ---
        // If allocationLimit < 1.0, we only process up to that % of available capital
        // This prevents draining the entire pool in one go if not desired.
        // For now, it's a informational check or can be used to slice opportunities.
        const pool = await this.storage.getBuybackPool(protocolId);
        const maxSpendForBatch = parseFloat(pool.availableCapital) * allocationLimit;

        let processed = 0;
        let batchTotalSpend = 0;

        for (const listing of opportunities) {
            const price = parseFloat(listing.price);
            if (batchTotalSpend + price > maxSpendForBatch) {
                logger.info('BUYBACK_BATCH_LIMIT_REACHED', {
                    correlationId,
                    protocolId,
                    data: {
                        batchTotalSpend,
                        maxSpendForBatch,
                        allocationLimit
                    }
                });
                break;
            }

            try {
                await this.executeSingleBuyback(listing.id, correlationId);
                processed++;
                batchTotalSpend += price;
            } catch (error: any) {
                // --- HARDENING: Idempotency & Resiliency ---
                // Log failure but do not break the high-frequency sweep
                logger.error('BUYBACK_ITEM_FAILED', {
                    correlationId,
                    protocolId,
                    data: { listingId: listing.id, error: error.message }
                });
            }
        }

        if (processed > 0) {
            logger.info('BUYBACK_BATCH_COMPLETED', {
                correlationId,
                protocolId,
                data: { processed, totalOpportunities: opportunities.length }
            });
        }

        return processed;
    }

    private async executeSingleBuyback(listingId: string, correlationId: string): Promise<void> {
        await this.storage.executeAtomicBuyback(async (tx: any) => {
            // 1. Lock and validate listing
            const listing = await this.storage.lockListing(tx, listingId);
            if (!listing) throw new Error('Listing no longer available or not active');

            // 2. Validate Capital Availability
            const hasCapital = await this.storage.hasAvailableCapital(tx, listing.protocolId, listing.price);
            if (!hasCapital) throw new Error('Insufficient protocol capital for buyback');

            // 3. Process Financials
            await this.storage.executeBuybackPayment(tx, listing.protocolId, listing.sellerId, listing.price);

            // 4. Transfer Ownership
            await this.storage.transferToTreasury(tx, listing.artifactId, listingId);

            // 5. Audit Log
            await this.storage.logBuyback(tx, correlationId, listing.protocolId, listing.artifactId, listing.price);
        });
    }
}
