import { getWalletBalance } from "thirdweb/wallets";
import { client } from "./thirdweb-client";
import { defineChain } from "thirdweb/chains";
import { sendTransaction } from "thirdweb";
import { prepareContractCall } from "thirdweb/transaction";
import getThirdwebContract from "./get-contract";

interface UnwrapContractInfo {
  wrapped: `0x${string}`;
  unwrap: string;
}

const UNWRAP_CONTRACTS: Record<number, UnwrapContractInfo> = {
  1: { wrapped: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", unwrap: "withdraw" }, // WETH
  137: { wrapped: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", unwrap: "withdraw" }, // WMATIC/WPOL
  42161: { wrapped: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", unwrap: "withdraw" }, // WETH on Arbitrum
  10: { wrapped: "0x4200000000000000000000000000000000000006", unwrap: "withdraw" }, // WETH on Optimism
  8453: { wrapped: "0x4200000000000000000000000000000000000006", unwrap: "withdraw" }, // WETH on Base
  43114: { wrapped: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", unwrap: "withdraw" }, // WAVAX
  56: { wrapped: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", unwrap: "withdraw" }, // WBNB
  250: { wrapped: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83", unwrap: "withdraw" }, // WFTM
};

/**
 * Sugiere y ejecuta una transacción de "unwrap" si el usuario tiene un saldo suficiente del token envuelto.
 */
export async function showUnwrapPromptIfNeeded({
  owner,
  chainId,
  amount,
  activeAccount,
}: {
  owner: `0x${string}`;
  chainId: number;
  amount: bigint;
  activeAccount: any; // El objeto de cuenta activa de thirdweb
}): Promise<{ prompt: string; cta: string; action: () => Promise<`0x${string}`> } | null> {
  const unwrapInfo = UNWRAP_CONTRACTS[chainId];
  if (!unwrapInfo) return null;

  const getBalance = async (tokenAddress: `0x${string}`) => {
    const balance = await getWalletBalance({
      client,
      address: owner,
      chain: defineChain(chainId),
      tokenAddress,
    });
    return balance.value;
  };

  const wrappedBalance = await getBalance(unwrapInfo.wrapped);

  // Si el usuario tiene suficiente saldo del token envuelto, sugiere el unwrap.
  if (wrappedBalance >= amount) {
    return {
      prompt: `Acabas de recibir tokens "envueltos". ¿Quieres convertirlos a su versión nativa para usarlos en la red?`,
      cta: "Convertir a Nativo (Unwrap)",
      action: async () => {
        const contract = getThirdwebContract({
          address: unwrapInfo.wrapped,
          chainId,
          abi: [{
            type: 'function',
            name: unwrapInfo.unwrap,
            inputs: [{ name: 'wad', type: 'uint256' }],
            outputs: [],
            stateMutability: 'nonpayable',
          }],
        });
        const tx = prepareContractCall({ contract, method: unwrapInfo.unwrap, params: [amount] });
        const { transactionHash } = await sendTransaction({ transaction: tx, account: activeAccount });
        return transactionHash;
      },
    };
  }
  return null;
}