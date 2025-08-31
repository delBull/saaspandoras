'use client';

import { useEffect, useState, useRef } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { getContract, readContract, prepareContractCall } from "thirdweb";
import { base } from "thirdweb/chains";
import { client } from "@/lib/thirdweb-client";
import { useToast } from "@saasfly/ui/use-toast";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { SuccessNFTCard } from "./success-nft-card";
import { MintingProgressModal } from "./minting-progress-modal";

const PANDORAS_KEY_CONTRACT_ADDRESS = "0xA6694331d22C3b0dD2d550a2f320D601bE17FBba";

export function NFTGatingClient() {
  const account = useActiveAccount();
  const { toast } = useToast();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [mintingStep, setMintingStep] = useState("idle");
  const hasStartedProcessing = useRef(false);

  useEffect(() => {
    const checkAndMint = async () => {
      // CORREGIDO: Se usa el encadenamiento opcional '?.'
      if (!account?.address || hasStartedProcessing.current) return;

      hasStartedProcessing.current = true;
      setMintingStep("checking_key");
      const address = account.address;
      
      try {
        const contract = getContract({ client, chain: base, address: PANDORAS_KEY_CONTRACT_ADDRESS, abi: PANDORAS_KEY_ABI });
        const hasKey = await readContract({ contract, method: "isGateHolder", params: [address] });

        if (!hasKey) {
          toast({ title: "First-time user detected!", description: "Please confirm the transaction in your wallet to mint your free access key." });
          setMintingStep("awaiting_confirmation");

          const transaction = prepareContractCall({ contract, method: "freeMint", params: [] });
          sendTransaction(transaction, {
            onSuccess: () => { setMintingStep("minting_success"); },
            onError: (error) => {
              console.error("Failed to mint Pandora's Key", error);
              toast({ title: "Minting Failed", description: "There was an error minting your access key. Please try again.", variant: "destructive" });
              setMintingStep("error");
            },
          });
        } else {
          setMintingStep("alreadyOwned");
        }
      } catch (error) {
        console.error("Failed to check Pandora's Key", error);
        toast({ title: "Verification Error", description: "Could not verify if you have an access key. Please try reconnecting.", variant: "destructive" });
        setMintingStep("error");
      }
    };

    // CORREGIDO: Se añade 'void' para manejar la promesa.
    void checkAndMint();
  }, [account, toast, sendTransaction]);

  useEffect(() => { hasStartedProcessing.current = false; }, [account]);

  if (mintingStep === "minting_success") { return ( <SuccessNFTCard onAnimationComplete={() => { window.location.reload(); }} /> ); }
  
  const isModalVisible = mintingStep !== "idle" && mintingStep !== "minting_success";
  if (isModalVisible) { return ( <MintingProgressModal step={mintingStep} isMinting={isPending} alreadyOwned={mintingStep === "alreadyOwned"} onClose={() => { setMintingStep("idle"); hasStartedProcessing.current = false; }} /> ); }
  
  return null;
}