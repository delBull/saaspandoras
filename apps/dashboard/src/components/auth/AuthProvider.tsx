
"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { useToast } from "@saasfly/ui/use-toast";
import { config } from "@/config";
import { client } from "@/lib/thirdweb-client";
import { useEOAIdentity } from "@/hooks/useEOAIdentity";

interface User {
    address: string;
    hasAccess: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
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

    // Check session when account changes
    useEffect(() => {
        console.log('[AuthProvider] Account/User changed:', { hasAccount: !!account, hasUser: !!user });
        if (account && !user) {
            // User connected wallet but has no session -> Auto Login (SIWE)
            const hasRequestedLogin = sessionStorage.getItem(`login-requested-${account.address}`);
            console.log('[AuthProvider] Auto-login check:', { hasRequestedLogin });
            if (!hasRequestedLogin) {
                console.log('[AuthProvider] 🚀 Triggering auto-login for:', account.address);
                sessionStorage.setItem(`login-requested-${account.address}`, "true");
                login().catch(console.error);
            } else {
                // Already requested, check session again just in case
                console.log('[AuthProvider] Login already requested, rechecking session');
                checkSession();
            }
        } else if (!account && user) {
            // Wallet disconnected -> Logout
            setUser(null);
            sessionStorage.clear(); // Clear prevention flags
        }
    }, [account, user]);

    const checkSession = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
            const data = await res.json();
            if (res.ok && data.address) {
                // If wallet connected, verify it matches
                if (account && data.address.toLowerCase() !== account.address.toLowerCase()) {
                    // Mismatch: logout previous, login new?
                    // Or just invalid state.
                }
                setUser({ address: data.address, hasAccess: data.hasAccess });
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
            // This ensures sessions persist even when the smart wallet changes
            const identityAddress = eoaIdentity || account.address;
            console.log('[AuthProvider] 🆔 Identity Address (EOA):', identityAddress);
            console.log('[AuthProvider] 📱 Execution Address:', account.address);
            
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
            const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min validity for sig

            // 🆕 Include both addresses in the message for Smart Wallet support
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

            // 3. Sign (the user signs with their wallet, could be EOA or Smart Wallet)
            const signature = await account.signMessage({ message });

            // 4. Verify & Create Session
            // 🆕 Send both addresses: identity (EOA) for session, execution for display
            const payload = {
                domain,
                address: identityAddress, // Use EOA as the identity
                executionAddress: executionAddress !== identityAddress ? executionAddress : undefined, // Smart Wallet address
                statement,
                uri,
                version,
                chainId,
                nonce,
                issuedAt,
                expirationTime,
                message, // 🔑 Send the exact signed string for backend verification
            };

            const loginRes = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payload, signature }),
                credentials: "include",
            });

            if (!loginRes.ok) throw new Error("Login failed");

            const data = await loginRes.json();
            
            // 🆕 Store EOA identity in session for persistent login across smart wallet changes
            setUser({ address: identityAddress, hasAccess: data.hasAccess });
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
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
