/**
 * Resolves the payment strategy (Native vs ERC20) based on the chain.
 * Base (8453) defaults to USDC for these interactions.
 */
export function resolvePayment({
  chainId,
  totalValue
}: {
  chainId: number;
  totalValue: bigint;
}) {
  // Logic: Most chains use Native (ETH), but Base is configured for USDC
  const isNative = chainId !== 8453; 

  if (isNative) {
    return {
      value: totalValue,
      requiresApproval: false,
      token: 'ETH'
    };
  }

  // Base Chain USDC Logic
  return {
    value: 0n, // ERC20 transfers don't use 'value' in the call
    requiresApproval: true,
    token: 'USDC'
  };
}
