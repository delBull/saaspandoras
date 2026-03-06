"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useActiveAccount, useActiveWalletChain, useIsAutoConnecting } from "thirdweb/react";
import { useToast } from "@saasfly/ui/use-toast";
import { config } from "@/config";
import { client } from "@/lib/thirdweb-client";
import { useEOAIdentity } from "@/hooks/useEOAIdentity";
import { hydrateSession, resetSessionLock } from "@/lib/session-lock";

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
}

interface AuthContextType {
    state: AuthState;
    user: User | null;
    isAuthenticated: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const account = useActiveAccount();
    const isAutoConnecting = useIsAutoConnecting();
    const chain = useActiveWalletChain();
    const { toast } = useToast();

    const [state, setState] = useState<AuthState>("booting");
    const [user, setUser] = useState<User | null>(null);

    const eoaIdentity = useEOAIdentity();
    const loginRequested = useRef<Record<string, boolean>>({});

    // 1. Core State Transition: React to wallet changes
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

        const check = async () => {
            setState("checking_session");

            if (!account) {
                console.log('[Auth] 👻 No wallet. Guest state.');
                setState("guest");
                hydrateSession();
                return;
            }

            try {
                const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });

                if (res.status === 401) {
                    setUser(null);
                    // Crucial: Fallback to SIWE if they are connected but cookie is missing
                    if (!loginRequested.current[account.address]) {
                        console.log('[Auth] 🔐 Connected but no cookie, attempting SIWE login...');
                        loginRequested.current[account.address] = true;
                        login().catch(console.error);
                    } else {
                        setState("guest");
                    }
                } else if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    setState("authenticated");
                } else if (res.status === 403) {
                    // Identity Frozen
                    const data = await res.json();
                    setUser(data.user || null);
                    setState("guest");
                } else {
                    setUser(null);
                    setState("guest");
                }
            } catch (e) {
                setUser(null);
                setState("guest");
            } finally {
                hydrateSession(); // Unblock React Suspense boundaries!
            }
        };

        check();
    }, [state]);

    const checkSession = () => {
        // Expose manual check wrapper if needed by UI
        if (account) setState("wallet_ready");
    };

    const login = async () => {
        console.log('[Auth] 🔐 Login function called');
        if (!account) {
            hydrateSession();
            return;
        }

        try {
            setState("authenticating");

            const identityAddress = eoaIdentity || account.address;

            // 1. Get Nonce
            const nonceRes = await fetch(`${API_URL}/auth/nonce?address=${identityAddress}`, { credentials: "include" });
            const { nonce } = await nonceRes.json();

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

            const loginRes = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payload, signature }),
                credentials: "include",
            });

            if (!loginRes.ok) throw new Error("Login failed");

            const data = await loginRes.json();

            // 🆕 Store full unified identity
            if (data.user) {
                setUser(data.user);
            } else {
                // 🛑 Fix crítico: Dar tiempo al navegador de registrar la cookie cross-domain (SameSite=Lax/None)
                await new Promise(resolve => setTimeout(resolve, 200));
                // Fallback for transition
                checkSession();
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
            hydrateSession(); // Ensures App router data can hydrate even if aborted
            loginRequested.current[account.address] = false;
        }
    };

    const logout = async () => {
        try {
            console.log('[Auth] 🚪 Logging out...');
            await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
            setUser(null);
            setState("guest");
            resetSessionLock();
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
            checkSession
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
