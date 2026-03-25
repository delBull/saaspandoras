'use client';

import React, { useState, useEffect, useRef, useReducer } from "react";
import {
  useActiveAccount,
  useSendTransaction
} from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { config } from "@/config";
import Image from "next/image";
import { MintingProgressModal } from "./nft-gating/minting-progress-modal";
import { SuccessNFTCard } from "./nft-gating/success-nft-card";
import { useToast } from "@saasfly/ui/use-toast";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";

/**
 * 🚨 CRITICAL COMPONENT: NFT GATE (WELCOME / FREE MINT SCREEN) 🚨
 * ============================================================================
 * WARNING: CAUTION WHEN MODIFYING THIS COMPONENT.
 * 
 * This component is the bridge between a successful thirdweb login and entering
 * the dashboard. It checks if the user has the "Pandora's Key" NFT. If not,
 * it auto-mints it on component mount using `handleMint`.
 * 
 * ⚠️ KEY LOGIC TO PRESERVE ⚠️
 * 1. DO NOT call `login()` after a successful mint. This will cause the 
 *    application to prompt the user to sign a SIWE message AGAIN (UX Failure).
 * 2. ALWAYS call `refreshSession()` and then `router.push("/")`. This hits the
 *    silent backend refresh route to verify the chain and issue a new JWT.
 * 3. The `catch` block MUST catch "Max per wallet reached" and "Already owned",
 *    and treat it as a SUCCESS. This rescues users who already own the NFT
 *    but are stuck with a stale JWT cookie.
 * 
 * ============================================================================
 */
/**
 * 🛰️ NFT GATE STATE MACHINE (DETERMINISTIC FLOW)
 * ============================================================================
 * Centralizes all access ritual logic to prevent race conditions and loops.
 * ============================================================================
 */
type GateState =
  | "idle"
  | "checking"
  | "minting"
  | "retrying"
  | "confirming_irreversible"
  | "finalizing"
  | "success"
  | "error";

type Action =
  | { type: "START" }
  | { type: "MINT_START" }
  | { type: "RETRY" }
  | { type: "FINALIZE" }
  | { type: "IRREVERSIBLE" }
  | { type: "SUCCESS" }
  | { type: "ERROR"; message?: string }
  | { type: "RESET" };

function gateReducer(state: GateState, action: Action): GateState {
  switch (action.type) {
    case "START": return "checking";
    case "MINT_START": return "minting";
    case "RETRY": return "retrying";
    case "IRREVERSIBLE": return "confirming_irreversible";
    case "FINALIZE": return "finalizing";
    case "SUCCESS": return "success";
    case "ERROR": return "error";
    case "RESET": return "idle";
    default: return state;
  }
}

