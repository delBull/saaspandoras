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
  const { user, login, state, refreshSession } = useAuth();
  const isAuthLoading = state !== "authenticated" && state !== "guest";
  const pathname = usePathname();
  const router = useRouter();
  const { mutate: sendTransaction } = useSendTransaction();
  const { toast } = useToast();

  const [gateStatus, setGateStatus] = useState<string>("idle");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const hasStartedProcessing = useRef(false);
  const hasAttemptedAutoMint = useRef(false);

  const contract = getContract({
    client,
    chain: config.chain,
    address: config.nftContractAddress,
    abi: PANDORAS_KEY_ABI,
  });

  const handleMint = () => {
    if (hasStartedProcessing.current) return;
    hasStartedProcessing.current = true;

    toast({
      title: "Minting Access Key...",
      description: "Please confirm transaction in your wallet.",
    });

    try {
      const transaction = prepareContractCall({
        contract,
        method: "freeMint",
        params: [],
      });

      setGateStatus("awaiting_confirmation");

      sendTransaction(transaction, {
        onSuccess: async (txResult) => {
          console.log("✅ Mint Successful:", txResult);
          
          // 🧬 Genesis Access Classification
          try {
            console.log("🧬 [GATE] Assigning access benefits...");
            await fetch("/api/access/assign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user?.id })
            });
          } catch (e) {
            console.error("[GATE] Classification failed", e);
          }

          setGateStatus("success");
          setShowSuccessAnimation(true);

          toast({ title: "Verifying Access..." });
          setTimeout(() => {
            refreshSession().catch(e => console.error("Re-login failed", e));
          }, 4000);
        },
        onError: (error) => {
          console.error("Mint Error:", error);
          const msg = error instanceof Error ? error.message : "Unknown error";

          if (msg.includes("already minted") || msg.toLowerCase().includes("max per wallet") || msg.toLowerCase().includes("transfer prohibited")) {
            // 🚨 CRITICAL FALLBACK: Do NOT remove this. Rescues owners with stale JWTs.
            toast({ title: "Acceso Verificado", description: "Entrando a SaaS... 🚀" });
            setGateStatus("has_key");
            refreshSession().then(() => {
              router.refresh();
              router.push("/");
            }).catch(e => console.error(e));
          } else {
            toast({ title: "Mint Failed", description: "Please try again.", variant: "destructive" });
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

  useEffect(() => {
    // 1. If we don't have a wallet or user or they already have access, skip.
    if (!account || !user || user?.hasAccess || hasAttemptedAutoMint.current) return;
    
    hasAttemptedAutoMint.current = true;

    // 2. SILENT REFRESH: Before trying to mint, try a silent refresh to see if they already have it.
    // This handles manual browser refreshes where they already have the key but a stale JWT.
    refreshSession().then(() => {
        // After refreshSession, if hasAccess becomes true, the early return at 
        // the top of the component (line 129) will handle the bypass.
        // If it's still false, it falls through to handleMint().
        handleMint();
    }).catch(e => {
        console.warn("Silent refresh on mount failed, proceeding to mint", e);
        handleMint();
    });
  }, [account, user]);



  // ℹ️ Auto-login is handled by AuthProvider.useEffect.

  // NFTGate just reads isAuthLoading and user — no duplicate login() call here.

  // If user has access, render children immediately OR redirect if stuck on root layout
  if (user?.hasAccess) {
    // If the gate is somehow showing "Get Free Key" but they have access, 
    // force a router refresh and render children.
    if (gateStatus === "has_key") {
      router.refresh();
      router.push("/");
    }
    return <>{children}</>;
  }

  // If loading auth state AND account is connected, show loader (auto-login in progress)
  if (isAuthLoading && account) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
        <p className="text-gray-300">Verifying your access...</p>
      </div>
    );
  }

  // Connected wallet, but auth still loading or no session yet — show spinner
  // AuthProvider handles auto-SIWE; NFTGate just shows feedback while it happens.
  if (account && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4 p-4 text-center">
        {isAuthLoading && <Loader2 className="w-8 h-8 animate-spin text-lime-400" />}
        <p className="text-gray-300 text-sm">
          {isAuthLoading ? 'Verificando acceso...' : 'Autenticación requerida o fallida.'}
        </p>
        {/* Fallback manual button only if not loading anymore (auto-login may have failed) */}
        {!isAuthLoading && (
          <div className="flex flex-col items-center space-y-3 mt-4">
            <span className="text-xs text-red-400 max-w-xs">
              Hubo un problema al generar tu sesión. Puede ser un error temporal del proveedor (ej. Thirdweb/Red).
            </span>
            <button
              onClick={() => login()}
              className="px-4 py-2 text-sm font-semibold bg-zinc-800 text-white border border-zinc-700 rounded-md hover:bg-zinc-700 transition"
            >
              Reintentar inicio de sesión
            </button>
          </div>
        )}
      </div>
    );
  }

  // If loading auth but no account connected, show guest mode loader
  if (isAuthLoading && !account) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
      </div>
    );
  }

  // If not connected at all, return children (Guest mode? Or Block?)
  // User requested "Identify Address (Signer)". If no signer, we can't verify.
  // Unless public pages?
  // Previous logic: "if (!account) return <>{children}</>;"
  if (!account) {
    return <>{children}</>;
  }

  // If we differ to here, it means: User is Logged In (user exists) BUT hasAccess is false.
  // Show Minting UI.




  if (gateStatus === "success" && showSuccessAnimation) {
    return <SuccessNFTCard onAnimationComplete={() => {
      setShowSuccessAnimation(false);
      setGateStatus("has_key");
      hasStartedProcessing.current = false;
    }} />;
  }

  if (gateStatus !== "idle" && gateStatus !== "success" && gateStatus !== "has_key" && gateStatus !== "refreshing") {
    return (
      <MintingProgressModal
        step={gateStatus}
        isMinting={hasStartedProcessing.current}
        alreadyOwned={false}
        onClose={() => {
          setGateStatus("idle");
          hasStartedProcessing.current = false;
          // Trigger the portal transition if provided
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

