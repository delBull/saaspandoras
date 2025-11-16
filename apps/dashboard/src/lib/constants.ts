/**
 * Application constants
 */

// SUPER_ADMIN_WALLET validation function for critical operations
export function getSuperAdminWallet(): string {
  const wallet = process.env.SUPER_ADMIN_WALLET;
  if (!wallet) {
    throw new Error("Missing critical env: SUPER_ADMIN_WALLET. Set this env var to secure admin operations.");
  }
  return wallet.toLowerCase();
}

// Legacy constant (DEPRECATED - use getSuperAdminWallet() for critical operations)
// Only for backward compatibility - prefers env var but allows fallback for non-critical operations
export const SUPER_ADMIN_WALLET = process.env.SUPER_ADMIN_WALLET ?? "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9";

// Other constants can be added here as needed
export const SUPPORTED_CHAINS = ["ethereum", "polygon", "arbitrum"] as const;

export const DEFAULT_CHAIN = "ethereum";
