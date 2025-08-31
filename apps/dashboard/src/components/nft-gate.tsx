'use client';

import React, { useState, useEffect, useRef } from "react";
import { 
  useActiveAccount, 
  useReadContract, 
  useConnectModal,
  useSendTransaction
} from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { getContract, readContract, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { config } from "@/config";

import { MintingProgressModal } from "./nft-gating/minting-progress-modal";
import { SuccessNFTCard } from "./nft-gating/success-nft-card";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useToast } from "@saasfly/ui/use-toast";

export function NFTGate({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const { connect, isConnecting } = useConnectModal();
  const { mutate: sendTransaction, isPending: isMinting } = useSendTransaction();
  const { toast } = useToast();

  const [showInfo, setShowInfo] = useState(false);
  
  // CORREGIDO: Usamos el mismo patrón de dos estados que en el componente funcional
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
    
    // Si el hook ya nos dice que tiene la llave, terminamos el proceso.
    if (!isLoadingKey && hasKey) {
        setGateStatus("alreadyOwned");
        return;
    }

    // Si el hook termina y nos dice que NO tiene la llave, iniciamos el minteo.
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
          // CORREGIDO: Actualizamos ambos estados al tener éxito
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

  // Reset del flag de procesamiento si la cuenta cambia (ej. desconexión)
  useEffect(() => {
    hasStartedProcessing.current = false;
  }, [account]);

  const explanation = ( <motion.div /* Tu JSX de explicación no cambia */ >...</motion.div> );

  // --- LÓGICA DE RENDERIZADO ---

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

  // Si ya tiene la llave (verificado por el hook o por el estado), muestra el contenido del dashboard.
  if (hasKey || gateStatus === "alreadyOwned" || gateStatus === "has_key") {
    return <>{children}</>;
  }
  
  // Si el minteo fue exitoso, muestra la tarjeta animada de éxito.
  if (gateStatus === "success" && showSuccessAnimation) {
    return <SuccessNFTCard onAnimationComplete={() => {
      setShowSuccessAnimation(false);
      setGateStatus("has_key"); // Actualiza el estado para mostrar el contenido
      hasStartedProcessing.current = false;
    }} />;
  }

  // Muestra el modal de progreso para todos los estados intermedios.
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
  
  // Como fallback, no muestra nada si no encaja en ningún estado.
  return null;
}