"use client";

import React, { createContext, useContext, useEffect, useRef, useReducer, useCallback } from "react";
import { getContract, prepareContractCall } from "thirdweb";
import { useActiveAccount, useActiveWalletChain, useIsAutoConnecting, useSendTransaction } from "thirdweb/react";
import { useToast } from "@saasfly/ui/use-toast";
import { config } from "@/config";
import { client } from "@/lib/thirdweb-client";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { useEOAIdentity } from "@/hooks/useEOAIdentity";
import { AccessState } from "@/lib/access/state-machine";
import { usePersistedAccount } from "@/hooks/usePersistedAccount";

export interface UXData {
    segment: string;
    cta: string;
    scarcityHint?: string;
    flow?: string;
    delay?: number;
    copyVariant?: string;
}

export interface User {
    id: string;
    address: string;
    hasAccess: boolean;
    isAdmin: boolean;
    benefitsTier?: string;
}

export type AuthStatus =
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
    remoteState: AccessState | null;
    ux: UXData | null;
    betaOpen: boolean;
    ritualEnabled: boolean;
}

type AuthAction =
    | { type: "SET_STATUS"; status: AuthStatus; user?: User | null; error?: string | null; remoteState?: AccessState | null; ux?: UXData | null; betaOpen?: boolean; ritualEnabled?: boolean }
    | { type: "SET_USER"; user: User | null; remoteState?: AccessState | null; ux?: UXData | null; betaOpen?: boolean; ritualEnabled?: boolean }
    | { type: "SET_ERROR"; error: string | null }
    | { type: "RESET" };

const initialState: AuthState = {
    status: "booting",
    user: null,
    error: null,
    remoteState: null,
    ux: null,
    betaOpen: false,
    ritualEnabled: true
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case "SET_STATUS":
            return {
                ...state,
                status: action.status,
                user: action.user !== undefined ? action.user : state.user,
                error: action.error !== undefined ? action.error : state.error,
                remoteState: action.remoteState !== undefined ? action.remoteState : state.remoteState,
                ux: action.ux !== undefined ? action.ux : state.ux
            };
        case "SET_USER":
            return { 
                ...state, 
                user: action.user,
                remoteState: action.remoteState !== undefined ? action.remoteState : state.remoteState,
                ux: action.ux !== undefined ? action.ux : state.ux
            };
        case "SET_ERROR":
            return { ...state, error: action.error };
        case "RESET":
            return { ...initialState, status: "booting" };
        default:
            return state;
    }
}

