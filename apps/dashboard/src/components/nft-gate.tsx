'use client';

import {
  useActiveAccount,
  useReadContract,
  useConnectModal,
} from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { getContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { NFTGatingClient } from "./nft-gating/nft-gating-client";
import { Loader2 } from "lucide-react";
import { config } from "@/config";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";


export function NFTGate({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const { connect, isConnecting } = useConnectModal();
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowInfo(false);
      }
    };
    if (showInfo) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showInfo]);

  const contract = getContract({
    client,
    chain: config.chain,
    address: config.nftContractAddress,
    abi: PANDORAS_KEY_ABI,
  });

  const { data: hasKey, isLoading } = useReadContract({
    contract,
    method: "isGateHolder",
    params: account ? [account.address] : [ "0x0000000000000000000000000000000000000000" ],
    queryOptions: {
      enabled: !!account,
    },
  });

  const explanation = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="relative mt-4 text-sm text-gray-300 leading-relaxed bg-zinc-800/50 p-4 pr-8 rounded-lg border border-gray-700 max-w-md text-left"
    >
      <button 
        onClick={() => setShowInfo(false)}
        className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:text-white hover:bg-zinc-700 transition-colors"
        aria-label="Cerrar información"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
      <b className="text-white">¿Por qué solo algunas wallets son recomendadas?</b>
      <ul className="mt-2 list-disc pl-5 space-y-2 text-gray-400">
        <li>
          Solo wallets como <b>MetaMask</b> y <b>Social Login</b> soportan la tecnología que nos permite pagar el gas por ti de forma segura.
        </li>
        <li>
          Otras wallets tienen restricciones técnicas que no permiten esta función por ahora.
        </li>
      </ul>
    </motion.div>
  );

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
                onClick={() => setShowInfo(v => !v)}
                className="rounded-full text-gray-500 hover:text-gray-300 hover:bg-zinc-800 transition-colors"
                aria-label="Mostrar información sobre wallets compatibles"
              >
                <InformationCircleIcon className="h-5 w-5" />
              </button>

              <button
                onClick={() =>
                  connect({
                    client,
                    chain: config.chain,
                    wallets: [
                      inAppWallet({
                        auth: {
                          options: ["email", "google", "apple", "facebook", "passkey"],
                        },
                      }),
                      createWallet("io.metamask"),
                    ],
                  })
                }
                disabled={isConnecting}
                className="bg-gradient-to-r from-lime-300 to-lime-400 text-gray-800 py-2 px-6 rounded-md hover:opacity-90 font-semibold transition"
              >
                {isConnecting ? "Conectando..." : "Connect Wallet"}
              </button>
            </div>
            
            <AnimatePresence>
              {showInfo && explanation}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (hasKey) {
    return <>{children}</>;
  }

  return <NFTGatingClient />;
}