import { inAppWallet, createWallet, smartWallet } from "thirdweb/wallets";
import { config } from "@/config";

export const accountAbstractionConfig = {
    chain: config.chain,
    sponsorGas: true, // ⚡ GLOBAL GASLESS: All transactions will be sponsored
};

export const wallets = [
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
        smartAccount: accountAbstractionConfig, // 🛡️ Explicit AA for Social
    }),
    // 🛡️ Explicitly listed wallets for Global Smart Account support
    createWallet("io.metamask"),
];