interface AuthContextType {
    status: AuthStatus;
    state: AuthStatus; 
    user: User | null;
    isAuthenticated: boolean;
    hasAccess: boolean;
    remoteState: AccessState | null; // 🛰️ Backend authority
    ux: UXData | null; // 💎 Adaptive UX metadata
    betaOpen: boolean;
    ritualEnabled: boolean;
    login: (id: number) => Promise<void>;
    logout: () => Promise<void>;
    refreshSession: (wallet?: string) => Promise<any>;
    runAuthFlow: () => Promise<void>;
    setStatus: (status: AuthStatus) => void;
    triggerMint: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PERSIST_KEY = "pandora_auth_state_v1";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        console.log("[AuthMachine] 🏗️ AuthProvider MOUNTED");
        return () => console.log("[AuthMachine] 🗑️ AuthProvider UNMOUNTED");
    }, []);

    const [state, dispatch] = useReducer(authReducer, initialState);

    const account = useActiveAccount();
    const isAutoConnecting = useIsAutoConnecting();
    const chain = useActiveWalletChain();
    const { toast } = useToast();
    const { getIdentity } = useEOAIdentity();
    const { mutate: sendTransaction } = useSendTransaction();
    const { isConnecting: isManualConnecting, hasSavedWallet } = usePersistedAccount();

    const contract = getContract({
        client,
        chain: config.chain,
        address: config.nftContractAddress,
        abi: PANDORAS_KEY_ABI,
    });

    const flowId = useRef(0);
    const mintFlowId = useRef(0); // 🧊 Isolated ID for manual transactions
    const flowInProgress = useRef(false);
    const runningFlow = useRef<Promise<void> | null>(null); // 🛠️ Mutex for runAuthFlow
    const abortControllerRef = useRef<AbortController | null>(null); // 🛡️ For refreshSession
    const lastAccountRef = useRef<string | undefined>(undefined);
    const hasBooted = useRef(false);

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
      console.log(`[AuthMachine] ⚡ Transition: ${state.status} -> ${to}`, data || "");
      
      // Persist only safe, verified states (Symmetric Persistence)
      if (to === "has_access" || to === "authenticated") {
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
        if (flowId.current === id || action.type === "RESET") {
            if (action.type === "SET_STATUS") {
                console.log(`[AuthMachine] 🟢 SET_STATUS: ${action.status} (Flow #${id})`);
                trackTransition(action.status);
            }
            dispatch(action);
        } else {
            console.warn(`[AuthMachine] ⚠️ Discarding stale action ${action.type} (Expected ${flowId.current}, got ${id})`);
        }
    };

    // 🛡️ REPLAY & BOOT logic (Safe Rehydration)
    useEffect(() => {
        const persisted = loadPersistedState();
        if (persisted && persisted.address === account?.address) {
            // ELITE FIX: Only rehydrate high-certainty states. 
            const SAFE_STATES: AuthStatus[] = ["has_access", "authenticated"];
            if (SAFE_STATES.includes(persisted.status)) {
                console.log("[AuthMachine] 🔄 Replaying safe state:", persisted.status);
                
                // 🕵️ Forced Revalidation: If they had access, verify it again immediately
                if (persisted.status === "has_access") {
                    dispatch({ type: "SET_STATUS", status: "checking_access" });
                } else {
                    dispatch({ type: "SET_STATUS", status: persisted.status });
                }
            }
        }
    }, [account?.address, loadPersistedState]);
 


    useEffect(() => {
        // 🔒 ORCHESTRATOR EFFECT (Latest-Wins Strategy)
        const address = account?.address;
        
        // Scenario A: First boot or Account changed
        if (!hasBooted.current || address !== lastAccountRef.current) {
            console.log(`[AuthMachine] 🔑 Context change: ${lastAccountRef.current} -> ${address}`);
            hasBooted.current = true;
            lastAccountRef.current = address;

            // ELITE FIX (Phase 41): If we detect an account, we MUST clear any previous logout flags
            // to prevent the "Login Return" loop where AutoLoginGate wipes cookies.
            if (address && typeof window !== "undefined") {
                localStorage.removeItem("wallet-logged-out");
            }

            // ELITE FIX: Abort any previous flow context AND release the mutex lock
            abortControllerRef.current?.abort();
            runningFlow.current = null; // 🔓 Force unlock for new identity
            
            const controller = new AbortController();
            abortControllerRef.current = controller;

            if (address) {
                 console.log("[AuthMachine] 👤 Account detected, initiating unified flow...");
                 runAuthFlow(controller.signal);
            } else if (!isAutoConnecting && !isManualConnecting) {
                 console.log("[AuthMachine] 👤 No account detected and not connecting. Settling as guest.");
                 dispatch({ type: "SET_STATUS", status: "unauthenticated" });
            } else {
                 console.log("[AuthMachine] ⏳ Connection in progress (Auto/Manual). Waiting...");
            }
        }
    }, [account?.address, isAutoConnecting, isManualConnecting]);

    // 🛡️ TRACE LOGS (Phase 39)
    useEffect(() => {
        console.log(`[AuthMachine] 📡 RAW STATE: address=${account?.address?.slice(0,6)}... status=${state.status} auto=${isAutoConnecting} manual=${isManualConnecting}`);
    }, [account?.address, state.status, isAutoConnecting, isManualConnecting]);

    /**
     * FRACTURE #1: Scoped refreshSession
     */
    const refreshSession = async (wallet?: string, signal?: AbortSignal) => {
        try {
            const url = wallet ? `/api/access-state?wallet=${wallet}` : "/api/access-state";
            const res = await fetch(url, { 
                signal,
                credentials: "include", 
                cache: "no-store" 
            });
            
            // PRINCIPAL FIX: Differentiate between 401 (not logged in) and 500 (system error)
            if (res.status === 401) return { authenticated: false };
            if (!res.ok) throw new Error(`Session infrastructure error (${res.status})`);
            
            return res.json();
        } catch (e: any) {
            if (e.name === "AbortError") {
                console.log("[AuthMachine] 🛡️ Scoped refresh call aborted.");
                return null;
            }
            console.error("[AuthMachine] Session fetch error:", e);
            throw e; // Bubble infrastructure errors to the flow handler
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
     * UNIFIED ORCHESTRATOR (Elite Level: Atomic Resets + Scoped Aborts)
     */
    const runAuthFlow = async (signal?: AbortSignal) => {
        // IDEMPOTENCY LOCK: Prevent multiple concurrent auth flows
        if (runningFlow.current) {
            console.log("[AuthMachine] 🛡️ Auth flow already in progress, skipping redundant call.");
            return runningFlow.current;
        }

        runningFlow.current = (async () => {
            const id = ++flowId.current;
            console.log(`[AuthMachine] 🚀 Starting flow #${id} (latest)`);
            
            // ELITE STABILITY FIX: Only reset if we are not already in a transitional state.
            // This prevents the "Blink" loop where the UI flashes back to the initial spinner.
            const TRANSITIONAL_STATES: AuthStatus[] = ["booting", "checking_session", "checking_access", "signing"];
            if (!TRANSITIONAL_STATES.includes(state.status)) {
                dispatch({ type: "SET_STATUS", status: "checking_session" });
            }

            try {
                if (!account) {
                    safeDispatch({ type: "SET_STATUS", status: "unauthenticated" }, id);
                    return;
                }

                // First attempt: Silent refresh
                let currentSession = await refreshSession(account?.address, signal);
                if (signal?.aborted) return;

                // Patrón Ideal: Si no hay sesión, login y luego un solo refresh final
                if (!currentSession || !currentSession.authenticated) {
                    console.log(`[AuthMachine] 🔐 Session stale in flow #${id}, triggering login...`);
                    await login(id);
                    if (signal?.aborted) return;
                    currentSession = await refreshSession(account?.address, signal);
                    
                    if (!currentSession?.authenticated && !signal?.aborted) {
                        throw new Error("Verification failed after login");
                    }
                }
                
                if (signal?.aborted) return;

                // At this point we have a valid currentSession
                safeDispatch({ 
                    type: "SET_STATUS", 
                    status: currentSession.hasAccess ? "has_access" : "no_access",
                    user: currentSession.user,
                    remoteState: currentSession.state,
                    ux: currentSession.ux
                }, id);
            } catch (err: any) {
                if (err.name === "AbortError") return;
                console.error(`[AuthMachine] ❌ Flow #${id} failed:`, err);
                safeDispatch({ type: "SET_ERROR", error: err.message || "Error desconocido" }, id);
                safeDispatch({ type: "SET_STATUS", status: "error" }, id);
            }
        })().finally(() => {
            runningFlow.current = null;
        });

        return runningFlow.current;
    };

    /**
     * MANUAL ACTIONS (Debounced)
     */
    const triggerMint = async () => {
        if (flowInProgress.current) return;
        
        // PRINCIPAL FIX: Separate Transaction ID from Global Auth ID
        const id = ++mintFlowId.current; 
        if (state.status !== "no_access" && state.status !== "ready_to_mint") return;

        console.log(`[AuthMachine] 💍 Starting manual Mint Flow #${id}...`);
        flowInProgress.current = true;
        
        try {
            safeDispatch({ type: "SET_STATUS", status: "minting" }, id);

            const transaction = prepareContractCall({
                contract,
                method: "freeMint",
                params: [],
            });

            // Safe TX Execution with 60s timeout
            await Promise.race([
                new Promise((resolve, reject) => {
                    sendTransaction(transaction, {
                        onSuccess: resolve,
                        onError: reject
                    });
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Transaction timed out (60s). Check your wallet UI.")), 60000)
                )
            ]);

            console.log(`[AuthMachine] Mint transaction confirmed. Polling for access...`);
            
            let attempts = 0;
            while (attempts < 10 && mintFlowId.current === id) {
                const res = await refreshSession(account?.address);
                if (res?.hasAccess) {
                    safeDispatch({ 
                        type: "SET_STATUS", 
                        status: "has_access",
                        user: res.user,
                        remoteState: res.state,
                        ux: res.ux
                    }, flowId.current);
                    return;
                }
                attempts++;
                await new Promise(r => setTimeout(r, 2000));
            }
            
            if (mintFlowId.current === id) {
                throw new Error("NFT minted but access not yet synced. Please refresh.");
            }

        } catch (err: any) {
            console.error(`[AuthMachine] Minting error:`, err);
            
            const msg = err?.message?.toLowerCase() || "";
            if (msg.includes("already") || msg.includes("max per wallet")) {
                const res = await refreshSession(account?.address);
                if (res?.hasAccess) {
                    safeDispatch({ 
                        type: "SET_STATUS", 
                        status: "has_access",
                        user: res.user,
                        remoteState: res.state,
                        ux: res.ux
                    }, flowId.current);
                    return;
                }
            }

            safeDispatch({ type: "SET_ERROR", error: err.message || "Error al solicitar acceso" }, id);
            safeDispatch({ type: "SET_STATUS", status: "error" }, id);
        } finally {
            if (mintFlowId.current === id) {
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
            state: state.status, 
            user: state.user,
            isAuthenticated: state.status === "authenticated" || state.status === "has_access" || state.status === "ready_to_mint" || state.status === "minting",
            hasAccess: state.remoteState === AccessState.HAS_ACCESS || state.remoteState === AccessState.ADMIN,
            remoteState: state.remoteState,
            ux: state.ux,
            betaOpen: state.betaOpen,
            ritualEnabled: state.ritualEnabled,
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
