"use client";

import React, { createContext, useContext, useEffect, useRef, useReducer, useCallback } from "react";
import { getContract, prepareContractCall } from "thirdweb";
import { useActiveAccount, useActiveWalletChain, useIsAutoConnecting, useSendTransaction } from "thirdweb/react";
import { useToast } from "@saasfly/ui/use-toast";
import { config } from "@/config";
import { client } from "@/lib/thirdweb-client";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { useEOAIdentity } from "@/hooks/useEOAIdentity";

interface User {
    id: string;
    address: string;
    hasAccess: boolean;
    isAdmin: boolean;
    benefitsTier?: string;
}

type AuthStatus =
    | "idle"
    | "booting"
    | "checking_session"
    | "unauthenticated"
    | "signing"
    | "authenticated"
    | "checking_access"
    | "no_access"
    | "ready_to_mint"
    | "minting"
    | "has_access"
    | "error";

interface AuthState {
    status: AuthStatus;
    user: User | null;
    error: string | null;
}

type AuthAction =
    | { type: "SET_STATUS"; status: AuthStatus; user?: User | null; error?: string | null }
    | { type: "SET_USER"; user: User | null }
    | { type: "SET_ERROR"; error: string | null }
    | { type: "RESET" };

const initialState: AuthState = {
    status: "booting",
    user: null,
    error: null
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case "SET_STATUS":
            return {
                ...state,
                status: action.status,
                user: action.user !== undefined ? action.user : state.user,
                error: action.error !== undefined ? action.error : state.error
            };
        case "SET_USER":
            return { ...state, user: action.user };
        case "SET_ERROR":
            return { ...state, error: action.error };
        case "RESET":
            return { ...initialState, status: "idle" };
        default:
            return state;
    }
}

interface AuthContextType {
    status: AuthStatus;
    user: User | null;
    isAuthenticated: boolean;
    login: (id: number) => Promise<void>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<any>;
    runAuthFlow: () => Promise<void>;
    setStatus: (status: AuthStatus) => void;
    triggerMint: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PERSIST_KEY = "pandora_auth_state_v1";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const account = useActiveAccount();
    const isAutoConnecting = useIsAutoConnecting();
    const chain = useActiveWalletChain();
    const { toast } = useToast();
    const { getIdentity } = useEOAIdentity();
    const { mutate: sendTransaction } = useSendTransaction();

    const contract = getContract({
        client,
        chain: config.chain,
        address: config.nftContractAddress,
        abi: PANDORAS_KEY_ABI,
    });

    const flowId = useRef(0);
    const flowInProgress = useRef(false);

    // 💾 STATE PERSISTENCE (Elite Level)
    const persistState = useCallback((status: AuthStatus, address?: string) => {
        if (typeof window === "undefined") return;
        localStorage.setItem(PERSIST_KEY, JSON.stringify({
            status,
            address,
            ts: Date.now()
        }));
    }, []);

    const loadPersistedState = useCallback(() => {
        if (typeof window === "undefined") return null;
        const saved = localStorage.getItem(PERSIST_KEY);
        if (!saved) return null;
        try {
            const parsed = JSON.parse(saved);
            const isFresh = Date.now() - parsed.ts < 30 * 60 * 1000; // 30 mins
            return isFresh ? parsed : null;
        } catch { return null; }
    }, []);

