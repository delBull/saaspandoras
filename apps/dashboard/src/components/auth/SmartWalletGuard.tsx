"use client";

import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

export function SmartWalletGuard({ children }: { children: React.ReactNode }) {
    const account = useActiveAccount();
    const wallet = useActiveWallet();
    const [isTimeOut, setIsTimeOut] = useState(false);
    const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    // 🛡️ GUARD LOGIC (STRICT MODE):
    // Only allow specific "Trustworthy" final states.
    // If it's anything else (like 'inApp', 'embedded', or a social provider ID), we BLOCK and wait for 'smart'.

    const ALLOWED_WALLETS = [
        "smart",
        "io.metamask",
        "com.coinbase.wallet",
        "me.rainbow",
        "io.rabby",
        "walletConnect"
    ];

    const isAllowed = wallet && ALLOWED_WALLETS.includes(wallet.id);

    useEffect(() => {
        // If allowed or timed out, clean up
        if (isTimeOut || isAllowed || !wallet) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        // If connected but NOT allowed (e.g. inApp), start timer
        if (wallet && !isAllowed && !timerRef.current) {
            console.log("🛡️ SmartWalletGuard: Blocking wallet ID:", wallet.id);

            const longWaitTimer = setTimeout(() => {
                setShowLongWaitMessage(true);
            }, 5000);

            timerRef.current = setTimeout(() => {
                console.warn("🛡️ SmartWalletGuard: Timeout reached. Forcing unblock.");
                setIsTimeOut(true);
            }, 15000);

            return () => {
                clearTimeout(longWaitTimer);
                if (timerRef.current) clearTimeout(timerRef.current);
            };
        }
    }, [wallet, isTimeOut, isAllowed]);

    // 1. If no wallet connected, pass through.
    if (!wallet) return <>{children}</>;

    // 2. If valid/allowed wallet, pass through.
    if (isAllowed) return <>{children}</>;

    // 3. If timeout, pass through (Fail open).
    if (isTimeOut) return <>{children}</>;

    // 4. BLOCK EVERYTHING ELSE (inApp, social, etc.)
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-8 flex flex-col items-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-300 max-w-sm w-full">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                <div className="text-center">
                    <h3 className="text-white font-medium text-lg">Verificando Credenciales</h3>
                    <p className="text-zinc-400 text-sm mt-1">Asegurando sesión Account Abstraction...</p>

                    {/* Debug Info */}
                    <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-4 font-mono">
                        ID: {wallet.id}
                    </p>

                    {showLongWaitMessage && (
                        <p className="text-yellow-500/80 text-xs mt-2 animate-pulse">
                            Finalizando conexión segura...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
