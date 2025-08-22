'use client';

import { useEffect, useState } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { getContract, readContract, prepareContractCall } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "~/lib/thirdweb-client";
import { useToast } from "@saasfly/ui/use-toast";
import { PANDORAS_KEY_ABI } from "~/lib/pandoras-key-abi";
import { SuccessNFTCard } from "./success-nft-card"; // Import the new success card

const PANDORAS_KEY_CONTRACT_ADDRESS = "0x720F378209a5c68F8657080A28ea6452518f67b0";

export function NFTGatingMint() {
  const account = useActiveAccount();
  const { toast } = useToast();
  const { mutate: sendTransaction } = useSendTransaction();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    const checkAndMint = async () => {
      if (!account || !account.address || isProcessing) return;

      setIsProcessing(true);
      const address = account.address;
      console.log("Checking for Pandora's Key for address:", address);

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
          console.log("User does not have a key. Minting...");
          toast({
            title: "First-time user detected!",
            description: "Please confirm the transaction in your wallet to mint your free access key.",
          });

          const transaction = prepareContractCall({
            contract,
            method: "freeMint",
            params: [],
          });

          sendTransaction(transaction, {
            onSuccess: () => {
              console.log("Minting successful, showing animation.");
              setShowSuccessAnimation(true);
            },
            onError: (error) => {
              console.error("Failed to mint Pandora's Key", error);
              toast({
                title: "Minting Failed",
                description: "There was an error minting your access key. Please try again.",
                variant: "destructive",
              });
              setIsProcessing(false); // Reset for another try
            },
          });

        } else {
          console.log("User already has a key.");
          setIsProcessing(false); // Reset since no action was taken
        }
      } catch (error) {
        console.error("Failed to check Pandora's Key", error);
        toast({
          title: "Verification Error",
          description: "Could not verify if you have an access key. Please try reconnecting.",
          variant: "destructive",
        });
        setIsProcessing(false); // Reset on error
      }
    };

    checkAndMint();
  }, [account, isProcessing, toast, sendTransaction]);

  if (showSuccessAnimation) {
    return <SuccessNFTCard onAnimationComplete={() => {
      setShowSuccessAnimation(false);
      setIsProcessing(false); // Reset for next interaction
    }} />;
  }

  return null; // This component handles logic in the background and only shows the success animation
}