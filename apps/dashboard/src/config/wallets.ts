import { inAppWallet, createWallet, smartWallet } from "thirdweb/wallets";
import { config } from "@/config";

export const accountAbstractionConfig = {
    chain: config.chain,
    sponsorGas: true, // ⚡ GLOBAL GASLESS: All transactions will be sponsored
};

export const wallets = [
    // 🛡️ Explicitly wrapping inAppWallet with smartWallet to ENFORCE Account Abstraction
    smartWallet(
        inAppWallet({
            auth: {
                options: [
                    "google",
                    "email",
                    "apple",
                    "facebook",
                    "passkey",
                ],
            },
        }),
        accountAbstractionConfig // ⚡ Configured for Base/Sepolia with correct Factory
    ),
    // 🛡️ Standard EOA wallets (can be wrapped later if we want Global Gasless for MetaMask too)
    createWallet("io.metamask"),
];
