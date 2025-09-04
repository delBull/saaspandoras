'use client';

import { useMemo } from "react";
import { formatUnits } from "viem";

// Busca recursivamente la primera clave de 'amount' que sea un número entero grande
function findBigIntLike(
  obj: any,
  keys = ["toAmountWei", "toAmountMinWei", "amountWei", "toAmount", "expectedOutput", "amount", "value"],
  maxDepth = 5,
): string | undefined {
  if (!obj || typeof obj !== "object" || maxDepth < 0) {
    return undefined;
  }
  for (const k of Object.keys(obj)) {
    if (
      keys.includes(k) &&
      obj[k] != null &&
      typeof obj[k] !== "object" &&
      String(obj[k]).match(/^\d+$/)
    ) {
      return String(obj[k]);
    }
    if (typeof obj[k] === "object") {
      const res = findBigIntLike(obj[k], keys, maxDepth - 1);
      if (res !== undefined) return res;
    }
  }
  return undefined;
}

interface DisplayToken {
  decimals: number;
}

export function useDisplayAmount(
  quote: any,
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