import { Decimal } from 'decimal.js';

export class SettlementInvariantGuard {

    /**
     * Evaluates if a listing is eligible to be settled.
     * Ensures the listing is ACTIVE and not locked by a concurrent transaction.
     * @throws Error on invariant violation.
     */
    static validateListingState(status: string, lockedAt: string | null | Date, lockGraceMs = 30000): void {
        if (status !== 'ACTIVE') {
            throw new Error(`Settlement rejected: Listing is ${status}`);
        }

        // Optimistic Lock Check (Double Spend Protection Level 1)
        if (lockedAt) {
            const lockTime = new Date(lockedAt).getTime();
            const now = new Date().getTime();

            if (now - lockTime < lockGraceMs) {
                throw new Error('Settlement rejected: Listing is already locked by another pending transaction. Please wait.');
            }
        }
    }

    /**
     * Protects the seller by ensuring the dynamic NAV hasn't broken the price band 
     * since the time the listing was created.
     * If the user listed at $10, and NAV dropped meaning Max Price is now $9, it should abort.
     * 
     * NOTE: We evaluate against the *current* persisted NAV snapshot, not the old ones.
     */
    static validateSettlementPriceBand(price: string | number | Decimal, minNavPrice: string, maxNavPrice: string): void {
        const p = new Decimal(price);
        const min = new Decimal(minNavPrice);
        const max = new Decimal(maxNavPrice);

        if (p.lt(min) || p.gt(max)) {
            throw new Error(`Settlement rejected: Economic conditions changed. Price ${p.toFixed(8)} is now outside the active band [${min.toFixed(8)} - ${max.toFixed(8)}].`);
        }
    }

    /**
     * Ensures the buyer has sufficient internal platform balance.
     */
    static validateBuyerBalance(balanceOffchain: string | number | Decimal, price: string | number | Decimal): void {
        const bal = new Decimal(balanceOffchain);
        const cost = new Decimal(price);

        if (bal.lt(cost)) {
            throw new Error(`Settlement rejected: Insufficient platform funds. Required ${cost.toFixed(2)}, Available: ${bal.toFixed(2)}.`);
        }
    }

    /**
     * Ensures the seller continues to be the owner of the artifact.
     * (E.g. They didn't transfer it externally while the listing was active)
     */
    static validateOwnership(isOwner: boolean): void {
        if (!isOwner) {
            throw new Error('Settlement rejected: Seller no longer owns the artifact.');
        }
    }
}
