import { readContract } from "thirdweb";

/**
 * Robustly resolves the price of an artifact by trying multiple contract methods.
 * Uses try/catch to prevent execution reverts from breaking the flow.
 */
export async function resolveArtifactPrice({
  contract,
  fallbackPrice,
  chainId
}: {
  contract: any;
  fallbackPrice?: number;
  chainId?: number;
}) {
  // 1. Try licensePrice()
  try {
    const price = await readContract({
      contract,
      method: "function licensePrice() view returns (uint256)",
      params: []
    });
    if (price !== undefined) return { price: BigInt(price.toString()), source: 'licensePrice' };
  } catch (e) {
    console.warn("licensePrice() read failed, trying next fallback...", e);
  }

  // 2. Try price()
  try {
    const price = await readContract({
      contract,
      method: "function price() view returns (uint256)",
      params: []
    });
    if (price !== undefined) return { price: BigInt(price.toString()), source: 'price' };
  } catch (e) {
    console.warn("price() read failed, using static fallback...", e);
  }

  // 3. Static Fallback from Phase/Project data
  // Base Mainnet (8453) is USDC (6 decimals), others (Sepolia, Ethereum) are Native (18 decimals)
  const decimals = (chainId === 8453) ? 1e6 : 1e18;

  return {
    price: BigInt(Math.round((fallbackPrice || 0) * decimals)),
    source: 'fallback'
  };
}
