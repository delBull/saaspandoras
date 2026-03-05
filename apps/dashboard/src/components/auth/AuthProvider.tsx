
"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { useToast } from "@saasfly/ui/use-toast";
import { config } from "@/config";
import { client } from "@/lib/thirdweb-client";
import { useEOAIdentity } from "@/hooks/useEOAIdentity";

interface User {
    id: string;
    address: string | null;
    hasAccess: boolean;
    telegramId?: string | null;
    name?: string | null;
    image?: string | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const account = useActiveAccount();
    const chain = useActiveWalletChain();
    const { toast } = useToast();

    // 🆕 Smart Account Support: Get the real EOA identity
    // This handles both EOA wallets and Smart Wallets (AA)
    const eoaIdentity = useEOAIdentity();

    // Load session on mount
    useEffect(() => {
        console.log('[AuthProvider] Mounting - checking session');
        checkSession();
    }, []);

    const loginRequested = useRef<Record<string, boolean>>({});

    // Check session when account changes
    useEffect(() => {
        console.log('[AuthProvider] Account/User changed:', { hasAccount: !!account, hasUser: !!user });

        // 🛡️ Previene loops si todavía estamos cargando el estado inicial
        if (isLoading) return;

        if (account && !user) {
            // User connected wallet but has no session -> Auto Login (SIWE)
            const hasRequestedLogin = loginRequested.current[account.address];
            console.log('[AuthProvider] Auto-login check:', { hasRequestedLogin });
            if (!hasRequestedLogin) {
                console.log('[AuthProvider] 🚀 Triggering auto-login for:', account.address);
                loginRequested.current[account.address] = true;
                login().catch(console.error);
            } else {
                // Already requested, check session again just in case
                console.log('[AuthProvider] Login already requested, rechecking session');
                checkSession();
            }
        } else if (!account && user) {
            // Wallet disconnected -> Logout
            setUser(null);
            loginRequested.current = {}; // Clear prevention flags
        }
    }, [account, user, isLoading]);

    const checkSession = async () => {
        // 🛑 Optimización crítica: No bloquear el render inicial buscando sesión a usuarios desconectados
        if (!account) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });

            if (res.status === 401) {
                setUser(null);
                return;
            }

            const data = await res.json();

            // 🔥 El nuevo payload es { user: { id, address, ... } }
            if (res.ok && data.user) {
                setUser(data.user);
            } else if (res.status === 403) {
                // Identity Frozen
                setUser(data.user || null);
                toast({
                    title: "Access Restricted",
                    description: data.error || "Your identity is currently frozen.",
                    variant: "destructive"
                });
            } else {
                setUser(null);
            }
        } catch (e) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        console.log('[AuthProvider] 🔐 Login function called');
        if (!account) {
            console.warn('[AuthProvider] ❌ No account connected, aborting login');
            return;
        }

        try {
            setIsLoading(true);

            // 🆕 Smart Account Support: Use EOA as identity, not Smart Account address
            const identityAddress = eoaIdentity || account.address;
            console.log('[AuthProvider] 🆔 Identity Address (EOA):', identityAddress);

            // 1. Get Nonce for the EOA identity
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
                await checkSession();
            }
            toast({ title: "Welcome back!", description: "Successfully logged in." });

        } catch (e) {
            console.error(e);
            toast({ title: "Login failed", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
