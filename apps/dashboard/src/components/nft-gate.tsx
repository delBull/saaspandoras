'use client';

import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import Image from "next/image";
import { MintingProgressModal } from "./nft-gating/minting-progress-modal";
import { SuccessNFTCard } from "./nft-gating/success-nft-card";
import { useToast } from "@saasfly/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { createWallet } from "thirdweb/wallets";

/**
 * 🛰️ NFT GATE: PURE VIEW ORCHESTRATOR
 * ============================================================================
 * Reactive layer for the Genesis Ritual.
 * All business logic (minting/verification) is now in AuthProvider.
 * ============================================================================
 */
type GateVisualState =
  | "idle"
  | "checking"
  | "minting"
  | "retrying"
  | "confirming_irreversible"
  | "finalizing"
  | "success"
  | "error";

export function NFTGate({ children }: { children: React.ReactNode }) {
  const [visualState, setVisualState] = useState<GateVisualState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const account = useActiveAccount();
  const { user, status, triggerMint } = useAuth();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const { toast } = useToast();

  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

  const track = (event: string, data?: any) => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, wallet: account?.address, data })
    }).catch(() => { });
  };

  // 🚀 RITUAL FLOW (Animations + Triggering AuthMachine)
  const runRitual = async () => {
    if (visualState !== "idle" && visualState !== "error") return;

    try {
      track("ritual_visual_start");
      setVisualState("checking");

      // 1. Trigger the actual logic in AuthProvider (Machine Level 10)
      const mintPromise = triggerMint();

      await wait(1800);
      setVisualState("minting");
      await wait(2000);

      // 2. Add Visual Tension (Pseudo-deterministic)
      const seed = account?.address?.slice(-4) || "0000";
      if (parseInt(seed, 16) % 4 === 0) { // 25% chance of visual "retry"
        setVisualState("retrying");
        await wait(3000);
      }

      setVisualState("confirming_irreversible");
      await wait(1500);

      setVisualState("finalizing");

      // 3. Final Sync with Machine
      await mintPromise;

      // 4. Double check access (Wait for state to propagate)
      let finalHasAccess = status === "has_access" || user?.hasAccess;
      
      if (!finalHasAccess) {
        // One final retry attempt to refresh session
        const refreshed = await triggerMint(); 
        finalHasAccess = status === "has_access" || user?.hasAccess;
      }

      if (finalHasAccess) {
        setVisualState("success");
        setShowSuccessAnimation(true);
        toast({ title: "Acceso Concedido", description: "Identidad Genesis sincronizada." });
      } else {
        throw new Error("No se detectó el NFT de acceso en esta wallet. Si lo acabas de mintear, espera unos segundos y reintenta.");
      }

    } catch (err: any) {
      console.error("[NFTGate] Ritual interrupted:", err);
      setErrorMessage(err.message || "Interrupción de señal.");
      setVisualState("error");
    }
  };

  // 🧬 Barrier Logic
  const isAuthLoading = ["booting", "checking_session", "checking_access"].includes(status);

  // 🟢 CASE 1: Full Access (Bypass)
  if (status === "has_access" || (isAdmin && account)) {
    const hasSeenSuccess = sessionStorage.getItem("pandora_access_reward_seen");
    if (!hasSeenSuccess && status === "has_access") {
      sessionStorage.setItem("pandora_access_reward_seen", "true");
      return <SuccessNFTCard onAnimationComplete={() => router.replace("/")} />;
    }
    return <>{children}</>;
  }

  // ⏳ CASE 2: Identifying/Booting
  if (status === "booting" || (isAuthLoading && account)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 relative z-10" />
        </div>
        <p className="text-gray-400 font-mono text-xs tracking-widest uppercase">Escaneando Identidad...</p>
      </div>
    );
  }

  // 🎭 CASE 3: Success Animation Overlay
  if (visualState === "success" && showSuccessAnimation) {
    return <SuccessNFTCard onAnimationComplete={() => {
      setShowSuccessAnimation(false);
      router.replace("/");
    }} />;
  }

  // 🎭 CASE 4: The Ritual Modal
  const isRitualInProgress = !["idle", "success", "error"].includes(visualState);

  if (isRitualInProgress) {
    const statusMap: Record<string, string> = {
      checking: "Sincronizando con el Oracle...",
      minting: "Invocando slot de acceso...",
      retrying: "Señal débil. Reintentando enlace...",
      confirming_irreversible: "Fijando identidad en el ledger...",
      finalizing: "Abriendo compuertas Genesis...",
    };

    return (
      <MintingProgressModal
        step={visualState as any}
        statusOverride={statusMap[visualState] || "Ejecutando protocolo..."}
        isMinting={visualState === "minting" || status === "minting"}
        onClose={() => { }}
      />
    );
  }

  // 🎭 CASE 5: Error Screen
  if (visualState === "error" || status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-8">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Señal Interrumpida</h2>
        <p className="text-gray-400 mb-8 max-w-xs">{errorMessage || "Error de sincronización."}</p>
        <button
          onClick={() => {
            setVisualState("idle");
            runRitual();
          }}
          className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
        >
          Reintentar Ritual
        </button>
      </div>
    );
  }

  // 🎭 CASE 6: Entry Screen (Idle)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <div className="w-24 h-24 mb-10 relative">
        <Image src="/images/pkey.png" alt="Key" width={120} height={120} className="relative z-10 animate-float" />
        <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full animate-pulse" />
      </div>
      <h2 className="text-3xl font-black mb-3 tracking-tighter">ACCESO REQUERIDO</h2>
      <p className="text-zinc-500 mb-12 max-w-sm text-center leading-relaxed font-medium">
        Para entrar al Protocolo Pandora's, necesitas validar tu identidad Genesis y reclamar tu slot.
      </p>
      {!account ? (
        <div className="flex flex-col items-center">
           <ConnectButton
            client={client}
            theme="dark"
            chain={config.chain}
            appMetadata={{
              name: "Pandora's Dashboard",
              url: "https://dash.pandoras.finance",
            }}
            wallets={[
              createWallet("io.metamask"),
              createWallet("com.coinbase.wallet"),
              createWallet("me.rainbow"),
            ]}
            connectButton={{
                className: "bg-white text-black px-12 py-5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95",
                label: "Conectar Wallet"
            }}
          />
          <p className="text-[10px] text-zinc-600 mt-4 uppercase tracking-widest font-black">Requerido para Identidad Genesis</p>
        </div>
      ) : (
        <button
          onClick={runRitual}
          className="group relative bg-white text-black px-12 py-5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 overflow-hidden"
        >
          <span className="relative z-10">Iniciar Ritual</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity" />
        </button>
      )}
    </div>
  );
}
