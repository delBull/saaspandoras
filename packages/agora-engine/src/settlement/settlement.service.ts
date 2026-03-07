import { SettlementInvariantGuard } from '../common/settlement.guard';
import { FeeService } from './fee.service';
import { INAVStorageAdapter } from '../nav.service';
import { IProtocolConfigAdapter } from '../governance/config.service';
import { logger } from '../common/logger';

export interface ISettlementStorageAdapter {
    executeAtomicSettlement<T>(callback: (tx: any) => Promise<T>): Promise<T>;

    lockListingForUpdate(tx: any, listingId: string): Promise<{
        protocolId: number;
        artifactId: string;
        sellerId: string;
        price: string;
        status: string;
        lockedAt: Date | null;
    } | null>;

    verifyOwnership(tx: any, artifactId: string, sellerId: string): Promise<boolean>;
    getUserBalance(tx: any, userId: string): Promise<string>;
    transferFunds(tx: any, buyerId: string, sellerId: string, amountToBuyer: string, amountToSeller: string, platformFee: string): Promise<void>;
    transferOwnership(tx: any, artifactId: string, newOwnerId: string): Promise<void>;
    markListingSold(tx: any, listingId: string): Promise<void>;
    logAction(tx: any, correlationId: string, actionType: string, protocolId: number, metadata: Record<string, any>): Promise<void>;
}

export class SettlementService {
    constructor(
        private readonly storage: ISettlementStorageAdapter,
        private readonly navStorage: INAVStorageAdapter,
        private readonly configStorage: IProtocolConfigAdapter
    ) { }

    /**
     * Phase 2B: Atomic Settlement Engine
     * Executes the strict flow bounded by Governance Config and snapshots.
     */
    async executeSettlement(listingId: string, buyerId: string, correlationId: string): Promise<void> {

        // 0. Abstracted Governance Evaluation (Non-tx block context reads)
        // Actually, config might be better read outside the transaction so we don't hold the lock if it's paused.
        // However, DB adapters can route this carefully. Assuming outer read:

        await this.storage.executeAtomicSettlement(async (tx) => {
            // 1. SELECT listing FOR UPDATE
            const listing = await this.storage.lockListingForUpdate(tx, listingId);
            if (!listing) throw new Error('Listing not found');

            // 1.5 Governance Circuit Breaker Check directly against DB live state via configStorage adapter config (could be passed the tx context)
            const protocolConfig = await this.configStorage.getActiveConfig(listing.protocolId);
            if (protocolConfig.phase !== 'defense') {
                throw new Error('SECONDARY_MARKET_INACTIVE: Settlements are only allowed in the Defense phase.');
            }
            if (protocolConfig.settlementPaused) {
                throw new Error('MARKET_PAUSED: Settlements are currently suspended by institutional governance.');
            }

            // 2. Validate status === ACTIVE & Not already locked
            SettlementInvariantGuard.validateListingState(listing.status, listing.lockedAt);

            const snapshot = await this.navStorage.getLatestSnapshot(listing.protocolId);
            if (!snapshot) throw new Error('Protocol Snapshot not found');

            // 4. Validate price vs historical snapshot
            SettlementInvariantGuard.validateSettlementPriceBand(listing.price, snapshot.minPrice, snapshot.maxPrice);

            // 3. Validate ownership BEFORE the transfer
            const isOwner = await this.storage.verifyOwnership(tx, listing.artifactId, listing.sellerId);
            SettlementInvariantGuard.validateOwnership(isOwner);

            // 5. Validate buyer balance >= price
            const buyerBalance = await this.storage.getUserBalance(tx, buyerId);
            SettlementInvariantGuard.validateBuyerBalance(buyerBalance, listing.price);

            // 6. Dynamic Fee Execution depending on Active Governance Rules!
            const feeData = FeeService.calculate(listing.price, protocolConfig.feeRate);

            // 7, 8, 9. Route Balances with zero-sum assurance
            await this.storage.transferFunds(
                tx,
                buyerId,
                listing.sellerId,
                feeData.protocolPrice, // Debited from Buyer
                feeData.sellerReceives, // Added to Seller
                feeData.platformFee // Added to Corporative Governance Pool
            );

            // 10. Transfer ownership internally
            await this.storage.transferOwnership(tx, listing.artifactId, buyerId);

            // 11. Finalize listing
            await this.storage.markListingSold(tx, listingId);

            // 12. Institutional Logging attaching the Config Epoch
            const auditData = {
                listingId,
                buyerId,
                sellerId: listing.sellerId,
                artifactId: listing.artifactId,
                executionPrice: feeData.protocolPrice,
                feeCollected: feeData.platformFee,
                snapshotUsedNav: snapshot.nav,
                configEpochVersion: protocolConfig.versionEpoch
            };

            await this.storage.logAction(tx, correlationId, 'LISTING_SETTLEMENT_COMPLETED', listing.protocolId, auditData);

            // --- HARDENING: Structured JSON Logging ---
            logger.info('SETTLEMENT_EXECUTED', {
                correlationId,
                protocolId: listing.protocolId,
                data: auditData
            });
        });

        // 14. Outside Transaction: DB triggers cron or NavService manually to cross-check trigger effects.
    }
}
