"use client";

let API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 🛡️ Bulletproof override: If API_URL points back to the Next.js frontend or is empty/root, force it to relative `/api` for same-domain Next.js API Routes.
// This prevents CORS and cookie issues when the frontend and backend are hosted together on Vercel.
if (typeof window !== 'undefined') {
    const isProd = window.location.hostname.includes("pandoras.finance") || window.location.hostname.includes("vercel.app");
    if (isProd || API_URL === "/" || API_URL === "") {
        API_URL = "/api";
    }
} else {
    // SSR Fallback (though this is a "use client" component)
    if (API_URL === "/" || API_URL === "" || API_URL.includes("dash.pandoras.finance")) {
        API_URL = "/api";
    }
}

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useActiveAccount, useActiveWalletChain, useIsAutoConnecting } from "thirdweb/react";
import { useToast } from "@saasfly/ui/use-toast";
import { waitForSession } from "@/lib/session";
import { config } from "@/config";
import { client } from "@/lib/thirdweb-client";
import { useEOAIdentity } from "@/hooks/useEOAIdentity";
import { bustSessionCache } from "@/lib/session";


type AuthState =
    | "booting"
    | "wallet_ready"
    | "checking_session"
    | "authenticating"
    | "authenticated"
    | "guest";

interface User {
    id: string;
    address: string | null;
    hasAccess: boolean;
    telegramId?: string | null;
    name?: string | null;
    image?: string | null;
    isAdmin?: boolean;
    benefitsTier?: 'genesis' | 'standard' | null;
    accessCohort?: 'beta' | 'public' | null;
}

interface AuthContextType {
    state: AuthState;
    user: User | null;
    isAuthenticated: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => void;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 🚨 CRITICAL COMPONENT: AUTHENTICATION PROVIDER 🚨
 * ============================================================================
 * WARNING: DO NOT MODIFY THIS FILE WITHOUT UNDERSTANDING THE SIWE & EIP-7702 FLOW.
 * 
 * 1. Thirdweb Social Logins use EIP-7702 under the hood to sponsor gas while 
 *    keeping the EOA as the signer. Do NOT force `smartAccount` wrappers here, 
 *    or SIWE signatures will fail Backend verification (401 Unauthorized).
 * 2. Session caches are heavily reliant on `waitForSession` and `bustSessionCache`.
 * 3. The `refreshSession` function uses a custom backend route `/api/auth/refresh`
 *    to bypass SIWE signatures when a user just auto-minted the Pandora's Key.
 * 
 * IF YOU BREAK THIS FILE, NO USERS WILL BE ABLE TO LOGIN OR ACCESS THE DASHBOARD.
 * ============================================================================
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const account = useActiveAccount();
    const isAutoConnecting = useIsAutoConnecting();
    const chain = useActiveWalletChain();
    const { toast } = useToast();

    const [state, setState] = useState<AuthState>("booting");
    const [user, setUser] = useState<User | null>(null);

    const eoaIdentity = useEOAIdentity();
    const loginRequested = useRef<Record<string, boolean>>({});
    const hasCheckedSession = useRef(false); // ✅ FIX 3

    // 🛡️ RESET LOCK ON WALLET CHANGE (✅ FIX 1)
    useEffect(() => {
        hasCheckedSession.current = false;
    }, [account?.address]);

    // 1. Core State Transition: React to wallet changes
    // 🛡️ FIX 4: Booting Circuit Breaker
    // If we're stuck in 'booting' for more than 20s, force guest state to unblock UI
    useEffect(() => {
        if (state !== "booting") return;

        const timer = setTimeout(() => {
            if (state === "booting") {
                console.warn("[Auth] 🚨 Booting timed out (20s). Forcing guest state.");
                setState("guest");
            }
        }, 20000);

        return () => clearTimeout(timer);
    }, [state]);

    useEffect(() => {
        if (isAutoConnecting) {
            console.log('[Auth] ⏳ Booting (waiting for wallet)...');
            return;
        }

        // Only transition to wallet_ready if we aren't already deeply engaged, or if account changed
        if (!account && user) {
            // Wallet actively disconnected
            console.log('[Auth] 👻 Wallet disconnected, reverting to guest.');
            loginRequested.current = {};
            setUser(null);
            setState("guest");
            return;
        }

        setState("wallet_ready");
    }, [isAutoConnecting, account?.address]);

    // 2. Action: When wallet is ready, check authorization cookies
    useEffect(() => {
        if (state !== "wallet_ready") return;
        if (hasCheckedSession.current) return; // ✅ FIX 3: ADD LOCK

        hasCheckedSession.current = true;

        const check = async () => {
            setState("checking_session");

            if (!account) {
                console.log('[Auth] 👻 No wallet. Guest state.');
                setState("guest");
                return;
            }

            try {
                // 🛡️ Use the global session lock to prevent fetch races
                const sessionData = await waitForSession(account.address);

                if (!sessionData) {
                    setUser(null);

                    // 🛡️ Safe Auto-login: Only for Staging/Dev environments.
                    // Main production (dash.pandoras.finance) requires manual click to avoid the "Request expired" loop.
                    const isMainProd = typeof window !== 'undefined' && window.location.hostname === "dash.pandoras.finance";

                    if (!isMainProd && !loginRequested.current[account.address]) {
                        console.log('[Auth] 🔐 Connected but no session (Staging/Dev), attempting auto-login...');
                        loginRequested.current[account.address] = true;
                        login().catch((err) => {
                            console.error('[Auth] SIWE auto-login failed:', err);
                            setState("guest");
                        });
                    } else {
                        console.log('[Auth] No session found (Main/Guest). Staying in guest state.');
                        setState("guest");
                    }
                } else if (sessionData.authenticated) {
                    setUser(sessionData.user);
                    setState("authenticated");
                } else {
                    setUser(null);
                    setState("guest");
                }
            } catch (e) {
                setUser(null);
                setState("guest");
            }
        };

        check();
    }, [state]);

