'use client';

import React, { useState, useEffect, useRef } from "react";
import {
  useActiveAccount,
  useReadContract,
  useConnectModal,
  useSendTransaction
} from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { getContract, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { config } from "@/config";
import Image from "next/image";

import { MintingProgressModal } from "./nft-gating/minting-progress-modal";
import { SuccessNFTCard } from "./nft-gating/success-nft-card";
import { useToast } from "@saasfly/ui/use-toast";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
// 🎮 IMPORTAR REFERRAL MODAL
import { ReferralModal } from "./ReferralModal";

export function NFTGate({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();
  const { toast } = useToast();

  // 🎮 ESTADO PARA REFERRAL MODAL
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [hasCheckedReferral, setHasCheckedReferral] = useState(false);

  // Connect modal con social login (gratuito) + MetaMask (para admins)
  const { connect } = useConnectModal();

  const [showInfo, setShowInfo] = useState(false);
  const [gateStatus, setGateStatus] = useState("idle");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const hasStartedProcessing = useRef(false);

  // Cookie management is now handled by usePersistedAccount hook in dashboard-client-wrapper
  // This ensures consistent session persistence across the entire application

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

  const { data: hasKey, isLoading: isLoadingKey, refetch } = useReadContract({
    contract,
    method: "isGateHolder",
    params: account ? [account.address] : [ "0x0000000000000000000000000000000000000000" ],
    queryOptions: { enabled: !!account },
  });

  // 🎮 Hook para manejar referral modal después de obtener key (SOLO UNA VEZ)
  useEffect(() => {
    if (!hasCheckedReferral && (gateStatus === "has_key" || gateStatus === "alreadyOwned")) {
      // Verificar localStorage si ya vio el modal
      const hasSeenModalKey = `pandoras_referral_modal_seen_${account?.address}`;
      const hasSeenModal = typeof window !== 'undefined' ? localStorage.getItem(hasSeenModalKey) : null;

      if (hasSeenModal) {
        console.log('ℹ️ Usuario ya vio el modal de referral, no se muestra de nuevo');
        setHasCheckedReferral(true);
        return;
      }

      // Verificar si hay parámetro ?ref= en la URL
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
          // Usuario llegó con referral link, mostrar modal (primera vez)
          setTimeout(() => {
            setShowReferralModal(true);
            setHasCheckedReferral(true);
          }, 1000);
        } else if (!hasSeenModal) {
          // Usuario nuevo sin referral, mostrar modal por si quiere ingresar manualmente (primera vez)
          setTimeout(() => {
            setShowReferralModal(true);
            setHasCheckedReferral(true);
          }, 1500);
        }
      }
    }
  }, [gateStatus, hasCheckedReferral, account?.address]);

  // Función para manejar el minteo manual
  const handleMint = () => {
    if (hasStartedProcessing.current) return;

    hasStartedProcessing.current = true;

    toast({
      title: "Minteando llave de acceso...",
      description: "Confirma en tu wallet para obtener tu llave de acceso.",
    });

    // Preparamos la transacción para el minteo.
    const transaction = prepareContractCall({
      contract,
      method: "freeMint",
      params: [],
    });

    // Actualizamos el estado para mostrar el modal de progreso.
    setGateStatus("awaiting_confirmation");

    // Enviamos la transacción y manejamos éxito/error.
    sendTransaction(transaction, {
        onSuccess: () => {
          setGateStatus("success");
          setShowSuccessAnimation(true);

          // Forzar refresh después del minteo exitoso para verificar el estado
          setTimeout(() => {
            void refetch();
          }, 2000); // Esperar para que se indexe en blockchain
        },
      onError: (error) => {
        console.error("Fallo al mintear Pandora's Key", error);

        // Mejor manejo de errores basado en el mensaje específico
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("Max per wallet reached") ||
            errorMessage.includes("exceeds max per wallet") ||
            errorMessage.includes("already minted")) {
          // Si ya tiene la llave, refrescamos la verificación
          toast({
            title: "Ya tienes tu llave",
            description: "Verificando tu estado...",
          });
          // Refrescamos la consulta para verificar de nuevo
          void refetch().then(() => {
            setGateStatus("alreadyOwned");
            hasStartedProcessing.current = false;
          });
        } else {
          // Para otros errores, mostramos el mensaje de fallo.
          toast({
            title: "Fallo en el Minteo",
            description: "Hubo un error al mintear tu llave de acceso. Por favor, intenta de nuevo.",
            variant: "destructive",
          });
          setGateStatus("error");
          hasStartedProcessing.current = false;
        }
      },
    });
  };

  useEffect(() => {
    // No ejecutar lógica si no hay cuenta
    if (!account) {
      return;
    }

    // Si la wallet ya tiene la llave, marcamos el estado y terminamos.
    if (!isLoadingKey && hasKey === true) {
      setGateStatus("alreadyOwned");
      return;
    }
  }, [account, hasKey, isLoadingKey]);
  
  useEffect(() => {
    // Este efecto resetea el bloqueo de "proceso iniciado" si el usuario cambia de cuenta.
    hasStartedProcessing.current = false;
  }, [account]);

  const explanation = (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="relative mt-4 text-sm text-gray-300 leading-relaxed bg-zinc-800/80 p-4 pr-8 rounded-lg border border-gray-700 max-w-md text-left" >
      <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:text-white hover:bg-zinc-700 transition-colors" aria-label="Cerrar información" >
        <XMarkIcon className="h-4 w-4" />
      </button>
      <b className="text-white">¿Por qué solo algunas wallets son recomendadas?</b>
      <ul className="mt-2 list-disc pl-5 space-y-2 text-gray-400">
        <li> Solo wallets como <b>MetaMask</b> y <b>Social Login</b> soportan la tecnología que nos permite pagar el gas por ti de forma segura. </li>
        <li> Otras wallets tienen restricciones técnicas que no permiten esta función por ahora. </li>
      </ul>
    </motion.div>
  );



  // No necesitamos conectar de nuevo, solo manejar minteo
  const adminAddresses = [
    "0x1234...abcd", // Reemplaza con tus addresses de admin reales
    "0x44d198d28a31fe897726ead9f67eefa59df7d6c8",
  ];
  const isAdmin = !!account && adminAddresses.includes(account.address?.toLowerCase());

  // --- LÓGICA DE RENDERIZADO ---

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center p-4">
          <h2 className="text-2xl font-mono font-bold">Acceso Restringido</h2>
          <p className="mt-2 font-mono text-gray-400">
            Conecta tu wallet para verificar tu llave de acceso.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInfo(prev => !prev)}
                className="p-2 rounded-full text-gray-500 hover:text-gray-300 hover:bg-zinc-800 transition-colors"
                aria-label="Mostrar información sobre wallets compatibles"
              >
                <InformationCircleIcon className="h-6 w-6" />
              </button>
              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={() =>
                    connect({
                      client,
                      chain: config.chain,
                      showThirdwebBranding: false,
                      wallets: [
                        inAppWallet({
                          auth: {
                            options: ["email", "google", "apple", "facebook", "passkey"],
                          },
                          executionMode: {
                            mode: "EIP7702",
                            sponsorGas: true,
                          },
                        }),
                      ],
                    })
                  }
                  className="w-full bg-gradient-to-r from-lime-300 to-lime-400 text-gray-800 py-2 px-6 rounded-md hover:opacity-90 font-semibold transition"
                >
                  🔑 Login Rápido (Gratis & Seguro)
                </button>

                <button
                  onClick={() =>
                    connect({
                      client,
                      chain: config.chain,
                      showThirdwebBranding: false,
                      wallets: [createWallet("io.metamask")],
                    })
                  }
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-6 rounded-md font-medium transition border border-orange-500/30"
                >
                  🦊 MetaMask (Pro)
                </button>
              </div>
            </div>
            <AnimatePresence>
              {showInfo && explanation}
            </AnimatePresence>
            <p className="text-xs text-gray-500 text-center mt-2">
              Email • Google • Apple • Facebook • Passkey
            </p>
          </div>

          {isAdmin && (
            <div className="bg-green-100 text-green-800 p-2 rounded mt-4 text-xs font-mono max-w-xs">
              ¡Hola, admin! Tu wallet tiene permisos elevados.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoadingKey && gateStatus !== 'success' && !hasStartedProcessing.current) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-12 h-12 animate-spin" />
        </div>
    );
  }

  if (gateStatus === "success" && showSuccessAnimation) {
    return <SuccessNFTCard onAnimationComplete={() => {
      setShowSuccessAnimation(false);
      setGateStatus("has_key"); 
      hasStartedProcessing.current = false;
    }} />;
  }

  // 🎮 INTEGRAR REFERRAL MODAL DESPUÉS DE OBTENER KEY
  if (hasKey === true || gateStatus === "alreadyOwned" || gateStatus === "has_key") {
    return (
      <>
        {children}
        {/* 🎮 REFERRAL MODAL PARA NUEVOS USUARIOS */}
        <ReferralModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          onReferralComplete={() => {
            // Después de procesar referido, continuar normalmente
            console.log('Referral processing complete, access granted');
          }}
        />
      </>
    );
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

  // Si no tiene la llave y no está en proceso de minteo, mostrar pantalla de minteo
  if (!isLoadingKey && hasKey === false) {
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
            <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido!</h2>
            <p className="text-gray-300 leading-relaxed">
              Para acceder, necesitas una <strong className="text-lime-400">Llave Pandora&apos;s Key</strong>.
              Este NFT te da acceso completo a la plataforma.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleMint}
              disabled={hasStartedProcessing.current}
              className="w-full bg-gradient-to-r from-lime-400 to-emerald-500 hover:from-lime-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-lime-500/25"
            >
              {hasStartedProcessing.current ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Minteando...
                </>
              ) : (
                <>Obtener Llave Gratuita</>
              )}
            </button>

            <div className="text-xs text-gray-400 bg-zinc-800/50 p-3 rounded-lg">
              <p className="mb-1">
                <strong className="text-lime-400">Gratis:</strong> El gas lo pagamos nosotros
              </p>
              <p>
                <strong className="text-lime-400">Ilimitada:</strong> Una llave por wallet
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
