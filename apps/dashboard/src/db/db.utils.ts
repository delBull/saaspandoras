/**
 * Institutional-grade DB transaction wrapper with deadlock retry logic.
 * Catches Postgres error code '40P01' (deadlock_detected) and re-executes.
 */
export async function withDeadlockRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 100
): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            // Postgres Deadlock detected code: 40P01
            const isDeadlock = error.code === '40P01' || error.message?.includes('deadlock detected');

            if (isDeadlock && attempt < maxRetries) {
                const jitter = Math.random() * 50;
                const totalDelay = (delayMs * attempt) + jitter;
                console.warn(`[DB_RETRY] Deadlock detected (attempt ${attempt}/${maxRetries}). Retrying in ${totalDelay.toFixed(0)}ms...`);
                await new Promise(resolve => setTimeout(resolve, totalDelay));
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}
