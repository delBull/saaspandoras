'use client';

import { useMemo } from "react";
import { formatUnits } from "viem";

// Se usa 'unknown' en lugar de 'any' para forzar la verificación de tipos.
function findBigIntLike(
  obj: unknown,
  keys = ["toAmountWei", "toAmountMinWei", "amountWei", "toAmount", "expectedOutput", "amount", "value"],
  maxDepth = 5,
): string | undefined {
  if (!obj || typeof obj !== "object" || maxDepth < 0) {
    return undefined;
  }

  for (const k of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[k];
    if (
      keys.includes(k) &&
      value != null &&
      typeof value !== "object" &&
      String(value).match(/^\d+$/)
    ) {
      return String(value);
    }
    if (typeof value === "object") {
      const res = findBigIntLike(value, keys, maxDepth - 1);
      if (res !== undefined) return res;
    }
  }
  return undefined;
}

interface DisplayToken {
  decimals: number;
  symbol?: string;
}

export function useDisplayAmount(
  quote: unknown, // Se cambia 'any' por 'unknown'
  toToken: DisplayToken | null,
  fallbackMsg = "0.0"
) {
  return useMemo(() => {
    if (!quote || !toToken) return fallbackMsg;
    const rawAmount = findBigIntLike(quote);
    if (rawAmount === undefined || rawAmount === null) return "Estimación no disponible";
    try {
      const asBigInt = BigInt(rawAmount);
      const formatted = formatUnits(asBigInt, toToken.decimals);
      return Number(formatted).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
    } catch {
      return "Estimación no disponible";
    }
  }, [quote, toToken, fallbackMsg]);
}