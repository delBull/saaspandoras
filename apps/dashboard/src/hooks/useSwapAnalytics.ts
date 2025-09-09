'use client';

import { useEffect } from "react";
import { track } from "@vercel/analytics/react";
import sha256 from "crypto-js/sha256";

interface GenericQuote {
  // Bridge quote from Bridge.Sell.quote has destinationAmount
  destinationAmount?: bigint;
  outputAmount?: bigint; // For Uniswap quote
}

interface Token {
  address: string;
  symbol: string;
  chainId: number;
}

interface UseSwapAnalyticsProps {
  event: string;
  address: string | undefined;
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  quote: GenericQuote | null | undefined;
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
      // Vercel Analytics doesn't support bigint, so we convert it to string.
      toAmount: (quote?.destinationAmount ?? quote?.outputAmount)?.toString() ?? null,
      txStatus: txStatus ?? "N/A",
    });
  }, [event, address, fromToken, toToken, fromAmount, quote, marketRate, txStatus]);
}