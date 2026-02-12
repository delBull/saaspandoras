import { inAppWallet, createWallet } from "thirdweb/wallets";
import { config } from "@/config";

export const accountAbstractionConfig = {
    chain: config.chain,
    sponsorGas: true,
};

// ⚠️ Estas instancias NO deben recrearse en ningún otro lugar
export const wallets = [
    inAppWallet({
        auth: {
            options: ["google", "email", "apple", "facebook", "passkey"],
        },
    }),
    createWallet("io.metamask"),
];
