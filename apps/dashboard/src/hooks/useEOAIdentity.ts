"use client";

import { useActiveAccount } from "thirdweb/react";
import { useMemo } from "react";

/**
 * Hook to get the "Real" Identity of the user (EOA).
 * In Account Abstraction (AA):
 * - The Smart Wallet is the "Execution" address.
 * - The EOA (Externally Owned Account) is the "Identity" / "Signer".
 * 
 * For logic like:
 * - "Does the user own this NFT?"
 * - "Is this the same user as before?"
 * We should check the EOA.
 */
export function useEOAIdentity() {
    const account = useActiveAccount();

    return useMemo(() => {
        if (!account) return null;

        // If it's a smart wallet, it might expose the EOA via getEOA() or we might need to rely on the signer.
        // In Thirdweb v5 Account type, currently there isn't a direct `getEOA` property standard on the simplified `Account` interface 
        // unless it's a specific SmartAccount implementation.
        // However, for the purpose of this refactor, we will check if such a method exists or fallback to address if it's an EOA.

        // Note: The user snippet assumes `account.type === 'smart'` and `account.getEOA`. 
        // We will cast/check safely.

        // @ts-expect-error - 'type' and 'getEOA' might not be on the base Account interface but present on the runtime object for Smart Accounts
        if (account.type === "smart" && typeof account.getEOA === "function") {
            // @ts-expect-error
            return account.getEOA()?.address || account.getEOA();  // Adapt based on what getEOA returns (Address or Account)
        }

        // Fallback: If we can't extract EOA, or it's already an EOA
        return account.address;
    }, [account]);
}
