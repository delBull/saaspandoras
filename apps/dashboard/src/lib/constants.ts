/**
 * Application constants
 */

// SUPER_ADMIN_WALLET validation function for critical operations
export function getSuperAdminWallet(): string | null {
  const wallet = process.env.SUPER_ADMIN_WALLET;
  if (!wallet && process.env.NODE_ENV === 'production') {
    console.warn("⚠️ Missing critical env: SUPER_ADMIN_WALLET.");
  }
  return wallet?.toLowerCase() ?? null;
}

// Global constant (NO FALLBACK for security)
export const SUPER_ADMIN_WALLET = process.env.SUPER_ADMIN_WALLET?.toLowerCase() ?? "0x_undefined_admin";

// Other constants can be added here as needed
export const SUPPORTED_CHAINS = ["ethereum", "polygon", "arbitrum"] as const;

export const DEFAULT_CHAIN = "ethereum";
