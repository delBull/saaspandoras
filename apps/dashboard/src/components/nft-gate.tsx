'use client';

import React, { useState, useEffect, useRef } from "react";
import { 
  useActiveAccount, 
  useReadContract, 
  useConnectModal,
  useSendTransaction
} from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { getContract, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { config } from "@/config";

import { MintingProgressModal } from "./nft-gating/minting-progress-modal";
import { SuccessNFTCard } from "./nft-gating/success-nft-card";
import { motion, AnimatePresence } from "framer-motion";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useToast } from "@saasfly/ui/use-toast";

export function NFTGate({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const { connect, isConnecting } = useConnectModal();
  const { mutate: sendTransaction, isPending: isMinting } = useSendTransaction();
  const { toast } = useToast();

  const [showInfo, setShowInfo] = useState(false);
  const [gateStatus, setGateStatus] = useState("idle");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const hasStartedProcessing = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { setShowInfo(false); } };
    if (showInfo) { document.addEventListener('keydown', handleKeyDown); }
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, [showInfo]);

  const contract = getContract({
    client,
    chain: config.chain,
    address: config.nftContractAddress,
    abi: PANDORAS_KEY_ABI,
  });

  const { data: hasKey, isLoading: isLoadingKey } = useReadContract({
    contract,
    method: "isGateHolder",
    params: account ? [account.address] : [ "0x0000000000000000000000000000000000000000" ],
    queryOptions: { enabled: !!account },
  });

  useEffect(() => {
    if (!account?.address || hasStartedProcessing.current) {
      return;
    }
    
    if (!isLoadingKey && hasKey) {
        setGateStatus("alreadyOwned");
        return;
    }

    if (!isLoadingKey && !hasKey) {
      hasStartedProcessing.current = true;
      setGateStatus("needs_mint");
      
      toast({
        title: "¡Bienvenido por primera vez!",
        description: "Confirma en tu wallet para mintear tu llave de acceso gratuita.",
      });

      const transaction = prepareContractCall({
        contract,
        method: "freeMint",
        params: [],
      });
      
      setGateStatus("awaiting_confirmation");
      void sendTransaction(transaction, {
        onSuccess: () => {
          setGateStatus("success");
          setShowSuccessAnimation(true);
        },
        onError: (error) => {
          console.error("Fallo al mintear Pandora's Key", error);
          toast({
            title: "Fallo en el Minteo",
            description: "Hubo un error al mintear tu llave de acceso. Por favor, intenta de nuevo.",
            variant: "destructive",
          });
          setGateStatus("error");
          hasStartedProcessing.current = false;
        },
      });
    }
  }, [account, hasKey, isLoadingKey, contract, sendTransaction, toast, gateStatus]);

  useEffect(() => {
    hasStartedProcessing.current = false;
  }, [account]);

  const explanation = ( <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="relative mt-4 text-sm text-gray-300 leading-relaxed bg-zinc-800/80 p-4 pr-8 rounded-lg border border-gray-700 max-w-md" > <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 rounded-full text-gray-500 hover:text-white transition-colors" aria-label="Cerrar información" > <XMarkIcon className="h-5 w-5" /> </button> <b className="text-white">¿Por qué solo algunas wallets son recomendadas?</b> <ul className="mt-4 list-disc pl-5 space-y-2 text-gray-400"> <li> Solo wallets como <b>MetaMask</b> y <b>Social Login</b> (Email, Google, etc.) soportan la tecnología de &quot;Smart Accounts&quot; que nos permite pagar el gas por ti de forma segura. </li> <li> Otras wallets (Phantom, 1inch, etc.) tienen restricciones técnicas que no permiten esta función por ahora. </li> <li> Para obtener tu llave 100% gratis y sin fricción, te recomendamos conectar usando una de las opciones del modal. </li> </ul> <div className="text-xs mt-3 text-gray-500 italic"> Esto es una limitación actual de la tecnología de las wallets, no un error de la aplicación. </div> </motion.div> );

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center p-4">
          <h2 className="text-2xl font-mono font-bold">Acceso Restringido</h2>
          <p className="mt-2 font-mono text-gray-400"> Conecta tu wallet para verificar tu llave de acceso. </p>
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowInfo(v => !v)} className="p-2 rounded-full text-gray-500 hover:text-gray-300 hover:bg-zinc-800 transition-colors" aria-label="Mostrar información sobre wallets compatibles" > <InformationCircleIcon className="h-6 w-6" /> </button>
              <button
                onClick={() => connect({ client, chain: config.chain, showThirdwebBranding: false, size: "compact", wallets: [ inAppWallet({ auth: { options: ["email", "google", "apple", "facebook", "passkey"], }, executionMode: { mode: "EIP7702", sponsorGas: true, }, }), createWallet("io.metamask"), ], })}
                disabled={isConnecting}
                className="bg-gradient-to-r from-lime-300 to-lime-400 text-gray-800 py-2 px-6 rounded-md hover:opacity-90 font-semibold transition"
              >
                {isConnecting ? "Conectando..." : "Connect Wallet"}
              </button>
            </div>
            <AnimatePresence> {showInfo && explanation} </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // CORREGIDO: Se cambia 'hasKey' por 'hasKey === true' para ser más explícito y satisfacer al linter.
  if (hasKey === true || gateStatus === "alreadyOwned" || gateStatus === "has_key") {
    return <>{children}</>;
  }
  
  if (gateStatus === "success" && showSuccessAnimation) {
    return <SuccessNFTCard onAnimationComplete={() => {
      setShowSuccessAnimation(false);
      setGateStatus("has_key"); 
      hasStartedProcessing.current = false;
    }} />;
  }

  if (gateStatus !== "idle" && gateStatus !== "success") {
    return (
      <MintingProgressModal 
        step={gateStatus}
        isMinting={isMinting}
        alreadyOwned={gateStatus === "alreadyOwned"}
        onClose={() => {
          setGateStatus("idle");
          hasStartedProcessing.current = false;
        }}
      />
    );
  }
  
  return null;
}