    const checkSession = () => {
        // Expose manual check wrapper if needed by UI
        if (account) setState("wallet_ready");
    };

    const login = async () => {
        if (!account || state === "authenticating") {
            console.log('[Auth] 🔐 Login ignored: no account or already authenticating');
            return;
        }

        console.log('[Auth] 🔐 Login function starting...');
        try {
            setState("authenticating");

            // 🛡️ Bust session cache immediately to ensure fresh start
            bustSessionCache();

            const identityAddress = eoaIdentity || account.address;

            // 1. Get Nonce
            const nonceRes = await fetch(`/api/auth/nonce?address=${identityAddress}`, { credentials: "include" });
            if (!nonceRes.ok) {
                const errData = await nonceRes.json().catch(() => ({}));
                throw new Error(errData.error || `Nonce fetch failed (${nonceRes.status})`);
            }
            const { nonce } = await nonceRes.json();

            if (!nonce) {
                throw new Error("Received empty nonce from server");
            }

            // 2. Create SIWE Message
            const domain = window.location.host;
            const uri = window.location.origin;
            const statement = "Sign in to Pandoras Dashboard";

            const version = "1";
            const chainId = chain?.id || config.chain.id;
            const issuedAt = new Date().toISOString();
            const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

            const executionAddress = account.address;

            // Construct EIP-4361 message
            const message = `${domain} wants you to sign in with your Ethereum account:
${identityAddress}

${statement}

URI: ${uri}
Version: ${version}
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}
${executionAddress !== identityAddress ? `\nExecution Address: ${executionAddress}` : ''}`;

            // 3. Sign
            const signature = await account.signMessage({ message });

            // 4. Verify & Create Session
            const payload = {
                domain,
                address: identityAddress,
                executionAddress: executionAddress !== identityAddress ? executionAddress : undefined,
                statement,
                uri,
                version,
                chainId,
                nonce,
                issuedAt,
                expirationTime,
                message,
            };

            const loginRes = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payload, signature }),
                credentials: "include",
            });

            if (!loginRes.ok) throw new Error("Login failed");

            const data = await loginRes.json();
            console.log('[Auth] 🔑 Login response data received:', { hasUser: !!data.user, hasAccess: data.hasAccess });

            // 🆕 Store full unified identity from response
            if (data.user) {
                setUser(data.user);
                setState("authenticated");
                console.log('[Auth] ✅ State set to authenticated with user data');
            } else {
                console.warn('[Auth] ⚠️ No user data in login response, falling back to session check');
                // 🛑 Fix crítico: Dar tiempo al navegador de registrar la cookie cross-domain (SameSite=Lax/None)
                await new Promise(resolve => setTimeout(resolve, 500));

                // Bust cache again and try one last time to fetch session
                bustSessionCache();
                const sessionData = await waitForSession(identityAddress);
                if (sessionData?.authenticated) {
                    setUser(sessionData.user);
                    setState("authenticated");
                } else {
                    setState("guest");
                }
            }
            toast({ title: "Welcome back!", description: "Successfully logged in." });

        } catch (e) {
            console.error('[Auth] ❌ Login error:', e);
            toast({
                title: "Authentication Failed",
                description: e instanceof Error ? e.message : "Error accessing dashboard",
                variant: "destructive"
            });
            setState("guest");
        } finally {
            if (account?.address) { // ✅ FIX 4
                loginRequested.current[account.address] = false;
            }
        }
    };

    /**
     * ⚠️ DO NOT MODIFY: 
     * Silently refreshes the JWT cookie by asking the backend to check the on-chain balance.
     * Used exclusively after the `nft-gate` auto-mints to grant access without a second SIWE prompt.
     */
    const refreshSession = async () => {
        if (!account) return null;
        try {
            console.log('[Auth] 🔄 Refreshing session state via API...');
            const res = await fetch(`/api/auth/refresh`);
            
            if (res.ok) {
                const sessionData = await res.json();
                if (sessionData.authenticated && sessionData.user) {
                    bustSessionCache();
                    setUser(sessionData.user);
                    setState("authenticated");
                    console.log('[Auth] ✅ Session refreshed, access updated:', sessionData.user.hasAccess);
                    return sessionData;
                }
            } else {
                console.log('[Auth] ❌ Refresh API returned error:', await res.text());
            }
            return null;
        } catch (e) {
            console.error('[Auth] ❌ Failed to refresh session:', e);
            return null;
        }
    };

    const logout = async () => {
        try {
            console.log('[Auth] 🚪 Logging out...');
            await fetch(`/api/auth/logout`, { method: "POST", credentials: "include" });
            setUser(null);
            setState("guest");

            import("@/lib/session").then(m => m.bustSessionCache());
        } catch (e) {
            console.error("Logout error", e);
        }
    };

    return (
        <AuthContext.Provider value={{
            state,
            user,
            isAuthenticated: state === "authenticated",
            login,
            logout,
            checkSession,
            refreshSession
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
