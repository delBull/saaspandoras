"use client";

import { useActiveAccount } from "thirdweb/react";
// CORREGIDO: Se importan las nuevas funciones de thirdweb v5
import { getContract, readContract } from "thirdweb";
import { getWalletBalance } from "thirdweb/wallets";
import { useEffect, useState } from "react";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";

// ABI mínimo para ERC20 balance
const ERC20_ABI = [
  {
    constant: true,
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

// Dirección de USDC en Base Sepolia
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const USDC_DECIMALS = 6;

export function WalletRows() {
  const account = useActiveAccount();
  const address = account?.address;

  const [eth, setEth] = useState<number | null>(null);
  const [usdc, setUsdc] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) {
        setEth(null);
        setUsdc(null);
        setLoading(false);
        return;
      }
      setLoading(true);

      console.log("Buscando saldos para la dirección:", address);
      console.log("Usando la red:", config.chain.name);

      // ETH nativo
      let ethBalance = 0;
      try {
        // CORREGIDO: Se usa la función getWalletBalance de v5
        const bal = await getWalletBalance({
          client,
          address,
          chain: config.chain,
        });
        ethBalance = parseFloat(bal.displayValue);
      } catch (error) {
        console.error("Error al obtener el saldo de ETH:", error);
        ethBalance = 0;
      }

      // USDC (ERC20)
      let usdcBalance = 0;
      try {
        const usdcContract = getContract({
          client,
          chain: config.chain,
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
        });

        // CORREGIDO: Se usa la función readContract de v5
        const balanceRaw = await readContract({
          contract: usdcContract,
          method: "balanceOf",
          params: [address],
        });

        usdcBalance = Number(balanceRaw) / 10 ** USDC_DECIMALS;
      } catch (error) {
        console.error("Error al obtener el saldo de USDC:", error);
        usdcBalance = 0;
      }

      setEth(ethBalance);
      setUsdc(usdcBalance);
      setLoading(false);
    };

    fetchBalances();
  }, [address]);

  if (!address) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
          Conecta tu wallet para ver tus saldos disponibles.
        </td>
      </tr>
    );
  }
  if (loading || eth === null || usdc === null) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
          Cargando saldos de tu wallet...
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="hover:bg-gray-800/50 transition">
        <td className="px-4 py-4 text-white">Wallet disponible</td>
        <td className="px-4 py-4 text-white">{eth.toFixed(4)} ETH</td>
        <td className="px-4 py-4 text-white"></td>
        <td className="px-4 py-4"></td>
      </tr>
      <tr className="hover:bg-gray-800/50 transition">
        <td className="px-4 py-4 text-white">Wallet disponible</td>
        <td className="px-4 py-4 text-white">{usdc.toFixed(2)} USDC</td>
        <td className="px-4 py-4 text-white"></td>
        <td className="px-4 py-4"></td>
      </tr>
    </>
  );
}