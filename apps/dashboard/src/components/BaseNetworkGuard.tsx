'use client';

import { Button } from "@saasfly/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";

// --- Fix para TypeScript: Declarar el tipo global de window.ethereum ---
declare global { // --- TS fix: tipado window.ethereum en global para evitar TS2339 ---
  interface Window {
    ethereum?: {
      chainId?: string;
      request(args: {
        method: string;
        params?: unknown[];
      }): Promise<unknown>;
      on(
        event: string,
        handler: (chainId: string) => void,
      ): void;
      removeListener(
        event: string,
        handler: (chainId: string) => void,
      ): void;
    };
  }
}

const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_HEX = "0x2105"; // 8453 en formato hexadecimal

// Responsive hook (detecta móvil/pantalla pequeña)
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handler = () =>
      setIsMobile(window.innerWidth < breakpoint);
    handler();
    window.addEventListener("resize", handler);
    return () =>
      window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

function useEvmChainId(): number | null {
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined" || !window.ethereum)
      return;

    // Obtener el chainId inicial
    if (window.ethereum.chainId) {
      setChainId(parseInt(window.ethereum.chainId, 16));
    }

    // Manejador para cuando el usuario cambia de red en su wallet
    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
    };

    window.ethereum.on("chainChanged", handleChainChanged);

    // Limpiar el listener al desmontar el componente
    return () => {
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return chainId;
}

// Handler EIP-3085: fuerza cambio/agregado de red a Base
async function switchToBase() {
  if (!window.ethereum) {
    alert(
      "No se ha detectado una wallet EVM. Instala MetaMask u otra.",
    );
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_HEX }],
    });
  } catch (switchError: unknown) {
    // Código 4902 indica que la red no está agregada a la wallet
    if ((switchError as { code?: number }).code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BASE_CHAIN_HEX,
            chainName: "Base",
            nativeCurrency: { name: "Base ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://basescan.org"],
          }],
        });
      } catch (addError) {
        alert(
          "Error al agregar la red Base. Hazlo manual en tu wallet.",
        );
      }
    } else {
      alert(
        "No fue posible cambiar de red automáticamente.",
      );
    }
  }
}

// USO: envuelve <BaseNetworkModalGuard> en tu App/layout principal
export function BaseNetworkGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const chainId = useEvmChainId();
  const isBase = chainId === BASE_CHAIN_ID;
  const isMobile = useIsMobile(640);

  // Si ya está en base, muestra la app normal
  if (isBase) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2">
      <div
        className={`
          bg-white rounded-2xl shadow-2xl w-full max-w-md
          flex flex-col items-center px-6 py-8
          ${isMobile ? "max-w-full h-full justify-center" : ""}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Red Base obligatoria"
      >
        <Image
          src="https://cryptologos.cc/logos/base-base-logo.png"
          alt="Base Logo"
          width={64}
          height={64}
          className="w-16 h-16 mb-3"
        />
        <h2 className="text-xl sm:text-2xl font-bold text-orange-600 mb-2 text-center">
          Conéctate a la red Base
        </h2>
        <p className="text-gray-700 mb-4 text-center">
          Estás conectado a una red incompatible.
          <br />
          La aplicación solo funciona en{" "}
          <span className="font-semibold text-black">
            Base Mainnet (ID 8453)
          </span>
          .
        </p>
        <Button
          className="w-full max-w-xs bg-orange-600 text-white text-lg font-semibold rounded-lg mb-3"
          onClick={switchToBase}
        >
          Cambiar a Base
        </Button>
        {/* Spinner Overlay para UX while wallet responde */}
        <div className="my-3 flex items-center justify-center">
          <svg
            className="animate-spin h-6 w-6 text-orange-600 mr-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span className="text-orange-600 font-semibold">
            Esperando confirmación de wallet...
          </span>
        </div>
        <div className="text-xs text-gray-400 text-center">
          Si tienes problemas para cambiar, hazlo
          manualmente en tu wallet.
        </div>
        <div className="mt-8 flex flex-col items-center w-full">
          <span className="mb-2 text-sm text-gray-500">
            ¿No tienes la red Base?
          </span>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://basescan.org/"
            className="text-blue-600 underline text-sm"
          >
            Más información sobre Base
          </a>
        </div>
      </div>
    </div>
  );
}