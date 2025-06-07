"use client";

import {
  Web3Button,
  useContract,
  useToken,
  useAddress,
  useTokenBalance,
  useContractRead,
} from "@thirdweb-dev/react";
import { useState } from "react";
import { parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";

const VAULT_ADDRESS = "0xEb7b9fBF6dfE8Bfd94DA940f9615077Cd7F4b4C3";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export default function InvestPage() {
  const address = useAddress();

  // Contratos thirdweb
  const { contract: vault } = useContract(VAULT_ADDRESS);
  const usdcContract = useToken(USDC_ADDRESS);

  // Balances (usa primero el contrato, luego address)
  const { data: usdcBalance } = useTokenBalance(usdcContract, address);
  const { data: shareBalanceRaw } = useTokenBalance(vault, address);

  // Info del pool
  const { data: cap } = useContractRead(vault, "maxCap");
  const { data: totalDeposited } = useContractRead(vault, "totalDeposited");

  // Valor de shares en USDC (previewRedeem)
  const previewArg = shareBalanceRaw?.value && shareBalanceRaw.value.gt(0)
    ? shareBalanceRaw.value
    : BigNumber.from(0);
  const { data: sharesToUSDC } = useContractRead(vault, "previewRedeem", [previewArg]);

  const [noti, setNoti] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const capFormatted = cap ? Number(cap) / 1e6 : 0;
  const depositedFormatted = totalDeposited ? Number(totalDeposited) / 1e6 : 0;
  const poolLeft = cap && totalDeposited
    ? (Number(cap) - Number(totalDeposited)) / 1e6
    : capFormatted;
  const sharesUSDC = sharesToUSDC ? Number(sharesToUSDC) / 1e6 : 0;

  const isDisabled =
    !amount ||
    Number(amount) <= 0 ||
    !address ||
    (typeof poolLeft === "number" && Number(amount) > poolLeft);

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "0 auto",
        padding: 30,
      }}
    >
      <h1>Family &amp; Friends Investment Pool</h1>
      <p>
        Invierte en nuestro pool privado. Capital bloqueado por 6 meses. Lee términos antes de invertir.
      </p>

      <div
        style={{
          margin: "16px 0",
          background: "#f2f2f2",
          padding: 10,
          borderRadius: 8,
        }}
      >
        <strong>CAP global del Pool:</strong> {capFormatted.toLocaleString()} USDC
        <br />
        <strong>Total Invertido:</strong> {depositedFormatted.toLocaleString()} USDC
        <br />
        <strong>Espacio disponible:</strong> {poolLeft?.toLocaleString() ?? "0"} USDC
        <br />
        <strong>Tu posición en el Pool (shares):</strong> {shareBalanceRaw?.displayValue ?? "0"} {shareBalanceRaw?.symbol ?? ""}
        <br />
        <strong>Valor equivalente en USDC:</strong>{" "}
        {sharesUSDC.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        USDC
      </div>

      <form onSubmit={(e) => e.preventDefault()} style={{ marginTop: 20 }}>
        <label>
          Monto a invertir (USDC):{" "}
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ marginLeft: 4, marginRight: 8 }}
          />
        </label>

        <Web3Button
          contractAddress={USDC_ADDRESS}
          action={async (usdc) => {
            setError(null);
            try {
              if (!address) throw new Error("Conecta tu wallet");
              if (!vault) throw new Error("Vault contract not found");
              if (!amount || Number(amount) <= 0) throw new Error("Monto inválido");

              const parsed = parseUnits(amount, 6);
              await usdc.call("approve", [VAULT_ADDRESS, parsed]);
              await vault.call("deposit", [parsed, address]);

              setAmount("");
              setNoti("¡Inversión exitosa! Revisa tus shares en el pool.");
              setTimeout(() => setNoti(null), 5000);
            } catch (err) {
              setError((err as any)?.message || "Error desconocido");
            }
          }}
          isDisabled={isDisabled}
        >
          Invertir en el Pool
        </Web3Button>
      </form>

      <div style={{ marginTop: 16 }}>
        <strong>Tu balance USDC (testnet):</strong> {usdcBalance?.displayValue ?? "0"} {usdcBalance?.symbol ?? ""}
      </div>

      {noti && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            background: "#d8ffd1",
            color: "#227634",
            borderRadius: 8,
            border: "1px solid #b2ff99",
          }}
        >
          {noti}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            background: "#ffd6d6",
            color: "#bb2020",
            borderRadius: 8,
            border: "1px solid #e19898",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
