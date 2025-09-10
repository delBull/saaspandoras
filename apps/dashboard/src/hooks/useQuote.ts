"use client";

import { useEffect, useState } from "react";
import type { Token } from "@/types/token";
import { simulateTransaction, readContract, type PreparedTransaction } from "thirdweb";
import { quoteExactInputSingle } from "thirdweb/extensions/uniswap";
import getThirdwebContract from "@/lib/get-contract";
import type { RouteResult } from "@/types/routes";
import {
  UNISWAP_V3_FACTORY_ADDRESS,
  UNISWAP_V3_QUOTER_V2_ADDRESSES,
  type SupportedChainId,
} from "@/lib/uniswap-v3-constants";
import { normalizeNativeToWrappedAddress } from "@/lib/normalizeToken";

export interface UniswapQuote {
  loading: boolean;
  fee?: number;
  outputAmount?: bigint;
  feeResults: RouteResult[];
  quoteError: string | null;
}

export default function useQuote({
  chainId,
  tokenIn,
  tokenOut,
  amount,
}: {
  chainId: number;
  tokenIn?: Token | null;
  tokenOut?: Token | null;
  amount?: bigint;
}): UniswapQuote {
  const [loading, setLoading] = useState(false);
  const [fee, setFee] = useState<number | undefined>();
  const [outputAmount, setOutputAmount] = useState<bigint | undefined>();
  const [feeResults, setFeeResults] = useState<RouteResult[]>([]);
  const [quoteError, setQuoteError] = useState<string | null>(null);


  useEffect(() => {
    const refreshQuote = async () => {
      const feesToTry = [500, 3000, 10000];
      setLoading(true);
      setQuoteError(null);
      setFeeResults([]);

      const isSupportedChain = (id: number): id is SupportedChainId => {
        return Object.prototype.hasOwnProperty.call(UNISWAP_V3_QUOTER_V2_ADDRESSES, id);
      };

      if (!tokenIn || !tokenOut || !amount || !isSupportedChain(chainId)) {
        setLoading(false);
        return;
      }

      const normalizedTokenInAddr = normalizeNativeToWrappedAddress(tokenIn, chainId);
      const normalizedTokenOutAddr = normalizeNativeToWrappedAddress(tokenOut, chainId);

      try {
        const factoryContract = getThirdwebContract({ address: UNISWAP_V3_FACTORY_ADDRESS, chainId, abi: factoryAbi });
        const pools: { poolFee: number; poolAddress: string }[] = [];

        for (const fee of feesToTry) {
          try {
            const poolAddress = await readContract({
              contract: factoryContract,
              method: "function getPool(address, address, uint24) view returns (address)",
              params: [normalizedTokenInAddr, normalizedTokenOutAddr, fee],
            });
            if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
              pools.push({ poolFee: fee, poolAddress });
            }
          } catch {
            // Pool no existe para ese fee, se ignora.
          }
        }

        const results: RouteResult[] = [];
        const quoterContract = getThirdwebContract({ address: UNISWAP_V3_QUOTER_V2_ADDRESSES[chainId], chainId });

        for (const { poolFee } of pools) {
          try {
            const quoteTx: PreparedTransaction = quoteExactInputSingle({
              contract: quoterContract,
              tokenIn: normalizedTokenInAddr,
              amountIn: amount,
              tokenOut: normalizedTokenOutAddr,
              fee: poolFee,
              sqrtPriceLimitX96: 0n,
            });
            const simulation = (await simulateTransaction({ transaction: quoteTx })) as { result: bigint };
            results.push({
              provider: "UniswapV3",
              label: `Uniswap V3 ${poolFee / 10000}%`,
              fee: poolFee,
              output: simulation.result,
              ok: true,
            });
          } catch (err) {
            results.push({
              provider: "UniswapV3",
              label: `Uniswap V3 ${poolFee / 10000}%`,
              fee: poolFee,
              output: 0n,
              ok: false,
              error: err,
            });
          }
        }

        setFeeResults(results);
        console.log("Resultados de simulación Uniswap V3:", results);

        const validPools = results.filter((x) => x.ok && x.output > 0n);

        if (validPools.length === 0) {
          setQuoteError("No hay pools Uniswap V3 con liquidez para este par/monto. Prueba otro par, monto o usa un bridge.");
          setFee(undefined);
          setOutputAmount(undefined);
        } else {
          const bestResult = validPools.reduce((a, b) => (a.output > b.output ? a : b));
          setFee(bestResult.fee);
          setOutputAmount(bestResult.output);
        }
      } catch (error) {
        setQuoteError("Algo falló al cotizar en Uniswap: " + (error instanceof Error ? error.message : ""));
      } finally {
        setLoading(false);
      }
    };
    const delayExecId = setTimeout(() => {
      void refreshQuote();
    }, 500);
    return () => clearTimeout(delayExecId);
  }, [tokenIn, tokenOut, amount, chainId]);

  return { loading, fee, outputAmount, feeResults, quoteError };
}

const factoryAbi = [
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" },
    ],
    name: "getPool",
    outputs: [{ internalType: "address", name: "pool", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;