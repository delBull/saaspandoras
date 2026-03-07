import { inAppWallet, createWallet, smartWallet } from "thirdweb/wallets";
import { config } from "@/config";

export const accountAbstractionConfig = {
    chain: config.chain,
    sponsorGas: true, // ⚡ GLOBAL GASLESS: All transactions will be sponsored
};

export const wallets = [
    // 🛡️ Explicitly wrapping inAppWallet with smartWallet to ENFORCE Account Abstraction
    // 🛡️ Explicitly configuring inAppWallet with Smart Account
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
        smartAccount: accountAbstractionConfig, // ⚡ Built-in Smart Account support
    }),
    // 🛡️ Standard EOA wallets
    createWallet("io.metamask"),
];