export function NFTGate({ children, onVerified }: { children: React.ReactNode; onVerified?: () => void }) {
  const [gateState, dispatch] = useReducer(gateReducer, "idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  const account = useActiveAccount();
  const { user, state: authState, refreshSession } = useAuth();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const { mutate: sendTransaction } = useSendTransaction();
  const { toast } = useToast();

  const hasRun = useRef(false);
  const isAuthLoading = authState !== "authenticated" && authState !== "guest";

  // 🏛️ ELITE UTILS
  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
  
  const withTimeout = <T,>(promise: Promise<T>, ms = 20000): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout Protocolo")), ms))
    ]);

  const track = (event: string, data?: any) => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, wallet: account?.address, data })
    }).catch(() => {}); // Silent fail
  };

  const contract = getContract({
    client,
    chain: config.chain,
    address: config.nftContractAddress,
    abi: PANDORAS_KEY_ABI,
  });

  // 🧬 Behavioral Memory & Ritual Persistence
  useEffect(() => {
    const visited = localStorage.getItem("has_visited_pandora");
    if (visited) setIsFirstVisit(false);
    else localStorage.setItem("has_visited_pandora", "true");

    // Recover state if mid-ritual
    const savedState = localStorage.getItem("gate_ritual_state") as GateState;
    if (savedState === "minting" || savedState === "retrying") {
      runFlow();
    }
  }, []);

  useEffect(() => {
    if (["idle", "success", "error"].includes(gateState)) {
      localStorage.removeItem("gate_ritual_state");
    } else {
      localStorage.setItem("gate_ritual_state", gateState);
    }
  }, [gateState]);

  // 🚀 ENTRY POINT (Robust Trigger)
  useEffect(() => {
    const canRun = gateState === "idle" || gateState === "error";
    if (!account || !canRun || user?.hasAccess || (isAdmin && account)) return;
    
    runFlow();
  }, [account?.address, user?.hasAccess, isAdmin]);

  const runFlow = async () => {
    try {
      track("ritual_start");
      dispatch({ type: "START" });
      
      // 1. Initial Access Check
      const session = await withTimeout(refreshSession() as any) as any;
      if (session?.hasAccess) {
        track("ritual_bypass_already_owned");
        dispatch({ type: "SUCCESS" });
        return;
      }

      // 2. Prepare Ritual
      dispatch({ type: "MINT_START" });
      await wait(1200);

      const transaction = prepareContractCall({
        contract,
        method: "freeMint",
        params: [],
      });

      // 3. Send Transaction (Promise Wrapped)
      track("mint_initiated");
      await withTimeout(new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: resolve,
          onError: reject
        });
      }), 60000); // 1 min timeout for TX

      // 4. Ritual Tension (Deterministic Pseudo-Random)
      const seed = account?.address?.slice(-4) || "0000";
      const pseudoRandom = parseInt(seed, 16) / 65535;
      const retryChance = isFirstVisit ? 0.35 : 0.15;

      if (pseudoRandom < retryChance) {
        track("ritual_tension_triggered");
        dispatch({ type: "RETRY" });
        await wait(2500);
      }

      // 5. Irreversible Moment
      dispatch({ type: "IRREVERSIBLE" });
      await wait(1500);

      dispatch({ type: "FINALIZE" });
      await wait(800);

      // 6. Verification & Reward
      const finalSession = await withTimeout(refreshSession() as any) as any;
      if (finalSession?.hasAccess) {
        track("ritual_success");
        dispatch({ type: "SUCCESS" });
        setShowSuccessAnimation(true);
        toast({ title: "Acceso Garantizado", description: "Slot Genesis asignado con éxito." });
        
        await wait(3500);
        router.replace("/");
      } else {
        throw new Error("Acceso no detectado tras el ritual.");
      }

    } catch (err: any) {
      const msg = err?.message?.toLowerCase?.() || "";
      
      if (msg.includes("already") || msg.includes("max per wallet")) {
        track("ritual_rescue_success");
        await refreshSession();
        dispatch({ type: "SUCCESS" });
        router.replace("/");
        return;
      }

      track("ritual_error", { message: err.message });
      console.error("[NFTGate] Ritual failed:", err);
      setErrorMessage(err.message || "Protocolo interrumpido.");
      dispatch({ type: "ERROR" });
    }
  };

  // 🛡️ Soft Bypass Reward (Ensures Success Animation is seen at least once per session)
  if ((user as any)?.hasAccess || (isAdmin && account)) {
    const hasSeenSuccess = sessionStorage.getItem("pandora_access_reward_seen");
    if (!hasSeenSuccess && (user as any)?.hasAccess) {
       sessionStorage.setItem("pandora_access_reward_seen", "true");
       return <SuccessNFTCard onAnimationComplete={() => router.replace("/")} />;
    }
    return <>{children}</>;
  }

  // Loading while identifying wallet/session
  if (!account || (isAuthLoading && account)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 relative z-10" />
        </div>
        <p className="text-gray-400 font-mono text-xs tracking-widest uppercase">Identificando Señal de Acceso...</p>
      </div>
    );
  }

  // 🎭 SUCCESS UI
  if (gateState === "success" && showSuccessAnimation) {
    return <SuccessNFTCard onAnimationComplete={() => {
      setShowSuccessAnimation(false);
      router.replace("/");
    }} />;
  }

  // 🎭 RITUAL MODAL (MintingProgressModal)
  const isInRitual = gateState !== "idle" && gateState !== "success" && gateState !== "error";
  
  if (isInRitual) {
    const statusMap: Record<string, string> = {
      checking: "Validando señales de elegibilidad...",
      minting: "Invocando slot Genesis...",
      retrying: "Slot ocupado. Reintentando sincronización...",
      confirming_irreversible: "Asignación confirmada. Entrada irreversible.",
      finalizing: "Finalizando proceso de selección...",
    };

    return (
      <MintingProgressModal
        step={gateState as any}
        statusOverride={statusMap[gateState] || "Procesando ritual..."}
        isMinting={gateState === "minting"}
        onClose={() => {
           // Modal is usually non-closable during ritual unless error
        }}
      />
    );
  }

  // 🎭 ERROR UI
  if (gateState === "error") {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-8">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Protocolo Interrumpido</h2>
              <p className="text-gray-400 mb-8 max-w-xs">{errorMessage || "No se pudo validar el acceso."}</p>
              <button
                onClick={() => {
                    hasRun.current = false;
                    runFlow();
                }}
                className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all"
              >
                Reintentar Ritual
              </button>
          </div>
      );
  }

  // DEFAULT (Fallthrough)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <div className="w-24 h-24 mb-6 relative">
          <Image src="/images/pkey.png" alt="Key" width={120} height={120} className="relative z-10" />
          <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Acceso Requerido</h2>
      <p className="text-gray-400 mb-8 max-w-sm text-center">Para entrar al Protocolo Pandora, necesitas validar tu identidad Genesis.</p>
      <button
        onClick={runFlow}
        className="bg-gradient-to-r from-purple-600 to-blue-600 px-12 py-4 rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-all"
      >
        Iniciar Ritual de Acceso
      </button>
    </div>
  );
}

