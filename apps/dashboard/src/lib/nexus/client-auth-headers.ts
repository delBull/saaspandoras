"use client";

/**
 * 🏛️ ARCHITECTURE NOTE: Nexus client auth headers
 * ================================================
 * Single mechanism for browser → Nexus API calls that are authenticated by the
 * operator's wallet session and/or magic-link token.
 *
 * These headers are a CLIENT PROPOSAL, never authority: every route re-resolves
 * identity/permissions server-side via `getNexusAuthContext`.
 */

const WALLET_STORAGE_KEYS = [
  "snarai_wallet",
  "user_wallet",
  "walletAddress",
  "thirdweb:active-account",
];

export function getClientWalletAddress(): string {
  if (typeof window === "undefined") return "";
  for (const key of WALLET_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }
  return (window as unknown as { ethereum?: { selectedAddress?: string } }).ethereum?.selectedAddress ?? "";
}

export function getNexusClientHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const headers: Record<string, string> = {};

  const wallet = getClientWalletAddress();
  if (wallet) {
    headers["x-wallet-address"] = wallet;
    headers["x-thirdweb-address"] = wallet;
  }

  const token =
    window.localStorage.getItem("pandoras_nexus_token") ??
    window.localStorage.getItem("nexus_token");
  if (token) {
    headers["x-nexus-token"] = token;
  }

  return headers;
}
