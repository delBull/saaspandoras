import { readContract } from "thirdweb";

/**
 * Robustly resolves the price of an artifact by trying multiple contract methods.
 * Now phase-aware to support tiered pricing in modular protocols.
 * Uses try/catch to prevent execution reverts from breaking the flow.
 */
export async function resolveArtifactPrice({
  contract,
  fallbackPrice,
  chainId,
  phaseIndex
}: {
  contract: any;
  fallbackPrice?: number;
  chainId?: number;
  phaseIndex?: number;
}) {
  // 1. Try getPhasePrice(index) - Modern Modular Protocol (ArtifactCollection)
  if (phaseIndex !== undefined) {
    try {
      const price = await readContract({
        contract,
        method: "function getPhasePrice(uint256) view returns (uint256)",
        params: [BigInt(phaseIndex)]
      });
      if (price !== undefined && BigInt(price.toString()) > 0n) {
        return { price: BigInt(price.toString()), source: 'getPhasePrice' };
      }
    } catch (e) {
      console.warn(`getPhasePrice(${phaseIndex}) read failed, trying legacy...`);
    }
  }

  // 2. Try licensePrice() - Legacy V1
  try {
    const price = await readContract({
      contract,
      method: "function licensePrice() view returns (uint256)",
      params: []
    });
    if (price !== undefined && BigInt(price.toString()) > 0n) {
      return { price: BigInt(price.toString()), source: 'licensePrice' };
    }
  } catch (e) {
    // console.warn("licensePrice() read failed, trying next fallback...", e);
  }

  // 3. Try price() - Generic ERC20/721
  try {
    const price = await readContract({
      contract,
      method: "function price() view returns (uint256)",
      params: []
    });
    if (price !== undefined && BigInt(price.toString()) > 0n) {
      return { price: BigInt(price.toString()), source: 'price' };
    }
  } catch (e) {
    // console.warn("price() read failed, using static fallback...", e);
  }

  // 4. Static Fallback from Phase/Project data
  // Logic: 
  // - Chain 1 (Mainnet) or 8453 (Base): Use 6 decimals if likely USDC/Stable
  // - Others (Sepolia, etc.): Use 18 decimals
  
  // Detection for USDC Mainnet specifically
  const isMainnetUSDC = chainId === 1 && contract?.address?.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  const isBaseStable = chainId === 8453 || chainId === 84532;
  
  const decimals = (isMainnetUSDC || isBaseStable) ? 1e6 : 1e18;

  return {
    price: BigInt(Math.round((fallbackPrice || 0) * decimals)),
    source: 'fallback'
  };
}
