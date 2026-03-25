"use client";

import { useActiveAccount } from "thirdweb/react";
import { useMemo } from "react";

/**
 * Hook to get the "Real" Identity of the user (EOA).
 * In Account Abstraction (AA):
 * - The Smart Wallet is the "Execution" address.
 * - The EOA (Externally Owned Account) is the "Identity" / "Signer".
 */
export function useEOAIdentity() {
    // 🛡️ RISK #1: Safety guard for SSR hydration edges
    const account = typeof window !== "undefined" ? useActiveAccount() : undefined;

    const identityAddress = useMemo(() => {
        if (!account) return null;

        // 🛡️ RISK #3: Defensive check for smart wallet EOA extraction
        const acc = account as any;
        if (acc?.type === "smart" && typeof acc?.getEOA === "function") {
            try {
                // We attempt to get it synchronously if possible
                const eoa = acc.getEOA();

                if (eoa && typeof eoa === "object") {
                    return eoa.address || acc.address;
                }

                // If it's just a string or fails to expose address
                return (eoa as unknown as string) || acc.address;
            } catch (e) {
                console.warn("[useEOAIdentity] Error extracting EOA, falling back to account address:", e);
                return acc.address;
            }
        }

        return acc.address;
    }, [account]);

    // 🛡️ RISK #2: Memoize getIdentity to prevent unstable references and loops in consumers
    const getIdentity = useMemo(() => {
        return () => identityAddress || account?.address || "";
    }, [identityAddress, account?.address]);

    return {
        identityAddress,
        getIdentity
    };
}
