import { useEffect, useState } from "react";
import type { TransactionReceipt, Chain } from "viem";
import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet, polygon, optimism, arbitrum, base, avalanche, bsc, fantom } from "viem/chains";

// Mapeo de chainId a objeto de cadena de viem
const chainMap: Record<number, Chain> = {
  1: mainnet,
  10: optimism,
  137: polygon,
  56: bsc,
  250: fantom,
  8453: base,
  42161: arbitrum,
  43114: avalanche,
};

function getViemClient(chainId: number): PublicClient {
  const chain = chainMap[chainId];
  if (!chain) {
    throw new Error(`Chain con ID ${chainId} no está soportada por el hook de confirmación.`);
  }
  return createPublicClient({ chain, transport: http() }) as PublicClient;
}

/**
 * React hook para monitorear la confirmación de una transacción en cualquier cadena EVM.
 * @param hash - El hash de la transacción a monitorear.
 * @param chainId - El ID de la cadena donde se envió la transacción.
 * @param onConfirm - Callback opcional que se ejecuta cuando la transacción se confirma.
 * @param pollingInterval - Intervalo de sondeo en milisegundos.
 * @returns El estado y el recibo de la transacción.
 */
export function useTxConfirmation({
  hash,
  chainId,
  onConfirm,
  pollingInterval = 4000,
}: {
  hash?: `0x${string}` | null;
  chainId: number;
  onConfirm?: (receipt: TransactionReceipt) => void;
  pollingInterval?: number;
}) {
  const [status, setStatus] = useState<"pending" | "confirmed" | "failed" | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);

  useEffect(() => {
    if (!hash || !chainId) {
      setStatus(null);
      return;
    }

    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      try {
        const viemClient: PublicClient = getViemClient(chainId);
        const r = await viemClient.getTransactionReceipt({ hash });
        if (r) {
          if (r.status === "success") {
            setStatus("confirmed");
            setReceipt(r);
            onConfirm?.(r);
          } else {
            setStatus("failed");
            setReceipt(r);
          }
          stopped = true; // Detener el sondeo una vez que se obtiene un recibo
        }
      } catch (e) { /* Seguir intentando */ }
      if (!stopped) setTimeout(poll, pollingInterval);
    };

    setStatus("pending");
    void poll();

    return () => { stopped = true; };
  }, [hash, chainId, pollingInterval, onConfirm]);

  return { status, receipt };
}