"use client";

import * as React from "react";
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
import type { Dictionary } from "~/types";

interface Section {
  title: string;
  description: string;
  cap: string;
  total: string;
  available: string;
  shares: string;
  equivalent: string;
  toinvest: string;
  subtitle: string;
  balance: string;
}

const VAULT_ADDRESS = "0xEb7b9fBF6dfE8Bfd94DA940f9615077Cd7F4b4C3";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export function InvestContent({ dict }: { dict: Dictionary }) {
  const address = useAddress();

  const { contract: vault } = useContract(VAULT_ADDRESS);
  const usdcContract = useToken(USDC_ADDRESS);

  const { data: usdcBalance } = useTokenBalance(usdcContract, address);
  const { data: shareBalanceRaw } = useTokenBalance(vault, address);

  const { data: cap } = useContractRead(vault, "maxCap");
  const { data: totalDeposited } = useContractRead(vault, "totalDeposited");

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
      <h1>{dict.invest.title}</h1>
      <p>{dict.invest.description}</p>

      <div
        style={{
          margin: "16px 0",
          background: "#f2f2f2",
          padding: 10,
          borderRadius: 8,
        }}
      >
        <strong>{dict.invest.cap}:</strong> {capFormatted.toLocaleString()} USDC
        <br />
        <strong>{dict.invest.total}:</strong> {depositedFormatted.toLocaleString()} USDC
        <br />
        <strong>{dict.invest.available}:</strong> {poolLeft?.toLocaleString() ?? "0"} USDC
        <br />
        <strong>{dict.invest.shares}:</strong> {shareBalanceRaw?.displayValue ?? "0"} {shareBalanceRaw?.symbol ?? ""}
        <br />
        <strong>{dict.invest.equivalent}:</strong>{" "}
        {sharesUSDC.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        USDC
      </div>

      <form onSubmit={(e) => e.preventDefault()} style={{ marginTop: 20 }}>
        <label>
          {dict.invest.toinvest}:{" "}
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
          {dict.invest.subtitle}
        </Web3Button>
      </form>

      <div style={{ marginTop: 16 }}>
        <strong>{dict.invest.balance}:</strong> {usdcBalance?.displayValue ?? "0"} {usdcBalance?.symbol ?? ""}
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
