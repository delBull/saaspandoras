// lib/session-lock.ts

/**
 * Global Session Hydration Lock
 * 
 * Prevents race conditions where a component or external utility
 * attempts to execute a protected API request before the authentication
 * layer (wallet connection + JWT cookie) has fully resolved.
 */

let hydrated = false;
let waiters: (() => void)[] = [];

/**
 * Signals that the global authentication session has been resolved
 * (either successfully authenticated, or definitively rejected).
 * Releases all pending locked requests.
 */
export function hydrateSession() {
    hydrated = true;
    // Release all waiters
    waiters.forEach(resolve => resolve());
    waiters = [];
}

/**
 * Resets the hydration lock. Useful for handling explicit logouts
 * or cross-wallet disconnections.
 */
export function resetSessionLock() {
    hydrated = false;
    waiters = [];
}

/**
 * Halts execution of the current async function until the global
 * `hydrateSession()` signal has been fired by the `AuthProvider`.
 */
export async function waitForSession() {
    if (hydrated) return;

    await new Promise<void>((resolve) => {
        waiters.push(resolve);
    });
} 
