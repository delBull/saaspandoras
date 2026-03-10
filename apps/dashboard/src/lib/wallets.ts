import { inAppWallet, createWallet, smartWallet } from "thirdweb/wallets";
import { config } from "@/config";

// 🛡️ Centralized Account Abstraction Configuration
export const accountAbstractionConfig = {
    chain: config.chain,
    sponsorGas: true, // ⚡ GLOBAL GASLESS: All transactions will be sponsored
};

// ⚠️ Estas instancias NO deben recrearse en ningún otro lugar
export const wallets = [
    inAppWallet({
        auth: {
            options: ["google", "email", "apple", "facebook", "passkey"],
        },
        // Enforce Smart Account with EIP7702 fallback for sponsorship
        smartAccount: accountAbstractionConfig,
    }),
    createWallet("io.metamask"),
];
