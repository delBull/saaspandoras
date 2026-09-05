"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { createWallet } from "thirdweb/wallets";

const API_URL = process.env.NEXT_PUBLIC_PANDORAS_API_URL || "http://localhost:3000/api";
// We need to resolve to domain to support both v1 (API_URL) and pure API
const AUTH_URL = API_URL.replace("/v1", "");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      {/* We don't wrap children in an internal context, we let ThirdwebProvider handle state */}
      {/* The actual SIWE config is usually passed to <ConnectButton> or <ConnectEmbed> in v5 */}
      {children}
    </ThirdwebProvider>
  );
}

// Extract auth config here so it can be reused in ConnectButton
export const siweConfig = {
  domain: typeof window !== "undefined" ? window.location.hostname : "pandoras.finance",
  getLoginPayload: async (params: { address: string }) => {
    // 1. Fetch nonce from Central Auth
    const res = await fetch(`${AUTH_URL}/auth/nonce?address=${params.address}`);
    if (!res.ok) throw new Error("Failed to fetch nonce");
    const data = await res.json();
    return {
      domain: typeof window !== "undefined" ? window.location.hostname : "pandoras.finance",
      address: params.address,
      statement: "Sign in to Pandora's Growth OS",
      uri: typeof window !== "undefined" ? window.location.origin : "https://pandoras.finance",
      version: "1",
      chainId: 137, // Default to Polygon for SIWE payload if needed
      nonce: data.nonce,
      issued_at: new Date().toISOString(),
      expiration_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      invalid_before: new Date().toISOString(),
    };
  },
  doLogin: async (params: { payload: any; signature: string }) => {
    // 2. Send payload & signature to Central Auth
    const res = await fetch(`${AUTH_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: params.payload, signature: params.signature }),
      credentials: "include", // Crucial for cross-origin __pbox_sid
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }
  },
  isLoggedIn: async () => {
    // 3. Check session in Central Auth
    const res = await fetch(`${AUTH_URL}/auth/session`, {
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.hasSession === true;
  },
  doLogout: async () => {
    // 4. Logout from Central Auth
    await fetch(`${AUTH_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  },
};
