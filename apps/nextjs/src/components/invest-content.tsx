"use client";

import {
  ConnectButton,
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { parseUnits } from "ethers/lib/utils";
import { useState } from "react";
import { client } from "~/lib/thirdweb-client";
import { chain } from "~/lib/thirdweb-chain";
import { motion } from "framer-motion";
import type { Dictionary } from "~/types";

// Type definitions for error handling
interface ErrorWithMessage {
  message: string;
}

const VAULT_ADDRESS = "0xEb7b9fBF6dfE8Bfd94DA940f9615077Cd7F4b4C3";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const IMAGE_URL = "/images/coin_mobile.jpg";

export function InvestContent({ dict }: { dict: Dictionary }) {
  const account = useActiveAccount();
  const address = account?.address;

  const vaultContract = getContract({
    client,
    chain,
    address: VAULT_ADDRESS,
  });

  const usdcContract = getContract({
    client,
    chain,
    address: USDC_ADDRESS,
  });

  const { data: usdcRawBalance } = useReadContract({
    contract: usdcContract,
    method: "function balanceOf(address) view returns (uint256)",
    params: [address || "0x0000000000000000000000000000000000000000"],
  });

  const { data: shareRawBalance } = useReadContract({
    contract: vaultContract,
    method: "function balanceOf(address) view returns (uint256)",
    params: [address || "0x0000000000000000000000000000000000000000"],
  });

  const { mutateAsync: sendTx, isPending: isDepositing } = useSendTransaction();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatUnitsDisplay = (raw: bigint | undefined, decimals = 6) => {
    if (!raw) return "0";
    return (Number(raw) / 10 ** decimals).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const handleDeposit = async () => {
    setError(null);
    setSuccess(null);

    if (!account || !address) {
      setError("🔌 Conecta tu wallet primero");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("❌ Ingresa un monto válido");
      return;
    }

    try {
      const value = parseUnits(amount, 6).toBigInt();

      // 1. Approve USDC to Vault
      const approveTx = prepareContractCall({
        contract: usdcContract,
        method: "function approve(address spender, uint256 amount) returns (bool)",
        params: [VAULT_ADDRESS, value],
      });
      await sendTx(approveTx);

      // 2. Deposit into Vault
      const depositTx = prepareContractCall({
        contract: vaultContract,
        method: "function deposit(uint256 assets, address receiver) returns (uint256)",
        params: [value, address as `0x${string}`],
      });
      await sendTx(depositTx);

      setSuccess("✅ Inversión exitosa!");
      setAmount("");
    } catch (e) {
      const err = e as ErrorWithMessage;
      setError(err.message || "😕 Error desconocido");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col md:flex-row gap-8 p-6"
      style={{ maxWidth: 900, margin: "0 auto" }}
    >
      {/* IZQUIERDA: formulario y stats */}
      <div className="flex-1 space-y-6">
        <ConnectButton client={client} chain={chain} />

        <h1 className="text-3xl font-semibold">{dict.invest.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {dict.invest.description}
        </p>

        {/* Estadísticas sin fondo blanco */}
        <div className="grid grid-cols-1 gap-4 text-gray-700 dark:text-gray-200">
          <div>
            <strong>{dict.invest.shares}:</strong>{" "}
            {formatUnitsDisplay(shareRawBalance as bigint | undefined)} SHARES
          </div>
          <div>
            <strong>{dict.invest.balance}:</strong>{" "}
            {formatUnitsDisplay(usdcRawBalance as bigint | undefined)} USDC
          </div>
        </div>

        {/* Input y botón animados */}
        <motion.div
          transition={{ type: "spring", stiffness: 300 }}
          className="flex items-center gap-4"
        >
          <label className="flex-1">
            <span className="block mb-1">{dict.invest.toinvest}</span>
            <motion.input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
               
              disabled={isDepositing}
              className="w-full px-3 py-2 border rounded-lg"
              whileFocus={{ scale: 1.02 }}
            />
          </label>
          <motion.button
            onClick={handleDeposit}
             
            disabled={!address || isDepositing || Number(amount) <= 0}
            className="px-6 py-2 bg-lime-300 text-black rounded-lg shadow"
            whileTap={{ scale: 0.95 }}
          >
            {isDepositing ? "Procesando..." : dict.invest.subtitle}
          </motion.button>
        </motion.div>

        {/* Mensajes */}
        {success && <div className="text-green-700">{success}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </div>

      {/* DERECHA: imagen */}
      <div
        className="hidden md:block flex-shrink-0"
        style={{
          width: 200,
          backgroundImage: `url(${IMAGE_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 12,
        }}
      />
    </motion.div>
  );
}
