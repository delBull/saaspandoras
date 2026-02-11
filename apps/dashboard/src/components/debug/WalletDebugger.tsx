"use client";

import { useActiveAccount, useActiveWallet, useActiveWalletChain } from "thirdweb/react";
import { useState, useEffect } from "react";

export function WalletDebugger() {
    const account = useActiveAccount();
    const wallet = useActiveWallet();
    const chain = useActiveWalletChain();
    const [isVisible, setIsVisible] = useState(false);

    // Only show in dev or staging
    const shouldShow = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'staging';

    if (!shouldShow) return null;

    if (!account) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50">
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded border border-red-500/50 hover:bg-red-500/30"
            >
                {isVisible ? "Hide Wallet Debug" : "🐞 Debug Wallet"}
            </button>

            {isVisible && (
                <div className="mt-2 bg-black/90 border border-red-500/50 rounded p-4 text-xs font-mono text-white w-64 shadow-xl backdrop-blur">
                    <div className="space-y-2">
                        <div>
                            <span className="text-gray-500 block">Status:</span>
                            <span className="text-green-400">Connected</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Address:</span>
                            <span className="break-all text-yellow-300">{account.address}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Wallet ID:</span>
                            <span className="text-blue-300">{wallet?.id}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Chain:</span>
                            <span className="text-purple-300">{chain?.name || chain?.id || "Unknown"} ({chain?.id})</span>
                        </div>
                        <div className="pt-2 border-t border-white/10">
                            <span className="text-gray-500 block">Smart Account?</span>
                            <span className={wallet?.id === "smart" ? "text-green-400 font-bold" : "text-red-400"}>
                                {wallet?.id === "smart" ? "YES (Smart Wallet)" : "NO (EOA / InApp)"}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
