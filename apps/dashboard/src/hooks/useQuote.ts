"use client";

import { useEffect, useState } from "react";
import { simulateTransaction, readContract } from "thirdweb";
import { quoteExactInputSingle } from "thirdweb/extensions/uniswap";
import getThirdwebContract from "@/lib/get-contract";
import { UNISWAP_V3_FACTORY_ADDRESS, UNISWAP_V3_QUOTER_V2_ADDRESSES, SupportedChainId } from "@/lib/uniswap-v3-constants";
type Token = {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  image: string;
};
import { toast } from "sonner";
import { GetUniswapV3PoolResult } from "thirdweb/extensions/uniswap";

const poolCache = new Map();

const factoryAbi = [
  {
    "inputs": [
      { "internalType": "address", "name": "tokenA", "type": "address" },
      { "internalType": "address", "name": "tokenB", "type": "address" },
      { "internalType": "uint24", "name": "fee", "type": "uint24" }
    ],
    "name": "getPool",
    "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

type QuoteResult = {
  loading: boolean;
  fee?: number;
  outputAmount?: bigint;
};

export default function useQuote({ chainId, tokenIn, tokenOut, amount }: { chainId: SupportedChainId, tokenIn?: Token, tokenOut?: Token, amount?: bigint }): QuoteResult {
  const [loading, setLoading] = useState(false);
  const [fee, setFee] = useState<number | undefined>();
  const [outputAmount, setOutputAmount] = useState<bigint | undefined>();

  // Skip for Base if needed, but since Uniswap V3 is supported, proceed

  useEffect(() => {
    const refreshQuote = async () => {
      if (!tokenIn || !tokenOut || !amount) {
        setFee(undefined);
        setOutputAmount(undefined);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const factoryContract = getThirdwebContract({ address: UNISWAP_V3_FACTORY_ADDRESS, chainId, abi: factoryAbi as any });
        const key = `${tokenIn.address}:${tokenOut.address}:${chainId}`;
        let pools: GetUniswapV3PoolResult[] = [];
        if (poolCache.has(key)) {
          pools = poolCache.get(key) as GetUniswapV3PoolResult[];
        } else {
          const fees = [500, 3000, 10000];
          const promises = fees.map(async (fee) => {
            try {
              // CORRECCIÓN: Usar la función readContract de Thirdweb, que ya conoce el client.
              const poolAddress = await readContract({
                contract: factoryContract,
                method: "function getPool(address, address, uint24) view returns (address)",
                params: [tokenIn.address, tokenOut.address, fee]
              });
              // The AbiDecodingZeroDataError happens when the pool doesn't exist and the contract returns '0x'.
              // A valid pool address will be a non-zero address.
              // We check for the zero address to be safe.
              const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
              if (poolAddress && poolAddress !== ZERO_ADDRESS) {
                return { poolAddress: poolAddress, poolFee: fee };
              }
            } catch (e: any) {
              // Gracefully ignore the AbiDecodingZeroDataError, as it simply means the pool doesn't exist for this fee.
              if (!e.message.includes("AbiDecodingZeroDataError")) {
                console.warn(`Failed to get pool for fee ${fee} on chain ${chainId}:`, e);
              }
            }
            return null;
          });

          const results = await Promise.all(promises);
          pools = results.filter((p): p is GetUniswapV3PoolResult => p !== null);
          poolCache.set(key, pools);
        }
  
        if (pools.length === 0) {
          toast.error("No path found for this token pair");
          setLoading(false);
          return;
        }

        const quoterContract = getThirdwebContract({ address: UNISWAP_V3_QUOTER_V2_ADDRESSES[chainId], chainId });

        const results: bigint[] = await Promise.all(
          pools.map(async (pool: GetUniswapV3PoolResult) => {
            const quoteTx = quoteExactInputSingle({
              contract: quoterContract,
              tokenIn: tokenIn.address,
              amountIn: amount,
              tokenOut: tokenOut.address,
              fee: pool.poolFee,
              sqrtPriceLimitX96: 0n,
            });
            try {
              const simulation = await simulateTransaction({ transaction: quoteTx });
              return simulation.result as bigint;
            } catch (e) {
              console.error("Quote simulation failed for pool", pool.poolFee, e);
              return 0n;
            }
          })
        );

        // Find max output
        const maxOutput = results.reduce((max, current) => current > max ? current : max, 0n);
        const bestPoolIndex = results.findIndex(r => r === maxOutput);
        const bestFee = pools[bestPoolIndex]?.poolFee ?? 0;

        if (maxOutput === 0n) {
          toast.error("No valid quote found for this pair");
          return;
        }

        setOutputAmount(maxOutput);
        setFee(bestFee);
      } catch (error) {
        console.error("Error refreshing quote:", error);
        toast.error("Failed to fetch quote");
      } finally {
        setLoading(false);
      }
    };

    const delayExecId = setTimeout(refreshQuote, 500);
    return () => clearTimeout(delayExecId);
  }, [tokenIn, tokenOut, amount, chainId]);

  return { loading, fee, outputAmount };
}