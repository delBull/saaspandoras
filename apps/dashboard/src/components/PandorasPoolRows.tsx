"use client";

import {
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import { getContract } from "thirdweb";
import { PANDORAS_POOL_ABI } from "@/lib/pandoras-pool-abi";
import { client } from "@/lib/thirdweb-client";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { config } from "@/config";

// Cambia por el SVG o icono que prefieras
const NO_FUNDS_ICON = "/icons/no-funds.svg";

export function PandorasPoolRows() {
  const account = useActiveAccount();

  if (!config.poolContractAddress) {
    return null;
  }

  const contract = getContract({
    client,
    chain: config.chain,
    address: config.poolContractAddress,
    abi: PANDORAS_POOL_ABI,
  });

  const { data: stats, isLoading } = useReadContract({
    contract,
    method: "getUserStats",
    params: account
      ? [account.address]
      : ["0x0000000000000000000000000000000000000000"],
    queryOptions: {
      enabled: !!account,
    },
  });

  // Estado: usuario no conectado
  if (!account) {
    return (
      <tr>
        <td
          colSpan={4}
          className="px-4 py-8 text-center text-gray-400"
        >
          Conecta tu wallet para ver tus inversiones.
        </td>
      </tr>
    );
  }

  // Estado: cargando datos
  if (isLoading) {
    return (
      <tr>
        <td
          colSpan={4}
          className="px-4 py-8 text-center text-gray-400"
        >
          Cargando datos de blockchain...
        </td>
      </tr>
    );
  }

  if (!stats) {
    // Puede ocurrir si la query falla o user nunca interactuó
    return (
      <tr>
        <td
          colSpan={4}
          className="px-4 py-8 text-center text-gray-400"
        >
          No hay datos de inversión para tu cuenta.
        </td>
      </tr>
    );
  }

    const ethAmount = Number(stats[0]) / 1e18;
    const usdcAmount = Number(stats[1]) / 1e6;


  // Estado: sin fondos en ninguna moneda
  if (ethAmount === 0 && usdcAmount === 0) {
    return (
      <tr>
        <td
          colSpan={4}
          className="px-4 py-12 text-center text-gray-400"
        >
          <div className="flex flex-col items-center">
            {/* Puedes poner aquí tu propio icono o imagen */}
            <img
              src={NO_FUNDS_ICON}
              alt="Sin inversión"
              className="w-14 h-14 mb-3 opacity-70"
              style={{ minWidth: 40, minHeight: 40 }}
            />
            <div className="mb-2 font-semibold text-lg text-gray-300">
              Aún no tienes inversiones en Pandora&apos;s
              Pool
            </div>
            <div className="text-sm mb-4 text-gray-400">
              Invierte con ETH o USDC para ver tus
              posiciones aquí.
            </div>
            <button
              className="bg-lime-700 text-white px-4 py-2 rounded hover:bg-lime-600 text-sm transition"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            >
              Ir a invertir
            </button>
          </div>
        </td>
      </tr>
    );
  }

  // Estado: sí hay fondos en alguna moneda, muestra las filas correspondientes
  return (
    <>
      {ethAmount > 0 && (
        <tr className="hover:bg-gray-800/50 transition">
          <td className="px-4 py-4 text-white">
            Pandora&apos;s Pool
          </td>
          <td className="px-4 py-4 text-white">
            {ethAmount.toFixed(4)} ETH
          </td>
          <td className="px-4 py-4 text-white flex items-center">
            N/A
            <ChevronRightIcon className="h-4 w-4 ml-2 text-gray-400" />
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
          <td className="px-4 py-4 text-white">
            Pandora&apos;s Pool
          </td>
          <td className="px-4 py-4 text-white">
            {usdcAmount.toFixed(2)} USDC
          </td>
          <td className="px-4 py-4 text-white flex items-center">
            N/A
            <ChevronRightIcon className="h-4 w-4 ml-2 text-gray-400" />
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
