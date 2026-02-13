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
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function NFTGate({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const { user, login, isLoading: isAuthLoading } = useAuth();
  const pathname = usePathname();
  const { mutate: sendTransaction } = useSendTransaction();
  const { toast } = useToast();

  const [gateStatus, setGateStatus] = useState("idle");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const hasStartedProcessing = useRef(false);

  // If user has access, render children immediately
  if (user?.hasAccess) {
    return <>{children}</>;
  }

  // If loading auth state, show loader
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
      </div>
    );
  }

  // If not logged in, but account is connected, try to login automatically or show button?
  // AuthProvider handles auto-check, but if user is null here, it means we are not logged in.
  // We should encourage login.
  if (account && !user) {
    // User connected wallet but didn't sign SIWE yet (or session invalid)
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-gray-300">Please sign in to verify your access.</p>
        <button
          onClick={() => login()}
          className="bg-lime-400 text-black px-6 py-2 rounded font-bold hover:bg-lime-500 transition"
        >
          Sign In with Wallet
        </button>
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
        onSuccess: (txResult) => {
          console.log("✅ Mint Successful:", txResult);
          setGateStatus("success");
          setShowSuccessAnimation(true);

          // Refresh Session (Re-Login to update JWT with hasAccess: true)
          // Wait a bit for indexing?
          toast({ title: "Verifying Access..." });
          setTimeout(() => {
            login().catch(e => console.error("Re-login failed", e));
          }, 4000);
        },
        onError: (error) => {
          console.error("Mint Error:", error);
          const msg = error instanceof Error ? error.message : "Unknown error";

          if (msg.includes("already minted")) {
            toast({ title: "Already owned", description: "Verifying access..." });
            login();
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

  if (gateStatus === "success" && showSuccessAnimation) {
    return <SuccessNFTCard onAnimationComplete={() => {
      setShowSuccessAnimation(false);
      setGateStatus("has_key");
      hasStartedProcessing.current = false;
    }} />;
  }

  if (gateStatus !== "idle" && gateStatus !== "success" && gateStatus !== "has_key") {
    return (
      <MintingProgressModal
        step={gateStatus}
        isMinting={hasStartedProcessing.current}
        alreadyOwned={false}
        onClose={() => {
          setGateStatus("idle");
          hasStartedProcessing.current = false;
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
            disabled={hasStartedProcessing.current}
            className="w-full bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-500 hover:to-emerald-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-bold shadow-lg"
          >
            {hasStartedProcessing.current ? (
              <>
                <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              <>Get Free Key</>
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

