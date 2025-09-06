'use client';

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import sha256 from "crypto-js/sha256";
import type { BuyWithCryptoQuote } from "thirdweb/pay"; // Asegúrate de tener @types/crypto-js instalado

interface Token {
  symbol: string;
  chainId: number;
}

interface UseSwapAnalyticsProps {
  event: string;
  address: string | undefined;
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  quote: BuyWithCryptoQuote | null | undefined;
  marketRate: number | null;
  txStatus?: "success" | "error" | "pending";
}

export function useSwapAnalytics({
  event,
  address,
  fromToken,
  toToken,
  fromAmount,
  quote,
  marketRate,
  txStatus,
}: UseSwapAnalyticsProps) {
  useEffect(() => {
    if (!event || !address) return;
    const walletHash = sha256(address).toString();
    track(event, {
      walletHash,
      fromToken: fromToken?.symbol ?? "N/A",
      fromChain: fromToken?.chainId ?? 0,
      toToken: toToken?.symbol ?? "N/A",
      toChain: toToken?.chainId ?? 0,
      fromAmount,
      toAmount: quote?.swapDetails?.toAmountWei ?? null,
      txStatus: txStatus ?? "N/A",
    });
  }, [event, address, fromToken, toToken, fromAmount, quote, marketRate, txStatus]);
}