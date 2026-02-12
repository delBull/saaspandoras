"use client";

import { useEffect, useRef } from "react";
import { useActiveWallet, useConnect } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";
import { accountAbstractionConfig } from "@/config/wallets";

export function WalletRehydrator() {
    const wallet = useActiveWallet();
    const { connect } = useConnect();
    const attempted = useRef(false);

    useEffect(() => {
        if (wallet) return;
        if (attempted.current) return;

        attempted.current = true;

        connect(async () => {
            const wallet = inAppWallet({
                smartAccount: accountAbstractionConfig,
            });
            try {
                await wallet.autoConnect({ client });
                return wallet;
            } catch (e) {
                console.log("Auto-connect failed, user needs to login manually");
                throw e; // Throw error to satisfy Wallet return type
            }
        });
    }, [wallet, connect]);

    return null;
}
