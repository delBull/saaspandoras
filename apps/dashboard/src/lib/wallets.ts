import { inAppWallet, createWallet, smartWallet } from "thirdweb/wallets";
import { config } from "@/config";

// 🛡️ Centralized Account Abstraction Configuration (Legacy)
export const accountAbstractionConfig = {
    chain: config.chain,
    sponsorGas: true, // ⚡ GLOBAL GASLESS: All transactions will be sponsored
};

// ⚠️ Estas instancias NO deben recrearse en ningún otro lugar
/**
 * 🚨 CRITICAL WALLET CONFIGURATION 🚨
 * ============================================================================
 * WARNING: DO NOT ADD `smartAccount` WRAPPERS TO THIS CONFIGURATION.
 * 
 * We use `executionMode: { mode: "EIP7702", sponsorGas: true }` natively 
 * within the inAppWallet. This maintains "Gas is on us" sponsorship AND 
 * allows SIWE messages to be signed correctly by the EOA.
 * 
 * If you restore the `smartAccount({ chain, sponsorGas })` wrapper, 
 * backend SIWE verification will fail with a `401 Unauthorized` mismatch.
 * ============================================================================
 */
export const wallets = [
    inAppWallet({
        auth: {
            options: ["google", "email", "apple", "facebook", "passkey"],
        },
        executionMode: { 
            mode: "EIP7702", 
            sponsorGas: true, 
        },
    }),
    createWallet("io.metamask"),
];
