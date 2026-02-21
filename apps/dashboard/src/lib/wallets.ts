import { inAppWallet, createWallet } from "thirdweb/wallets";
import { config } from "@/config";

export const accountAbstractionConfig = {
    chain: config.chain,
    sponsorGas: true, // ⚡ Sponsor gas for all Smart Account transactions
};

// ⚠️ Estas instancias NO deben recrearse en ningún otro lugar
export const wallets = [
    inAppWallet({
        auth: {
            options: ["google", "email", "apple", "facebook", "passkey"],
        },
        smartAccount: accountAbstractionConfig, // ⚡ Social logins get Smart Account (gasless)
    }),
    createWallet("io.metamask"), // EOA - Account Abstraction applied via ConnectButton accountAbstraction prop
];
