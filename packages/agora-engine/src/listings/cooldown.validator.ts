export interface CooldownCheckResult {
    valid: boolean;
    remainingSeconds?: number;
}

export class CooldownValidator {

    /**
     * Protects the market from micro-manipulation by enforcing a 5-minute
     * cooldown after an artifact listing is manually cancelled.
     * 
     * @param lastCancelledAt The timestamp the artifact's listing was last cancelled
     * @param cooldownMinutes Configurable delay length, defaults to 5 minutes
     */
    static validate(lastCancelledAt: Date | null | string, cooldownMinutes = 5): CooldownCheckResult {
        if (!lastCancelledAt) return { valid: true };

        const cancelledTime = new Date(lastCancelledAt).getTime();
        if (isNaN(cancelledTime)) return { valid: true };

        const diffMs = Date.now() - cancelledTime;
        const cooldownMs = cooldownMinutes * 60 * 1000;

        if (diffMs < cooldownMs) {
            const remainingSeconds = Math.ceil((cooldownMs - diffMs) / 1000);
            return { valid: false, remainingSeconds };
        }

        return { valid: true };
    }
}
