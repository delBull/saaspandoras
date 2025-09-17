"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@saasfly/ui/card";
import { Input } from "@saasfly/ui/input";
import { Button } from "@saasfly/ui/button";
import {
  useActiveAccount,
  useWalletBalance,
  useSendTransaction,
} from "thirdweb/react";
import { NATIVE_TOKEN_ADDRESS, Bridge } from "thirdweb";
import { parseUnits, formatUnits } from "viem";
import { defineChain } from "thirdweb/chains";
import { client } from "@/lib/thirdweb-client";

// Tipos para el resultado del Bridge de Thirdweb para dar claridad a TypeScript
interface BridgeQuote {
  originAmount: bigint;
  destinationAmount: bigint;
  steps?: RouteStep[];
}

interface RouteStep {
  action?: string;
  transactions?: any[];
}

const BASE_CHAIN_ID = 8453;
const BASE_USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ETH_TOKEN = {
  address: NATIVE_TOKEN_ADDRESS,
  symbol: "ETH",
  decimals: 18,
} as const;
const USDC_TOKEN = {
  address: BASE_USDC_ADDRESS,
  symbol: "USDC",
  decimals: 6,
} as const;

function useBridgeQuote({ amount }: { amount?: bigint }) {
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setQuote(null);

    const refreshQuote = async () => {
      if (!amount || amount === 0n || !account?.address) {
        setQuote(null);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await Bridge.Sell.quote({
          client,
          originTokenAddress: ETH_TOKEN.address,
          destinationTokenAddress: USDC_TOKEN.address,
          originChainId: BASE_CHAIN_ID,
          destinationChainId: BASE_CHAIN_ID,
          amount: amount,
        });
        if (cancelled) return;
        setQuote(result as unknown as BridgeQuote);
      } catch (error) {
        if (!cancelled) {
          setError(
            (error as Error)?.message ||
              "Error desconocido.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(() => {
      void refreshQuote();
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [amount, account]);
  return { loading, quote, error };
}

export default function UniswapClon() {
  const account = useActiveAccount();
  const { mutateAsync: sendTx } = useSendTransaction();

  // Estados visuales de feedback UI por paso
  const [approvalPending, setApprovalPending] =
    useState(false);
  const [approvalDone, setApprovalDone] = useState(false);
  const [approvalError, setApprovalError] = useState<
    string | null
  >(null);
  const [swapPending, setSwapPending] = useState(false);
  const [swapDone, setSwapDone] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(
    null,
  );
  const [swapSuccess, setSwapSuccess] = useState<
    string | null
  >(null);

  const [amount, setAmount] = useState<string>("");
  const [swapping, setSwapping] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { data: ethBalance, isLoading: isBalanceLoading } =
    useWalletBalance({
      client,
      address: account?.address ?? "",
      chain: defineChain(BASE_CHAIN_ID),
    });

  const amountInWei = useMemo(() => {
    if (
      !amount ||
      isNaN(Number(amount)) ||
      Number(amount) <= 0
    )
      return undefined;
    try {
      return parseUnits(amount, ETH_TOKEN.decimals);
    } catch {
      return undefined;
    }
  }, [amount]);

  const {
    loading: quoteLoading,
    quote,
    error: quoteError,
  } = useBridgeQuote({ amount: amountInWei });
  const quoteOut = useMemo(
    () => (quote ? quote.destinationAmount : undefined),
    [quote]
  );
  const canSwap =
    !quoteLoading &&
    account &&
    amountInWei &&
    quoteOut &&
    quoteOut > 0n &&
    !approvalPending &&
    !swapPending;

  // Handler robusto para feedback visual paso a paso
  const handleSwap = useCallback(async () => {
    setSwapError(null);
    setSwapSuccess(null);
    setTxHash(null);
    setApprovalPending(false);
    setApprovalDone(false);
    setApprovalError(null);
    setSwapPending(false);
    setSwapDone(false);

    if (!amountInWei || !account?.address || !quote) {
      setSwapError(
        "No hay cotización válida disponible para el swap.",
      );
      return;
    }
    setSwapping(true);

    try {
      const prepared = await Bridge.Sell.prepare({
        client,
        originTokenAddress: ETH_TOKEN.address,
        destinationTokenAddress: USDC_TOKEN.address,
        originChainId: BASE_CHAIN_ID,
        destinationChainId: BASE_CHAIN_ID,
        amount: amountInWei,
        receiver: account.address,
        sender: account.address,
      });

      // Ejecuta approvals primero si existen
      for (const step of prepared.steps ?? []) {
        const currentStep = step as RouteStep;
        if (currentStep.action?.toLowerCase() === "approval") {
          setApprovalError(null);
          setApprovalPending(true);
          setApprovalDone(false);
          for (const tx of step.transactions ?? []) {
            try {
              await sendTx(tx);
              setApprovalPending(false);
              setApprovalDone(true);
            } catch (err) {
              setApprovalPending(false);
              setApprovalError(
                err instanceof Error ? err.message : "Error en approval.",
              );
              setSwapping(false);
              return;
            }
          }
        }
      }
      // Ejecuta el swap (sell)
      for (const step of prepared.steps ?? []) {
        const currentStep = step as RouteStep;
        if (
          currentStep.action?.toLowerCase() === "sell" ||
          (!currentStep.action && Array.isArray(currentStep.transactions))
        ) {
          setSwapPending(true);
          for (const tx of step.transactions ?? []) {
            try {
              const res = await sendTx(tx);
              setSwapSuccess(
                `¡Swap exitoso! Tx: ${res.transactionHash}`,
              );
              setTxHash(res.transactionHash ?? null);
              setSwapDone(true);
            } catch (err) {
              setSwapPending(false);
              setSwapError(
                err instanceof Error ? err.message : "Error en swap.",
              );
              setSwapping(false);
              return;
            }
          }
          setSwapPending(false);
        }
      }
      if (!swapSuccess) {
        setSwapError(
          "No hay ruta DEX, solo rutas de pago están disponibles.",
        );
      } else {
        setAmount(""); // limpia input tras exito
      }
    } catch (err) {
      setSwapError(
        err instanceof Error ? err.message : "Error desconocido.",
      );
    } finally {
      setSwapping(false);
    }
  }, [amountInWei, account, quote, sendTx, swapSuccess]);

  if (!account) {
    return (
      <div className="max-w-md mx-auto p-6 text-center text-gray-400 border rounded-lg">
        <h3 className="text-lg font-medium mb-2">
          Conecta tu wallet
        </h3>
        <p>
          Conecta tu wallet para hacer swaps ETH → USDC en
          Base via thirdweb Universal Bridge
        </p>
      </div>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          Swap ETH a USDC (thirdweb Bridge)
        </CardTitle>
        <p className="text-center text-sm text-gray-500">
          Red: Base | Mejor ruta vía Universal Bridge
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input ETH */}
        <div className="space-y-2">
          <label htmlFor="amount-input" className="text-sm font-medium block">
            Monto a intercambiar
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="amount-input"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
              disabled={
                swapping || quoteLoading || isBalanceLoading
              }
              step="any"
              min="0"
            />
            <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded">
              ETH
            </span>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Saldo:{" "}
              {isBalanceLoading
                ? "..."
                : (ethBalance?.displayValue ?? "0.0")}{" "}
              ETH
            </p>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-blue-600"
              onClick={() => {
                if (ethBalance) {
                  setAmount(ethBalance.displayValue);
                }
              }}
            >
              MAX
            </Button>
          </div>
        </div>
        {/* Output USDC */}
        <div className="space-y-2">
          <label htmlFor="quote-output" className="text-sm font-medium block">
            Recibirás aproximadamente
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="quote-output"
              type="number"
              placeholder="0.0"
              value={
                quoteLoading
                  ? ""
                  : quoteOut && quoteOut > 0n
                    ? formatUnits(
                        quoteOut,
                        USDC_TOKEN.decimals,
                      )
                    : ""
              }
              className="flex-1 bg-gray-50"
              disabled
            />
            <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded">
              USDC
            </span>
          </div>
          {quoteLoading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Consultando mejor precio...
            </div>
          )}
          {quoteError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
              {quoteError}
            </div>
          )}
        </div>
        {/* Swap summary */}
        {quote &&
          quoteOut &&
          amountInWei &&
          quoteOut > 0n && (
            <div className="text-xs text-gray-600 space-y-1 p-3 bg-gray-50 rounded">
              <div>
                <strong>Protocolo:</strong> thirdweb
                Universal Bridge
              </div>
              <div>
                <strong>Protección slippage:</strong>{" "}
                automático
              </div>
              <div className="text-blue-600">
                <strong>Rate:</strong> 1 ETH ≈{" "}
                {(() => {
                  try {
                    const ethAmount = Number(formatUnits(amountInWei ?? 0n, ETH_TOKEN.decimals));
                    const usdcAmount = Number(formatUnits(quoteOut ?? 0n, USDC_TOKEN.decimals));
                    return ethAmount > 0 ? (usdcAmount / ethAmount).toFixed(2) : "-";
                  } catch {
                    return "-";
                  }
                })()}{" "}
                USDC
              </div>
            </div>
          )}
        {/* Visual feedback por paso */}
        <Button
          onClick={handleSwap}
          disabled={!canSwap || swapping || quoteLoading}
          className="w-full"
          size="lg"
          variant={canSwap ? "default" : "secondary"}
        >
          {approvalPending
            ? "1. Firma el approval en tu wallet…"
            : approvalDone && !swapDone
              ? "2. Firma el swap ETH→USDC…"
              : swapPending
                ? "Firmando el swap…"
                : swapping
                  ? "Confirmando..."
                  : quoteLoading
                    ? "Buscando mejor precio..."
                    : !canSwap ||
                        !quoteOut ||
                        quoteOut === 0n
                      ? "Sin liquidez disponible"
                      : `Swap ${amount || "0"} ETH → ${quoteOut ? formatUnits(quoteOut, USDC_TOKEN.decimals) : "0"} USDC`}
        </Button>
        {/* Estados visuales */}
        {approvalPending && (
          <div className="text-xs text-blue-600">
            Esperando firma approval…
          </div>
        )}
        {approvalError && (
          <div className="text-xs text-red-600">
            Error aprobación: {approvalError}
          </div>
        )}
        {swapPending && (
          <div className="text-xs text-blue-600">
            Firmando swap… confírmalo en tu wallet.
          </div>
        )}
        {swapError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {swapError}
          </div>
        )}
        {swapSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {swapSuccess}
            {txHash && (
              <div className="mt-2 text-xs">
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Ver transacción en Basescan →
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
