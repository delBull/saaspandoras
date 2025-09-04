'use client';

import { useEffect, useState } from "react";
// ELIMINADO: 'toast' no se usaba en este archivo.
// import { toast } from "sonner";

// NUEVO: Se define una interfaz para la respuesta de la API de Coingecko.
// Esto elimina todos los errores de tipo 'unsafe'.
interface CoinGeckoPriceResponse {
  [id: string]: {
    usd: number;
  };
}

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
      .then((data: CoinGeckoPriceResponse) => { // Se aplica el tipo a 'data'
        // CORREGIDO: Se usa encadenamiento opcional para más seguridad.
        const fromUsd = data[fromId]?.usd;
        const toUsd = data[toId]?.usd;

        if (fromUsd && toUsd && toUsd > 0) {
          setRate(fromUsd / toUsd);
        } else {
          setRate(null);
        }
      })
      .catch(() => setRate(null));
  }, [fromSymbol, toSymbol]);

  return rate;
}