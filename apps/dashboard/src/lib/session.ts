let sessionPromise: Promise<any> | null = null;
let currentWalletAddress: string | null = null;

/**
 * Returns a global singleton Promise that resolves to the authenticated session.
 * If the wallet address changes (e.g., user switches account), the promise cache is busted.
 */
export async function waitForSession(walletAddress?: string): Promise<any> {
    const isNewWallet = walletAddress && walletAddress !== currentWalletAddress;

    // 🚀 DEV_FAST MODE: Instant Mock Session
    if (process.env.NEXT_PUBLIC_DEV_FAST === "true" && process.env.NODE_ENV === "development") {
        if (!sessionPromise || isNewWallet) {
            currentWalletAddress = walletAddress || "0xDEV_USER";
            sessionPromise = Promise.resolve({
                authenticated: true,
                user: {
                    id: "dev-user-id",
                    address: currentWalletAddress,
                    role: "admin",
                    scope: "web",
                    hasAccess: true,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                }
            });
        }
        return sessionPromise;
    }

    if (!sessionPromise || isNewWallet) {
        // Update current wallet address if provided
        if (walletAddress) {
            currentWalletAddress = walletAddress;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s safety timeout

        sessionPromise = fetch("/api/auth/me", {
            credentials: "include", // Keep credentials: "include" as it's important for session cookies
            headers: {
                "x-thirdweb-address": currentWalletAddress || "", // Use currentWalletAddress
                "Cache-Control": "no-store", // Prevent 304 stale cache during auth flow
            },
            signal: controller.signal
        }).then(async (res) => {
            clearTimeout(timeoutId);
            if (!res.ok) {
                // If the session doesn't exist yet (401), resolve to null instead of throwing
                // so we don't crash Promise.all() arrays. Let the caller handle the auth state.
                return null;
            }
            return res.json();
        }).catch((err) => {
            clearTimeout(timeoutId);
            console.warn("⚠️ [Session] Fetch failed or timed out:", err.message);
            return null; // Implicitly treat as unauthenticated/guest on failure
        });
    }

    return sessionPromise;
}

/**
 * Manually busts the session cache, forcing the next `waitForSession()` call to hit the network.
 */
export function bustSessionCache() {
    sessionPromise = null;
}
