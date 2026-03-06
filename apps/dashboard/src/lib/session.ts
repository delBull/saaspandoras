let sessionPromise: Promise<any> | null = null;
let currentWalletAddress: string | null = null;

/**
 * Returns a global singleton Promise that resolves to the authenticated session.
 * If the wallet address changes (e.g., user switches account), the promise cache is busted.
 */
export async function waitForSession(walletAddress?: string): Promise<any> {
    const isNewWallet = walletAddress && walletAddress !== currentWalletAddress;

    if (!sessionPromise || isNewWallet) {
        if (walletAddress) {
            currentWalletAddress = walletAddress;
        }

        sessionPromise = fetch("/api/auth/me", {
            headers: {
                "Cache-Control": "no-store", // Prevent 304 stale cache during auth flow
                "x-thirdweb-address": currentWalletAddress || "",
            }
        }).then(async (res) => {
            if (!res.ok) {
                // If the session doesn't exist yet (401), resolve to null instead of throwing
                // so we don't crash Promise.all() arrays. Let the caller handle the auth state.
                return null;
            }
            return res.json();
        }).catch((err) => {
            console.error("Session lock fetch failed:", err);
            return null;
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
