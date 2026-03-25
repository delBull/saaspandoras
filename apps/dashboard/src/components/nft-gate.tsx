'use client';

import React, { useState, useEffect, useRef } from "react";
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
export function NFTGate({ children, onVerified }: { children: React.ReactNode; onVerified?: () => void }) {
  const account = useActiveAccount();
  const { user, state, refreshSession, login } = useAuth();
  const { isAdmin } = useAdmin();
  const isAuthLoading = state !== "authenticated" && state !== "guest";
  const router = useRouter();
  const { mutate: sendTransaction } = useSendTransaction();
  const { toast } = useToast();

  const [gateStatus, setGateStatus] = useState<string>("idle");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const hasStartedProcessing = useRef(false);
  const hasAttemptedAutoMint = useRef(false);
  const hasRedirected = useRef(false);

  // 🧬 Behavioral Memory: Identify returning users to optimize ritual feel
  useEffect(() => {
    const visited = localStorage.getItem("has_visited_pandora");
    if (visited) {
      setIsFirstVisit(false);
    } else {
      localStorage.setItem("has_visited_pandora", "true");
    }
  }, []);

  const contract = getContract({
    client,
    chain: config.chain,
    address: config.nftContractAddress,
    abi: PANDORAS_KEY_ABI,
  });

  // 🧠 REDIRECT CUANDO YA TIENE ACCESS (Evita loops)
  useEffect(() => {
    if (user?.hasAccess && !hasRedirected.current) {
      if (gateStatus === "has_key") {
        hasRedirected.current = true;
        router.replace("/");
      }
    }
  }, [user?.hasAccess, gateStatus, router]);

  // 🛡️ ADMIN BYPASS (SIN ROMPER RENDER)
  useEffect(() => {
    if (isAdmin && account && onVerified && !showSuccessAnimation) {
      setShowSuccessAnimation(true);
      onVerified();
    }
  }, [isAdmin, account, onVerified, showSuccessAnimation]);

  const handleMint = async () => {
    if (hasStartedProcessing.current) return;
    hasStartedProcessing.current = true;

    toast({
      title: "Protocolo de Selección Pandora",
      description: "Validando tu señal de elegibilidad...",
    });

    try {
      const transaction = prepareContractCall({
        contract,
        method: "freeMint",
        params: [],
      });

      // Artificial Delay: Build Tension
      setGateStatus("searching");
      await new Promise(r => setTimeout(r, 1500));
      
      setGateStatus("awaiting_confirmation");

      sendTransaction(transaction, {
        onSuccess: async (txResult) => {
          console.log("✅ Mint Successful:", txResult);
          
          try {
            await fetch("/api/access/assign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user?.id })
            });
          } catch (e) {
            console.error("[GATE] Classification failed", e);
          }

          // 🎭 CONTEXTUAL PROBABILISTIC UX (Tension Simulation)
          // Adjust retry chance based on visit history (Returning users see less friction)
          const retryChance = isFirstVisit ? 0.35 : 0.15;

          if (!isRetrying && Math.random() < retryChance) {
            setGateStatus("slot_busy");
            await new Promise(r => setTimeout(r, 2200));
            setIsRetrying(true);
            setGateStatus("retrying");
            await new Promise(r => setTimeout(r, 1800));
          }

          // 🔒 IRREVERSIBLE MOMENT (High-Stakes Finalization)
          setGateStatus("confirming_irreversible");
          await new Promise(r => setTimeout(r, 1200));
          
          setGateStatus("finalizing");
          await new Promise(r => setTimeout(r, 500));

          setGateStatus("success");
          setShowSuccessAnimation(true);

          toast({ title: "Acceso Garantizado", description: "Slot Genesis asignado con éxito." });
          setTimeout(() => {
            refreshSession().catch(e => console.error("Re-login failed", e));
          }, 4000);
        },
        onError: (error) => {
          console.error("Mint Error:", error);
          const msg = error instanceof Error ? error.message : "Unknown error";

          if (msg.includes("already minted") || msg.toLowerCase().includes("max per wallet") || msg.toLowerCase().includes("transfer prohibited")) {
            toast({ title: "Acceso Verificado", description: "Entrando a SaaS... 🚀" });
            setGateStatus("has_key");
            refreshSession().catch(e => console.error(e));
          } else {
            toast({ title: "Protocolo Interrumpido", description: "Por favor reintenta la validación.", variant: "destructive" });
            setGateStatus("error");
          }
          hasStartedProcessing.current = false;
        },
      });
    } catch (e) {
      console.error(e);
      hasStartedProcessing.current = false;
    }
  };

  // ⚡ FIX ESTABLE DEL AUTO-MINT
  useEffect(() => {
    if (!account || !user || user.hasAccess || hasAttemptedAutoMint.current) return;
    
    hasAttemptedAutoMint.current = true;

    const run = async () => {
      try {
        await refreshSession();
        // Skip handleMint if session refresh already granted access
        // (The next render will handle it via early return)
      } catch {
        handleMint();
      }
      // If we are here, we either minted or are waiting for re-render
      // If refreshSession didn't throw but user still doesn't have access:
      handleMint();
    };
    run();
  }, [account?.address]); // 🔥 SOLO address

  // 🛡️ FIX DE SEGURIDAD DE RENDER (ANTI-CRASH)
  const isReady = !!account && !!user;

  if (user?.hasAccess || (isAdmin && account)) {
    return <>{children}</>;
  }

  if (!isReady) {
    if (isAuthLoading && account) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
          <p className="text-gray-300">Verifying your access...</p>
        </div>
      );
    }
    if (!account) return <>{children}</>;
    return null;
  }

  if (gateStatus === "success" && showSuccessAnimation) {
    return <SuccessNFTCard onAnimationComplete={() => {
      setShowSuccessAnimation(false);
      setGateStatus("has_key");
      hasStartedProcessing.current = false;
    }} />;
  }

  if (gateStatus !== "idle" && gateStatus !== "success" && gateStatus !== "has_key" && gateStatus !== "refreshing") {
    // 🎭 Tension Mapping (Psychological Framing)
    const statusMap: Record<string, string> = {
      searching: "Validando acceso exclusivo...",
      slot_busy: "Slot no disponible. Reintentando...",
      retrying: "Reintentando asignación...",
      confirming_irreversible: "Asignación confirmada. Este acceso no podrá ser revertido.",
      finalizing: "Finalizando sincronización...",
    };

    return (
      <MintingProgressModal
        step={gateStatus}
        statusOverride={statusMap[gateStatus]}
        isMinting={hasStartedProcessing.current}
        alreadyOwned={false}
        onClose={() => {
          setGateStatus("idle");
          hasStartedProcessing.current = false;
          if (gateStatus === "success" || gateStatus === "has_key") {
            onVerified?.();
          }
        }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center p-8 max-w-md mx-auto">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl flex items-center justify-center">
            <Image
              src="/images/pkey.png"
              alt="Pandora's Key"
              width={120}
              height={120}
              priority
              style={{ width: "auto", height: "auto" }}
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
          <p className="text-gray-300 leading-relaxed">
            To access, you need a <strong className="text-lime-400">Pandora&apos;s Key</strong>.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleMint}
            disabled={hasStartedProcessing.current || gateStatus === "refreshing"}
            className="w-full bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-500 hover:to-emerald-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-bold shadow-lg"
          >
            {hasStartedProcessing.current && gateStatus !== "refreshing" ? (
              <>
                <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              <>Get Free Key</>
            )}
          </button>

          <button
            onClick={async () => {
              setGateStatus("refreshing");
              try {
                toast({ title: "Re-verifying access...", description: "Checking blockchain..." });
                await refreshSession();
                // After refreshSession, the AuthProvider user.hasAccess will update
                // which will trigger the early return in this component.
                if (!user?.hasAccess) {
                    toast({ 
                        title: "Access Denied", 
                        description: "No NFT found in your wallet. If you just minted, please wait 30-60 seconds.",
                        variant: "destructive"
                    });
                }
              } catch (e) {
                console.error(e);
              } finally {
                setGateStatus("idle");
              }
            }}
            disabled={hasStartedProcessing.current || gateStatus === "refreshing"}
            className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-gray-300 py-2 px-6 rounded-lg font-medium text-sm border border-zinc-700 transition-colors"
          >
            {gateStatus === "refreshing" ? (
              <>
                <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>I already have a key / Refresh status</>
            )}
          </button>

          <div className="text-xs text-gray-400 bg-zinc-800/50 p-3 rounded-lg">
            <p>Gas is on us.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

