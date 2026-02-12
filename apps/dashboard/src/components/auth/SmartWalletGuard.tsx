"use client";

import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

export function SmartWalletGuard({ children }: { children: React.ReactNode }) {
    const account = useActiveAccount();
    const wallet = useActiveWallet();
    const [isTimeOut, setIsTimeOut] = useState(false);

    // 🛡️ GUARD LOGIC:
    // We only want to block the UI if we detect a Social Login (inApp/embedded) 
    // that hasn't upgraded to a Smart Wallet yet.
    //
    // If the wallet.id is 'inApp' or 'embedded', it implies we are using the EOA signer directly, 
    // OR we are in the process of upgrading to the Smart Account (since our config enforces AA).
    // The user reported that it "starts as EOA" and then "switches to Smart Account".
    // 
    // So, while wallet.id is 'inApp', we BLOCK and show a loader.
    // When wallet.id becomes 'smart' (or we timeout), we let it through.

    // Effect to handle the timeout "escape hatch"
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (wallet && (wallet.id === "inApp" || wallet.id === "embedded")) {
            // Start a 5-second timer to allow passing through even if it stays 'inApp'
            // (Just in case the upgrade fails or isn't configured, so we don't block forever)
            timer = setTimeout(() => {
                setIsTimeOut(true);
            }, 5000);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [wallet]);

    // 1. If no wallet connected, pass through.
    if (!wallet) return <>{children}</>;

    // 2. If it's a Smart Wallet properly identified, pass through.
    if (wallet.id === "smart") return <>{children}</>;

    // 3. If it's a standard external wallet (Metamask, Coinbase, etc), pass through.
    if (wallet.id !== "inApp" && wallet.id !== "embedded") return <>{children}</>;

    // 4. If we timed out waiting, pass through (Fail open).
    if (isTimeOut) return <>{children}</>;

    // 5. If we are here, it is an "inApp" wallet that is NOT yet "smart" and hasn't timed out.
    // BLOCK and show loader.
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-8 flex flex-col items-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                <div className="text-center">
                    <h3 className="text-white font-medium text-lg">Verificando Credenciales</h3>
                    <p className="text-zinc-400 text-sm mt-1">Asegurando sesión Account Abstraction...</p>
                </div>
            </div>
        </div>
    );
}
