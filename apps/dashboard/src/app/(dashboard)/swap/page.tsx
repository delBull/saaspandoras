"use client";

import React, { useMemo } from "react";
import {
  PayEmbed,
  useActiveAccount,
} from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { defineChain } from "thirdweb/chains";
import Image from "next/image";
import { useActiveWalletChain } from "thirdweb/react";

const defaultChain = defineChain(8453); // Base Mainnet
const FEE_BPS = Number(
  process.env.NEXT_PUBLIC_SWAP_FEE_BPS || 50,
); // .env: 50 = 0.5%
const FEE_RECIPIENT =
  process.env.NEXT_PUBLIC_SWAP_FEE_WALLET || ""; // .env: recipient address

function TestnetBanner() {
  const chain = useActiveWalletChain();
  // Lista de testnet IDs comunes (agrega los que quieras)
  const TESTNET_IDS = [
    11155111, 84532, 421614, 534351, 80001, 5, 97,
  ];
  const chainName = (() => {
    switch (chain?.id) {
      case 11155111:
        return "Sepolia";
      case 84532:
        return "Base Sepolia";
      case 421614:
        return "Arbitrum Sepolia";
      case 534351:
        return "Scroll Sepolia";
      case 80001:
        return "Mumbai";
      case 5:
        return "Goerli";
      case 97:
        return "BSC Testnet";
      default:
        return "Testnet";
    }
  })();
  if (
    !chain ||
    !chain.id ||
    !TESTNET_IDS.includes(chain.id)
  )
    return null;
  return (
    <div className="bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-lg p-2 mb-4 text-center text-xs font-semibold">
      ⚠️ Estás conectado a una red de prueba ({chainName}).
      No uses fondos reales.
    </div>
  );
}



function Disclaimer() {
  return (
    <div className="mt-6 text-xs text-center text-gray-500 px-4 leading-relaxed">
      Swap: disclaimer,
            Este swap es ejecutado por protocolos y smart contracts externos a través de thirdweb. Las tasas, rutas y tiempos pueden variar. Haz tu propio research. No somos responsables por pérdidas o demoras,
          Este swap es ejecutado por protocolos y smart contracts externos a través de thirdweb. Las tasas, rutas y tiempos pueden variar. Haz tu propio research. No somos responsables por pérdidas o demoras.
    </div>
  );
}

function HelpLink() {
  return (
    <div className="mt-2 text-xs text-center">
      <a
        href="/ayuda"
        target="_blank"
        rel="noopener noreferrer"
        className="text-lime-600 underline font-semibold"
      >
        ¿Necesitas ayuda?
      </a>
    </div>
  );
}

export default function SwapPage() {
  const account = useActiveAccount();

  // Opcional: Personaliza para control avanzado del ConnectButton si no hay wallet.
  const walletConnected = !!account?.address;

  // PayEmbed no permite setear fee desde el frontend, pero puedes informar al usuario aquí.
  // La comisión real debe configurarse en https://thirdweb.com/dashboard/pay
  // El merchant fee/recipient mostrado es solo UX/UI informativo.
  const feeCaption = useMemo(() => {
    if (!FEE_BPS || !FEE_RECIPIENT) return null;
    return (
      <span>
        Se cobra una comisión de{" "}
        {(FEE_BPS / 100).toFixed(2)}% en cada swap.
        Destinada a&nbsp;
        <span className="underline decoration-dotted">
          el desarrollo y liquidez de la plataforma
        </span>
        .
      </span>
    );
  }, []);

  return (
    <section className="flex flex-col items-center justify-start min-h-[70vh] py-4 md:py-12 px-2 md:px-0">
      <div className="relative w-full max-w-md mx-auto">
        <div className="flex flex-col items-center">
          {/* Branding/logo opcional */}
          <Image
            src="/logo.svg"
            alt="Logo"
            width={56}
            height={56}
            className="mb-3"
            priority
          />
          <h1 className="text-2xl md:text-4xl font-bold text-white text-center mb-2">
            "swap:title", "Swap & Bridge de Tokens"
              "Swap & Bridge de Tokens"
          </h1>
          <p className="text-sm text-center text-gray-400 mb-4">
                  "swap:subtitle",
                  "Intercambia y puentea tokens entre redes EVM con la mejor tasa disponible.",
                
              : "Intercambia y puentea tokens entre redes EVM con la mejor tasa disponible."
          </p>
        </div>

        <TestnetBanner />

        <div className="bg-gradient-to-br from-[#18181b] to-[#23272d] rounded-3xl md:rounded-[2.5rem] p-3 md:p-6 shadow-2xl border-2 border-lime-300/10">
          {/* Error boundary/loading wrapper opcional */}
          <React.Suspense
            fallback={
              <div className="text-center text-gray-600 py-8">
                Cargando swap...
              </div>
            }
          >
            <PayEmbed
              client={client}
              theme="dark"
              connectOptions={{ chain: defaultChain }}
              style={{
                borderRadius: 24,
                border: "2px solid #A3E635",
                boxShadow: "0 4px 32px #bef26426",
                maxWidth: 500,
                margin: "0 auto",
              }}
              // Labels avanzados, puedes personalizar, internacionalizar, etc.
            />
          </React.Suspense>
        </div>

        <div className="mt-6 mb-2 text-xs text-center text-gray-400 px-4">
          {feeCaption}
        </div>

        <Disclaimer />

        <HelpLink />
      </div>
    </section>
  );
}
