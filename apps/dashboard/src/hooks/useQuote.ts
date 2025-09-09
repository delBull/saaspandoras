"use client";

import { useEffect, useState } from "react";
import { simulateTransaction, readContract, type PreparedTransaction } from "thirdweb";
import { quoteExactInputSingle } from "thirdweb/extensions/uniswap";
import getThirdwebContract from "@/lib/get-contract";
import { UNISWAP_V3_FACTORY_ADDRESS, UNISWAP_V3_QUOTER_V2_ADDRESSES, type SupportedChainId } from "@/lib/uniswap-v3-constants";
import type { GetUniswapV3PoolResult } from "thirdweb/extensions/uniswap";
import { toast } from "sonner";

interface Token {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  image: string;
}

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

export interface UniswapQuote {
  loading: boolean;
  fee?: number;
  outputAmount?: bigint;
}

export default function useQuote({ chainId, tokenIn, tokenOut, amount }: { chainId: number, tokenIn?: Token | null, tokenOut?: Token | null, amount?: bigint }): UniswapQuote {
  const [loading, setLoading] = useState(false);
  const [fee, setFee] = useState<number | undefined>();
  const [outputAmount, setOutputAmount] = useState<bigint | undefined>();

  // Skip for Base if needed, but since Uniswap V3 is supported, proceed

  useEffect(() => {
    const refreshQuote = async () => {
      // Type guard to ensure chainId is supported
      const isSupportedChain = (id: number): id is SupportedChainId => {
        return Object.prototype.hasOwnProperty.call(UNISWAP_V3_QUOTER_V2_ADDRESSES, id);
      };

      if (!tokenIn || !tokenOut || !amount || !isSupportedChain(chainId)) {
        setFee(undefined);
        setOutputAmount(undefined);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const factoryContract = getThirdwebContract({ address: UNISWAP_V3_FACTORY_ADDRESS, chainId, abi: factoryAbi });
        let pools: GetUniswapV3PoolResult[] = [];
        
        if (pools.length === 0) { // Simple cache avoidance for now
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
            } catch (e: unknown) {
              // Gracefully ignore the AbiDecodingZeroDataError, as it simply means the pool doesn't exist for this fee.
              if (e instanceof Error && !e.message.includes("AbiDecodingZeroDataError") && !e.message.includes("client.request is not a function")) {
                console.warn(`Failed to get pool for fee ${fee} on chain ${chainId}:`, e.message);
              }
            }
            return null;
          });

          const results = await Promise.all(promises);
          pools = results.filter((p): p is GetUniswapV3PoolResult => p !== null);
        }
  
        if (pools.length === 0) {
          toast.error("No path found for this token pair");
          setLoading(false);
          return;
        }

        const quoterContract = getThirdwebContract({ address: UNISWAP_V3_QUOTER_V2_ADDRESSES[chainId], chainId });

        const results = await Promise.all(
          pools.map(async (pool: GetUniswapV3PoolResult) => {
            const quoteTx: PreparedTransaction = quoteExactInputSingle({
              contract: quoterContract,
              tokenIn: tokenIn.address,
              amountIn: amount,
              tokenOut: tokenOut.address,
              fee: pool.poolFee,
              sqrtPriceLimitX96: 0n,
            });
            try {
              // The result of simulateTransaction can be of various types, we ensure it's a bigint.
              const simulation = await simulateTransaction({ transaction: quoteTx }) as { result: bigint };
              // It's safer to check if result exists and is a bigint.
              if (typeof simulation.result === 'bigint')
              return simulation.result;
            } catch (e) {
              console.error("Quote simulation failed for pool", pool.poolFee, e);
              return 0n;
            }
          })
        );

        // Find max output
        const maxOutput = results.reduce((max: bigint, current) => (current ?? 0n) > max ? (current ?? 0n) : max, 0n);
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

    const delayExecId = setTimeout(() => {
      void refreshQuote();
    }, 500);
    return () => clearTimeout(delayExecId);
  }, [tokenIn, tokenOut, amount, chainId]);

  return { loading, fee, outputAmount };
}