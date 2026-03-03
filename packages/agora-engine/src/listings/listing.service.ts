import { Decimal } from 'decimal.js';
import { validatePriceBand } from '../price.validator';
import { ListingInvariantGuard } from '../common/invariant.guard';
import { INAVStorageAdapter } from '../nav.service';
import { IProtocolConfigAdapter } from '../governance/config.service';
import { CooldownValidator } from './cooldown.validator';

export interface IListingStorageAdapter {
    isArtifactOwnedBy(artifactId: string, userId: string): Promise<boolean>;
    getListingStatus(listingId: string): Promise<{ status: string; sellerId: string; artifactId: string } | null>;

    /**
     * Retrieves any active listings for the artifact (ACTIVE, LOCKED, ROFR_PENDING)
     */
    hasActiveListings(artifactId: string): Promise<boolean>;

    /**
     * Checks if the artifact is actively held by Pandoraas Treasury (HELD)
     */
    isArtifactInTreasury(artifactId: string): Promise<boolean>;

    /**
     * Retrieves the timestamp the artifact was last manual-cancelled
     */
    getLastCancelledAt(artifactId: string): Promise<Date | null>;

    /**
     * Insert the listing and return its ID
     */
    createListing(protocolId: number, artifactId: string, sellerId: string, price: string): Promise<string>;

    /**
     * Modifies the listing to CANCELLED and marks the global Artifact `lastListingCancelledAt`
     */
    cancelListing(listingId: string, artifactId: string): Promise<void>;
}

export class ListingService {
    constructor(
        private readonly storage: IListingStorageAdapter,
        private readonly navStorage: INAVStorageAdapter,
        private readonly configStorage: IProtocolConfigAdapter
    ) { }

    /**
     * Phase 2A: Listings Engine (Intent)
     * Creates a new Active Listing evaluating all state, ownership, and cooldown invariants.
     */
    async createListing(
        protocolId: number,
        artifactId: string,
        sellerTelegramId: string,
        requestedPrice: string | number | Decimal
    ): Promise<{ success: boolean; listingId?: string; error?: string; remainingSeconds?: number }> {

        // 1. Governance Policy Evaluation
        const config = await this.configStorage.getActiveConfig(protocolId);
        if (config.settlementPaused) {
            throw new Error('MARKET_PAUSED: Market operations are temporarily suspended.');
        }

        // 2. Ownership & Treasury validations
        const [isOwner, inTreasury] = await Promise.all([
            this.storage.isArtifactOwnedBy(artifactId, sellerTelegramId),
            this.storage.isArtifactInTreasury(artifactId)
        ]);

        if (!isOwner) throw new Error('NOT_OWNER');
        if (inTreasury) throw new Error('TREASURY_RESERVED');

        // 3. Duplication Invariant
        const hasActive = await this.storage.hasActiveListings(artifactId);
        if (hasActive) throw new Error('ALREADY_LISTED');

        // 4. Cooldown Invariant (Micro-manipulation protection)
        const lastCancelledAt = await this.storage.getLastCancelledAt(artifactId);
        const cooldownCheck = CooldownValidator.validate(lastCancelledAt);
        if (!cooldownCheck.valid) {
            return {
                success: false,
                error: 'COOLDOWN_ACTIVE',
                remainingSeconds: cooldownCheck.remainingSeconds
            };
        }

        // 5. Price Band Mathematical Evaluation
        const snapshot = await this.navStorage.getLatestSnapshot(protocolId);
        if (!snapshot) throw new Error(`NAV snapshot not found for protocol ${protocolId}`);
        validatePriceBand(requestedPrice, snapshot.nav);

        // 6. Execution Insertion
        const priceString = new Decimal(requestedPrice).toFixed(8);
        const listingId = await this.storage.createListing(protocolId, artifactId, sellerTelegramId, priceString);

        return { success: true, listingId };
    }

    /**
     * Cancels an Active Listing and registers the Cooldown activation timestamp.
     * Modifies neither NAV nor Treasury balances.
     */
    async cancelListing(listingId: string, callerTelegramId: string): Promise<void> {
        const listing = await this.storage.getListingStatus(listingId);
        if (!listing) throw new Error('NOT_FOUND');
        if (listing.sellerId !== callerTelegramId) throw new Error('NOT_OWNER');

        ListingInvariantGuard.validateCancellation(listing.sellerId === callerTelegramId, listing.status);

        await this.storage.cancelListing(listingId, listing.artifactId);
    }
}
