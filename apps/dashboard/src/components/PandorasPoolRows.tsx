"use client";

import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { PANDORAS_POOL_ABI } from "@/lib/pandoras-pool-abi";
import { client } from "@/lib/thirdweb-client";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { config } from "@/config";
import Image from "next/image";

const NO_FUNDS_ICON = "/icons/no-funds.svg";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function PandorasPoolRows() {
  const account = useActiveAccount();

  // CORREGIDO: Se crea el objeto de contrato incondicionalmente.
  // Usamos una dirección de relleno si la del config no existe.
  // La opción 'enabled' de abajo evitará que se use.
  const contract = getContract({
    client,
    chain: config.chain,
    address: config.poolContractAddress || ZERO_ADDRESS,
    abi: PANDORAS_POOL_ABI,
  });

  const { data: stats, isLoading } = useReadContract({
    contract: contract, // Ahora nunca es undefined
    method: "getUserStats",
    // CORREGIDO: Se pasan los parámetros incondicionalmente, usando una dirección de relleno si no hay cuenta.
    params: [account?.address || ZERO_ADDRESS], // Ahora nunca es undefined
    queryOptions: {
      // Este es el verdadero interruptor: la query solo se ejecuta si hay una cuenta Y una dirección de contrato.
      enabled: !!account && !!config.poolContractAddress,
    },
  });

  if (!account) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
          Conecta tu wallet para ver tus inversiones.
        </td>
      </tr>
    );
  }

  if (isLoading) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
          Cargando datos de blockchain...
        </td>
      </tr>
    );
  }

  if (!stats) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
          No hay datos de inversión para tu cuenta.
        </td>
      </tr>
    );
  }

  const ethAmount = Number(stats[0]) / 1e18;
  const usdcAmount = Number(stats[1]) / 1e6;

  if (ethAmount === 0 && usdcAmount === 0) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
          <div className="flex flex-col items-center">
            <Image
              src={NO_FUNDS_ICON}
              alt="Sin inversión"
              width={56}
              height={56}
              className="mb-3 opacity-70"
            />
            <div className="mb-2 font-semibold text-lg text-gray-300">
              Aún no tienes inversiones en Pandora&apos;s Pool
            </div>
            <div className="text-sm mb-4 text-gray-400">
              Invierte con ETH o USDC para ver tus posiciones aquí.
            </div>
            <button
              className="bg-lime-700 text-white px-4 py-2 rounded hover:bg-lime-600 text-sm transition"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Ir a invertir
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {ethAmount > 0 && (
        <tr className="hover:bg-gray-800/50 transition">
          <td className="px-4 py-4 text-white">Pandora&apos;s Pool</td>
          <td className="px-4 py-4 text-white">{ethAmount.toFixed(4)} ETH</td>
          <td className="px-4 py-4 text-white flex items-center">
            N/A <ChevronRightIcon className="h-4 w-4 ml-2 text-gray-400" />
          </td>
          <td className="px-4 py-4">
            <button className="text-lime-300 hover:text-lime-200 transition">
              Ver Detalles
            </button>
          </td>
        </tr>
      )}
      {usdcAmount > 0 && (
        <tr className="hover:bg-gray-800/50 transition">
          <td className="px-4 py-4 text-white">Pandora&apos;s Pool</td>
          <td className="px-4 py-4 text-white">{usdcAmount.toFixed(2)} USDC</td>
          <td className="px-4 py-4 text-white flex items-center">
            N/A <ChevronRightIcon className="h-4 w-4 ml-2 text-gray-400" />
          </td>
          <td className="px-4 py-4">
            <button className="text-lime-300 hover:text-lime-200 transition">
              Ver Detalles
            </button>
          </td>
        </tr>
      )}
    </>
  );
}