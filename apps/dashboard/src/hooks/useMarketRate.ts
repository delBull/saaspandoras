'use client';

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useMarketRate(
  fromSymbol: string | undefined,
  toSymbol: string | undefined,
) {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    if (!fromSymbol || !toSymbol) {
      setRate(null);
      return;
    }

    const ids: Record<string, string> = {
      WETH: "weth", ETH: "ethereum", USDC: "usd-coin", DAI: "dai", USDT: "tether", MORPHO: "morpho"
    };

    const fromId = ids[fromSymbol.toUpperCase()];
    const toId = ids[toSymbol.toUpperCase()];

    if (!fromId || !toId) {
      setRate(null);
      return;
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${fromId},${toId}&vs_currencies=usd`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!data || !data[fromId]?.usd || !data[toId]?.usd) {
          setRate(null);
          return;
        }
        
        const fromUsd = data[fromId].usd;
        const toUsd = data[toId].usd;

        if (fromUsd > 0) {
          setRate(fromUsd / toUsd); // Ratio de precios: cuántos 'toToken' obtienes por 1 'fromToken'
        } else {
          setRate(null);
        }
      })
      .catch(() => setRate(null));
  }, [fromSymbol, toSymbol]);

  return rate;
}