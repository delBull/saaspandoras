import { inAppWallet, createWallet } from "thirdweb/wallets";
import { config } from "@/config";

// 🛡️ Centralized Account Abstraction Configuration (Legacy)
export const accountAbstractionConfig = {
    chain: config.chain,
    sponsorGas: true,
};

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
 *
 * WALLETCONNECT CHAIN FIX:
 * The force-switchChain in AuthProvider.tsx:login() then handles the actual
 * switch before SIWE signing.
 *
 * SOCIAL LOGIN FIX (inAppWallet):
 * Changed from `mode: "redirect"` → `mode: "popup"`.
 * "redirect" requires `dash.pandoras.finance` to be registered as an allowed
 * redirect URL in the Thirdweb Dashboard for this Client ID.  "popup" opens
 * the OAuth flow in a small child window that closes itself, with no redirect
 * URL registration required.  All social providers (Google, Telegram, Apple,
 * Facebook, Email, Passkey) work the same in popup mode.
 */
export const wallets = [
    inAppWallet({
        auth: {
            options: ["google", "telegram", "email", "apple", "facebook", "passkey"],
            mode: "popup", // ← was "redirect"; see note above
        },
        executionMode: {
            mode: "EIP7702",
            sponsorGas: true,
        },
    }),
    createWallet("io.metamask"),
    createWallet("com.brave.wallet"), // 🔥 Explicit Brave Wallet support to prevent "invalid address" deep link errors on mobile
    createWallet("com.trustwallet.app"),
    createWallet("io.rabby"),
    createWallet("com.coinbase.wallet"),
    createWallet("app.phantom"),
    createWallet("me.rainbow"),
    createWallet("walletConnect"),
];
