import { inAppWallet, createWallet, smartWallet } from "thirdweb/wallets";
import { config } from "@/config";

// 🛡️ Centralized Account Abstraction Configuration (Legacy)
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
        executionMode: { 
            mode: "EIP7702", 
            sponsorGas: true, 
        },
    }),
    createWallet("io.metamask"),
];
