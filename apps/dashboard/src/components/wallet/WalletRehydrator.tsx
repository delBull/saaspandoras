"use client";

import { useEffect, useRef } from "react";
import {
    useActiveAccount,
    useActiveWallet,
    useConnect,
    useDisconnect
} from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";
import { accountAbstractionConfig } from "@/config/wallets";

/**
 * WalletRehydrator (robusto)
 * - Desconecta cualquier wallet EOA activa
 * - Fuerza conexión a inAppWallet(smartAccount)
 * - Espera hasta que activeAccount esté listo (timeout/backoff)
 * - Loguea pasos para depuración
 */
export function WalletRehydrator() {
    const activeAccount = useActiveAccount();
    const activeWallet = useActiveWallet();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const attemptedRef = useRef(false);
    const maxWaitMs = 15000;

    useEffect(() => {
        // Si ya hay una account activa y wallet, no hacemos nada
        if (activeAccount && activeWallet) {
            console.debug("[WalletRehydrator] Already connected:", activeAccount?.address);
            return;
        }
        if (attemptedRef.current) {
            console.debug("[WalletRehydrator] Already attempted rehydrate, skipping");
            return;
        }

        attemptedRef.current = true;

        (async () => {
            console.debug("[WalletRehydrator] Start rehydration flow");

            // 1) Intentar desconectar cualquier wallet que esté parcialmente conectada
            try {
                console.debug("[WalletRehydrator] Attempting disconnect to clear any EOA");
                if (disconnect) {
                    await disconnect(activeWallet!);
                }
            } catch (e) {
                console.debug("[WalletRehydrator] disconnect() threw:", e);
            }

            // 2) Construir inAppWallet con AA
            const targetWallet = inAppWallet({
                auth: {
                    options: ["google", "email", "apple", "facebook", "passkey"],
                },
                smartAccount: accountAbstractionConfig,
            });

            // 3) Intentar conectar explícitamente (varias estrategias seguras)
            try {
                console.debug("[WalletRehydrator] Calling connect callback");

                await connect(async () => {
                    console.debug("[WalletRehydrator] Auto-connecting target wallet...");
                    await targetWallet.autoConnect({ client });
                    return targetWallet;
                });

            } catch (err1) {
                console.warn("[WalletRehydrator] connect callback failed:", err1);
                try {
                    // Fallback attempt
                    await targetWallet.autoConnect({ client });
                } catch (err2) {
                    console.error("[WalletRehydrator] Direct autoConnect failed:", err2);
                    return;
                }
            }

            // 4) Esperar hasta que la account esté realmente disponible (polling con timeout)
            const start = Date.now();
            while (Date.now() - start < maxWaitMs) {
                if (targetWallet.getAccount()) {
                    break;
                }
                await new Promise((r) => setTimeout(r, 250));
            }

            console.debug("[WalletRehydrator] Rehydration finished. Target Wallet Account:", targetWallet.getAccount()?.address);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
