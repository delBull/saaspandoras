"use client";

import { useActiveAccount } from "thirdweb/react";
import React from "react";

/**
 * SmartWalletGuard (Passive Mode)
 * 
 * Previously, this component blocked the UI while waiting for the wallet to "upgrade" to a Smart Account.
 * However, this caused race conditions and "wallet switching" perceptions because of `AutoConnect`.
 * 
 * Now, this component is purely a pass-through.
 * Identity logic is handled by `useEOAIdentity` in the NFT Gate.
 * Connection persistence is handled securely by Thirdweb v5 without interference.
 */
export function SmartWalletGuard({ children }: { children: React.ReactNode }) {
    // We can use this hook to log state if needed, but we do NOT block render.
    const account = useActiveAccount();

    return <>{children}</>;
}
