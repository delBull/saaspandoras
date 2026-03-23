/**
 * Growth OS: Progression Engine (v2.0)
 * Centralized logic for tier calculations, deltas, and urgency metrics.
 */

export interface Tier {
    id: string;
    name: string;
    artifactCountThreshold: number;
    perks: string[];
    description?: string;
    color?: string;
}

export interface ProgressionState {
    userArtifactCount: number;
    currentTier: Tier | null;
    nextTier: Tier | null;
    progressPercentage: number;
    unlockDelta: number;
    urgencyLevel: "low" | "medium" | "high";
    isUnlockMoment: boolean;
}

export class ProgressionEngine {
    /**
     * Calculates the full progression state for a user.
     */
    static calculate(
        currentCount: number, 
        tiers: Tier[], 
        additionalPurchase: number = 0
    ): ProgressionState {
        const sortedTiers = [...tiers].sort((a, b) => a.artifactCountThreshold - b.artifactCountThreshold);
        const newCount = currentCount + additionalPurchase;
        
        let currentTier: Tier | null = null;
        let nextTier: Tier | null = null;
        let tierAfterPurchase: Tier | null = null;

        // Find current tier
        for (const tier of sortedTiers) {
            if (currentCount >= tier.artifactCountThreshold) {
                currentTier = tier;
            }
            if (newCount >= tier.artifactCountThreshold) {
                tierAfterPurchase = tier;
            }
            if (currentCount < tier.artifactCountThreshold && !nextTier) {
                nextTier = tier;
            }
        }

        const unlockDelta = nextTier ? nextTier.artifactCountThreshold - currentCount : 0;
        const purchaseUnlockDelta = nextTier ? nextTier.artifactCountThreshold - newCount : 0;

        // Calculate Urgency
        let urgencyLevel: "low" | "medium" | "high" = "low";
        if (unlockDelta > 0) {
            if (unlockDelta <= 5) urgencyLevel = "high";
            else if (unlockDelta <= 15) urgencyLevel = "medium";
        }

        // Logic check for "isUnlockMoment"
        // It's an unlock moment if the tier changes after the additional purchase
        const isUnlockMoment = tierAfterPurchase !== null && (!currentTier || tierAfterPurchase.id !== currentTier.id);

        const progressPercentage = nextTier 
            ? Math.min(100, Math.floor((currentCount / nextTier.artifactCountThreshold) * 100))
            : 100;

        return {
            userArtifactCount: currentCount,
            currentTier,
            nextTier,
            progressPercentage,
            unlockDelta,
            urgencyLevel,
            isUnlockMoment
        };
    }

    /**
     * Simulates the impact of a purchase.
     */
    static simulate(currentCount: number, tiers: Tier[], purchaseAmount: number) {
        return this.calculate(currentCount, tiers, purchaseAmount);
    }
}
