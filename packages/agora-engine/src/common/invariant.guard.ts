import { Decimal } from 'decimal.js';

/**
 * Ensures a listing action complies with system constraints
 * completely isolated from database queries or runtime state.
 */
export class ListingInvariantGuard {

    /**
     * Validates if a user can create a listing based on inventory and duplication rules.
     * @param isOwner Does the seller own the artifact currently?
     * @param isListed Is the artifact already actively listed?
     * @param inTreasury Is the artifact currently owned by Pandoraas Treasury?
     * @throws Error if any restriction is violated.
     */
    static validateCreation(isOwner: boolean, isListed: boolean, inTreasury: boolean): void {
        if (!isOwner) {
            throw new Error('Listing rejected: Seller does not own this artifact.');
        }
        if (isListed) {
            throw new Error('Listing rejected: Artifact is already actively listed.');
        }
        if (inTreasury) {
            throw new Error('Listing rejected: Artifact is currently held by Pandoraas Treasury.');
        }
    }

    /**
     * Validates if a user can cancel a listing.
     * @param isSeller Is the user attempting to cancel the original seller?
     * @param currentStatus The listing's current lifecycle status.
     * @throws Error if cancellation is not allowed.
     */
    static validateCancellation(isSeller: boolean, currentStatus: string): void {
        if (!isSeller) {
            throw new Error('Cancellation rejected: Only the original seller can cancel this listing.');
        }
        if (currentStatus !== 'ACTIVE') {
            throw new Error(`Cancellation rejected: Listing is ${currentStatus}, not ACTIVE.`);
        }
    }
}