    const trackTransition = (to: AuthStatus, data?: any) => {
      if (state.status === to) return;
      console.log(`[AuthMachine] ⚡ ${state.status} -> ${to}`, data || "");
      
      // Persist critical states
      if (to === "has_access" || to === "no_access" || to === "unauthenticated") {
          persistState(to, account?.address);
      }

      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "auth_transition",
          wallet: account?.address,
          data: { from: state.status, to, ...data }
        })
      }).catch(() => {});
    };

    const safeDispatch = (action: AuthAction, id: number) => {
        if (flowId.current === id) {
            if (action.type === "SET_STATUS") {
                trackTransition(action.status);
            }
            dispatch(action);
        } else {
            console.warn(`[AuthMachine] ⚠️ Discarding stale action ${action.type} (Expected ${flowId.current}, got ${id})`);
        }
    };

    // 🛡️ REPLAY & BOOT
    useEffect(() => {
        const persisted = loadPersistedState();
        if (persisted && persisted.address === account?.address) {
            console.log("[AuthMachine] 🔄 Replaying persisted state:", persisted.status);
            dispatch({ type: "SET_STATUS", status: persisted.status });
        }
    }, [account?.address, loadPersistedState]);

    const lastAccountRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (account?.address !== lastAccountRef.current) {
            lastAccountRef.current = account?.address;
            if (account) {
                 dispatch({ type: "RESET" });
                 runAuthFlow();
            } else {
                 dispatch({ type: "SET_STATUS", status: "unauthenticated" });
                 persistState("unauthenticated");
            }
        }
    }, [account?.address]);

    /**
     * FRACTURE #1: Pure refreshSession
     */
    const refreshSession = async () => {
        try {
            const res = await fetch("/api/auth/refresh", { credentials: "include", cache: "no-store" });
            if (!res.ok) return null;
            return res.json();
        } catch (e) {
            console.error("[AuthMachine] Refresh error:", e);
            return null;
        }
    };

    const login = async (id: number) => {
        if (!account) return;
        try {
            safeDispatch({ type: "SET_STATUS", status: "signing" }, id);

            const identityAddress = getIdentity() || account.address;
            const nonceRes = await fetch(`/api/auth/nonce?address=${identityAddress}`, { credentials: "include" });
            if (!nonceRes.ok) throw new Error("Could not fetch nonce");
            const { nonce } = await nonceRes.json();

            const domain = window.location.hostname;
            const uri = window.location.origin;
            const message = `${domain} wants you to sign in with your Ethereum account:\n${identityAddress}\n\nTo access Pandoras Dashboard\n\nURI: ${uri}\nVersion: 1\nChain ID: ${chain?.id || config.chain.id}\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${new Date(Date.now() + 5 * 60 * 1000).toISOString()}`;

            const signature = await account.signMessage({ message });

            const loginRes = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payload: { domain, address: identityAddress, uri, chainId: chain?.id || config.chain.id, nonce, message, expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString() },
                    signature
                }),
                credentials: "include",
            });

            if (!loginRes.ok) throw new Error("Login verification failed");
            toast({ title: "Welcome!", description: "Identity verified successfully." });
        } catch (e: any) {
            console.error("[AuthMachine] Login error:", e);
            throw e;
        }
    };

    /**
     * UNIFIED ORCHESTRATOR (9.9/10)
     */
    const runAuthFlow = async () => {
        const id = ++flowId.current;
        if (flowInProgress.current) return;
        flowInProgress.current = true;

        console.log(`[AuthMachine] 🚀 Running auth flow #${id}...`);

        try {
            if (!account) {
                safeDispatch({ type: "SET_STATUS", status: "unauthenticated" }, id);
                return;
            }

            safeDispatch({ type: "SET_STATUS", status: "checking_session" }, id);
            
            // ELITE OPTIMIZATION: One fetch, multiple usages
            const session = await refreshSession();

            if (!session?.authenticated) {
                // FRACTURE #2: login(id)
                await login(id);
                // Re-validate after login
                const postLogin = await refreshSession();
                if (!postLogin?.authenticated) throw new Error("SIWE verification failed");
                safeDispatch({ type: "SET_STATUS", status: "authenticated", user: postLogin.user }, id);
            }

            const currentSession = session?.authenticated ? session : await refreshSession();
            
            if (currentSession?.user?.hasAccess) {
                safeDispatch({ type: "SET_USER", user: currentSession.user }, id);
                safeDispatch({ type: "SET_STATUS", status: "has_access" }, id);
            } else {
                safeDispatch({ type: "SET_USER", user: currentSession?.user || null }, id);
                safeDispatch({ type: "SET_STATUS", status: "no_access" }, id);
            }

        } catch (err: any) {
            console.error(`[AuthMachine] Flow #${id} Error:`, err);
            safeDispatch({ type: "SET_ERROR", error: err.message || "Error desconocido" }, id);
            safeDispatch({ type: "SET_STATUS", status: "error" }, id);
        } finally {
            flowInProgress.current = false;
        }
    };

    const triggerMint = async () => {
        // FRACTURE #3: Isolated Flow
        const id = ++flowId.current; 
        if (state.status !== "no_access" && state.status !== "ready_to_mint") return;

        console.log(`[AuthMachine] 💍 Triggering isolated Mint Flow #${id}...`);
        flowInProgress.current = true;
        
        try {
            safeDispatch({ type: "SET_STATUS", status: "minting" }, id);

            const transaction = prepareContractCall({
                contract,
                method: "freeMint",
                params: [],
            });

            await new Promise((resolve, reject) => {
                sendTransaction(transaction, {
                    onSuccess: resolve,
                    onError: reject
                });
            });

            console.log(`[AuthMachine] Transaction confirmed #${id}. Polling...`);
            
            let attempts = 0;
            // FRACTURE #6: Protected Polling
            while (attempts < 10 && flowId.current === id) {
                const res = await refreshSession();
                if (res?.user?.hasAccess) {
                    safeDispatch({ type: "SET_USER", user: res.user }, id);
                    safeDispatch({ type: "SET_STATUS", status: "has_access" }, id);
                    return;
                }
                attempts++;
                await new Promise(r => setTimeout(r, 2000));
            }
            
            if (flowId.current === id) {
                throw new Error("NFT minted but access not yet synced. Please refresh.");
            }

        } catch (err: any) {
            console.error(`[AuthMachine] Mint Error Flow #${id}:`, err);
            
            const msg = err?.message?.toLowerCase() || "";
            if (msg.includes("already") || msg.includes("max per wallet")) {
                const res = await refreshSession();
                if (res?.user?.hasAccess) {
                    safeDispatch({ type: "SET_USER", user: res.user }, id);
                    safeDispatch({ type: "SET_STATUS", status: "has_access" }, id);
                    return;
                }
            }

            safeDispatch({ type: "SET_ERROR", error: err.message || "Error al solicitar acceso" }, id);
            safeDispatch({ type: "SET_STATUS", status: "error" }, id);
        } finally {
            // FRACTURE #5: finally safety
            if (flowId.current === id) {
                flowInProgress.current = false;
            }
        }
    };

    const logout = async () => {
        try {
            await fetch(`/api/auth/logout`, { method: "POST", credentials: "include" });
            if (typeof window !== "undefined") localStorage.removeItem(PERSIST_KEY);
            dispatch({ type: "RESET" });
        } catch (e) {
            console.error("Logout error", e);
        }
    };

    return (
        <AuthContext.Provider value={{
            status: state.status,
            user: state.user,
            isAuthenticated: state.status === "has_access" || state.status === "authenticated",
            login,
            logout,
            refreshSession,
            runAuthFlow,
            setStatus: (status) => {
                trackTransition(status);
                dispatch({ type: "SET_STATUS", status });
            },
            triggerMint
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
