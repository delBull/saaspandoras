"use client";

import { useConnectModal, useActiveWallet } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import React, { useState, useEffect } from "react";
import { client } from "~/lib/thirdweb-client";
import { chain } from "~/lib/thirdweb-chain";
import { motion, AnimatePresence } from "framer-motion";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const FREEMINT_WALLETS = [
  "inApp",
  "io.metamask",
];

export function ConnectWalletButton() {
  const { connect, isConnecting } = useConnectModal();
  const wallet = useActiveWallet();
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

  if (wallet) {
    return null;
  }

  const explanation = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="relative mt-[30rem] md:mt-80 text-sm text-gray-300 leading-relaxed bg-zinc-800 p-4 pr-8 rounded-lg border border-gray-700 max-w-md"
    >
      <button 
        onClick={() => setShowInfo(false)}
        className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:text-white hover:bg-zinc-700 transition-colors"
        aria-label="Cerrar información"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>

      <b className="text-white">¿Por qué solo algunas wallets son recomendadas?</b>
      <ul className="mt-4 list-disc pl-5 space-y-2 text-gray-400">
        <li>
          Solo wallets como <b>MetaMask</b> y <b>Social Login</b> (Email, Google, etc.) soportan la tecnología de "Smart Accounts" que nos permite pagar el gas por ti de forma segura.
        </li>
        <li>
          Otras wallets (Phantom, 1inch, etc.) tienen restricciones técnicas que no permiten esta función por ahora.
        </li>
        <li>
          Para obtener tu llave 100% gratis y sin fricción, te recomendamos conectar usando una de las opciones del modal.
        </li>
      </ul>
      <div className="text-xs mt-3 text-gray-500 italic">
        Esto es una limitación actual de la tecnología de las wallets, no un error de la aplicación.
      </div>
    </motion.div>
  );

  const handleConnect = () => {
    connect({
      client,
      showAllWallets: false,
      chain,
      showThirdwebBranding: false,
      size: "compact",
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
        createWallet("io.metamask"),
      ],
    });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setShowInfo(v => !v)}
          className="rounded-full text-gray-500 hover:text-gray-300 hover:bg-zinc-800 transition-colors"
          aria-label="Mostrar información sobre wallets compatibles"
        >
          <InformationCircleIcon className="h-4 w-4" />
        </button>
        <motion.button
          onClick={handleConnect}
          disabled={isConnecting}
          className="relative flex items-center justify-center overflow-hidden rounded-[40px] cursor-pointer will-change-transform group"
          style={{
            boxShadow: "0px 0.7065919983928324px 0.7065919983928324px -0.625px rgba(0, 0, 0, 0.18456), 0px 1.8065619053231785px 1.8065619053231785px -1.25px rgba(0, 0, 0, 0.17997), 0px 3.6217592146567767px 3.6217592146567767px -1.875px rgba(0, 0, 0, 0.17241), 0px 6.8655999097303715px 6.8655999097303715px -2.5px rgba(0, 0, 0, 0.15889), 0px 13.646761411524492px 13.646761411524492px -3.125px rgba(0, 0, 0, 0.13064), 0px 30px 30px -3.75px rgba(0, 0, 0, 0.0625)",
            padding: "2px 16px",
            height: "min-content",
            width: "min-content",
          }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.25, ease: [0.12, 0.23, 0.5, 1] }}
        >
          <motion.div className="absolute inset-0 rounded-[40px]" style={{ backgroundColor: "rgb(60, 63, 68)" }} />
          <motion.div className="absolute inset-0 rounded-[40px]" style={{ backgroundColor: "rgb(90, 97, 101)" }} />
          <motion.div className="absolute inset-px rounded-[40px]" style={{ backgroundColor: "rgb(0, 0, 0)" }} whileHover={{ opacity: 0.75 }} transition={{ duration: 0.25, ease: [0.12, 0.23, 0.5, 1] }} />
          <div className="relative flex flex-row items-center justify-between p-0 w-full">
            <span className="z-10 text-[14px] leading-[1.7em] text-gray-200 whitespace-nowrap">
              Get your Pandora's Key
            </span>
            <span className="z-10 text-[14px] leading-[1.7em] text-gray-200 pl-2">
              {isConnecting ? "Conectando..." : "🔑"}
            </span>
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {showInfo && explanation}
      </AnimatePresence>
    </div>
  );
}