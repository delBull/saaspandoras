import { inAppWallet, createWallet } from "thirdweb/wallets";

// ⚠️ Estas instancias NO deben recrearse en ningún otro lugar
export const wallets = [
    inAppWallet({
        auth: {
            options: ["google", "email", "apple", "facebook", "passkey"],
        },
        executionMode: {
            mode: "EIP7702", // ⚡ Same address as EOA, no proxy contract
            sponsorGas: true, // ⚡ Gas is sponsored
        },
    }),
    createWallet("io.metamask"), // EOA - uses EIP7702 via connect modal executionMode
];
