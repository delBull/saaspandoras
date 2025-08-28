'use client';

import { useEffect, useState, useRef } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { getContract, readContract, prepareContractCall } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "~/lib/thirdweb-client";
import { useToast } from "@saasfly/ui/use-toast";
import { PANDORAS_KEY_ABI } from "~/lib/pandoras-key-abi";
import { SuccessNFTCard } from "./success-nft-card";
import { MintingProgressModal } from "./minting-progress-modal";

const PANDORAS_KEY_CONTRACT_ADDRESS = "0xA6694331d22C3b0dD2d550a2f320D601bE17FBba";

export function NFTGatingMint() {
  const account = useActiveAccount();
  const { toast } = useToast();
  const { mutate: sendTransaction } = useSendTransaction();
  
  const [mintingStep, setMintingStep] = useState("idle");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const hasStartedProcessing = useRef(false);

  useEffect(() => {
    const checkAndMint = async () => {
      if (!account || !account.address || hasStartedProcessing.current) return;

      hasStartedProcessing.current = true;
      setMintingStep("checking_key");
      const address = account.address;

      try {
        const contract = getContract({
          client,
          chain: sepolia,
          address: PANDORAS_KEY_CONTRACT_ADDRESS,
          abi: PANDORAS_KEY_ABI,
        });

        const hasKey = await readContract({
          contract,
          method: "isGateHolder",
          params: [address],
        });

        if (!hasKey) {
          toast({
            title: "First-time user detected!",
            description: "Please confirm the transaction in your wallet to mint your free access key.",
          });
          setMintingStep("awaiting_confirmation");

          const transaction = prepareContractCall({
            contract,
            method: "freeMint",
            params: [],
          });

          sendTransaction(transaction, {
            onSuccess: () => {
              setMintingStep("success");
              setShowSuccessAnimation(true);
            },
            onError: (error) => {
              console.error("Failed to mint Pandora's Key", error);
              toast({
                title: "Minting Failed",
                description: "There was an error minting your access key. Please try again.",
                variant: "destructive",
              });
              setMintingStep("error");
            },
          });

        } else {
          setMintingStep("alreadyOwned");
        }
      } catch (error) {
        console.error("Failed to check Pandora's Key", error);
        toast({
          title: "Verification Error",
          description: "Could not verify if you have an access key. Please try reconnecting.",
          variant: "destructive",
        });
        setMintingStep("error");
      }
    };

    checkAndMint();
  }, [account, toast, sendTransaction]);

  // Reset processing flag when account changes
  useEffect(() => {
    hasStartedProcessing.current = false;
  }, [account]);

  if (mintingStep === "success" && showSuccessAnimation) {
    return (
      <SuccessNFTCard
        onAnimationComplete={() => {
          setShowSuccessAnimation(false);
          setMintingStep("idle");
          hasStartedProcessing.current = false;
        }}
      />
    );
  }

  if (mintingStep !== "idle" && mintingStep !== "success") {
    return (
      <MintingProgressModal
        step={mintingStep}
        alreadyOwned={mintingStep === "alreadyOwned"}
        onClose={() => {
          setMintingStep("idle");
          hasStartedProcessing.current = false;
        }}
      />
    );
  }

  return null;
}