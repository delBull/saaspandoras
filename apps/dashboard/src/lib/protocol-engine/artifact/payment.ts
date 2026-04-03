/**
 * Resolves the payment strategy (Native vs ERC20) based on the chain.
 * Base (8453) defaults to USDC for these interactions.
 * Sepolia (11155111) defaults to ETH.
 */

export const CHAIN_TOKENS: Record<number, { symbol: string; address?: string; decimals: number }> = {
  8453: {
    symbol: 'USDC',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6
  },
  11155111: {
    symbol: 'ETH',
    decimals: 18
  }
};

export function resolvePayment({
  chainId,
  totalValue
}: {
  chainId: number;
  totalValue: bigint;
}) {
  const tokenConfig = CHAIN_TOKENS[chainId] || CHAIN_TOKENS[11155111]!; // Fallback to Sepolia ETH
  const isNative = !tokenConfig.address;

  if (isNative) {
    return {
      value: totalValue,
      requiresApproval: false,
      token: tokenConfig.symbol,
      decimals: tokenConfig.decimals
    };
  }

  // ERC20 Logic (e.g., Base USDC)
  return {
    value: 0n, // ERC20 transfers don't use 'value' in the call
    requiresApproval: true,
    token: tokenConfig.symbol,
    address: tokenConfig.address,
    decimals: tokenConfig.decimals
  };
}
