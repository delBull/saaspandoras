'use client';

import { useEffect, useState } from "react";

// Mapping de chainId a plataforma CoinGecko
const COINGECKO_PLATFORMS: Record<number, string> = {
  1: "ethereum",
  137: "polygon-pos",
  10: "optimistic-ethereum",
  42161: "arbitrum-one",
  8453: "base",
  56: "binance-smart-chain",
  43114: "avalanche",
  324: "zksync",
  1101: "polygon-zkevm",
  59144: "linea",
  100: "xdai",
  250: "fantom",
  // Agrega chains nuevas aquí si thirdweb las soporta
};

// Mapeo symbol-chainId (mayúsculas) -> { address, coingeckoId? }
const TOKEN_MAP: Record<string, { address: string; coingeckoId?: string }> = {
  // --- Ethereum Mainnet
  "ETH-1": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", coingeckoId: "ethereum" },
  "WETH-1": { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", coingeckoId: "weth" },
  "USDC-1": { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", coingeckoId: "usd-coin" },
  "USDT-1": { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", coingeckoId: "tether" },
  "DAI-1": { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", coingeckoId: "dai" },
  "WBTC-1": { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", coingeckoId: "wrapped-bitcoin" },

  // Polygon (137)
  "ETH-137": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-137": { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", coingeckoId: "weth" },
  "MATIC-137": { address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", coingeckoId: "matic-network" },
  "POL-137": { address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", coingeckoId: "pol" },
  "USDC-137": { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", coingeckoId: "usd-coin" },
  "USDT-137": { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", coingeckoId: "tether" },
  "DAI-137": { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", coingeckoId: "dai" },
  "WBTC-137": { address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", coingeckoId: "wrapped-bitcoin" },

  // Base (8453)
  "ETH-8453": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-8453": { address: "0x4200000000000000000000000000000000000006", coingeckoId: "weth" },
  "USDC-8453": { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", coingeckoId: "usd-coin" },
  "USDT-8453": { address: "0x2aeb6c9d4a9a94d7c3e2d3d3d3d3d3d3d3d3d3d3", coingeckoId: "tether" },
  "DAI-8453": { address: "0x50c5725949A6F0c72E6C4A641F24049A917DB0Cb", coingeckoId: "dai" },
  "MORPHO-8453": { address: "0x789190466E21a8b78b802786684c8410800318E4", coingeckoId: "morpho" },
  "WBTC-8453": { address: "0x2aeb6c9d4a9a94d7c3e2d3d3d3d3d3d3d3d3d3d3", coingeckoId: "wrapped-bitcoin" },

  // Optimism (10)
  "ETH-10": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-10": { address: "0x4200000000000000000000000000000000000006", coingeckoId: "weth" },
  "USDC-10": { address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", coingeckoId: "usd-coin" },
  "USDT-10": { address: "0x94b008aA00579C1307B0EF2c499aD98a8ce58e58", coingeckoId: "tether" },
  "DAI-10": { address: "0xda10009cBd5D07dd0CeCc66161FC93D7c9000da1", coingeckoId: "dai" },

  // Arbitrum One (42161)
  "ETH-42161": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-42161": { address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", coingeckoId: "weth" },
  "USDC-42161": { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", coingeckoId: "usd-coin" },
  "USDT-42161": { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", coingeckoId: "tether" },
  "DAI-42161": { address: "0xda10009cBd5D07dd0CeCc66161FC93D7c9000da1", coingeckoId: "dai" },

  // Binance Smart Chain (56)
  "ETH-56": { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", coingeckoId: "ethereum" },
  "WETH-56": { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", coingeckoId: "weth" },
  "USDC-56": { address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", coingeckoId: "usd-coin" },
  "USDT-56": { address: "0x55d398326f99059fF775485246999027B3197955", coingeckoId: "tether" },
  "DAI-56": { address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", coingeckoId: "dai" },

  // Avalanche (43114)
  "ETH-43114": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-43114": { address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", coingeckoId: "weth" },
  "USDC-43114": { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", coingeckoId: "usd-coin" },
  "USDT-43114": { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", coingeckoId: "tether" },
  "DAI-43114": { address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", coingeckoId: "dai" },

  // Agrega otros mappings según tu app
};

interface TokenInfo { symbol: string; address: string; chainId: number; }

type RateResult = number | null;

type CoinGeckoPriceResponse = Record<string, {
  usd?: number;
}>;

function getPlatform(chainId: number): string | undefined { return COINGECKO_PLATFORMS[chainId]; }

export function useMarketRate(
  fromToken: TokenInfo | undefined,
  toToken: TokenInfo | undefined
): RateResult {
  const [rate, setRate] = useState<RateResult>(null);

  useEffect(() => {
    let isCancelled = false;

    const fromKey = fromToken ? `${fromToken.symbol.toUpperCase()}-${fromToken.chainId}` : null;
    const toKey = toToken ? `${toToken.symbol.toUpperCase()}-${toToken.chainId}` : null;
    const fromMapped = fromKey ? TOKEN_MAP[fromKey] : null;
    const toMapped = toKey ? TOKEN_MAP[toKey] : null;

    if (!fromToken || !toToken || !fromMapped || !toMapped) {
      setRate(null);
      return;
    }

    const fetchPrice = async (token: TokenInfo, mappedToken: { address: string; coingeckoId?: string }): Promise<{ usd: number } | null> => {
      const platform = getPlatform(token.chainId);
      
      try {
        if (mappedToken.coingeckoId) {
          const url = `https://api.coingecko.com/api/v3/simple/price?ids=${mappedToken.coingeckoId}&vs_currencies=usd`;
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`CoinGecko API error for ID ${mappedToken.coingeckoId}: ${res.status}`);
          }
          const data = await res.json() as CoinGeckoPriceResponse;
          const price = data[mappedToken.coingeckoId]?.usd;
          if (typeof price === 'number' && isFinite(price)) {
            return { usd: price };
          }
          return null;
        }
        
        if (platform && mappedToken.address) {
          const url = `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${mappedToken.address}&vs_currencies=usd`;
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`CoinGecko API error for contract ${mappedToken.address} on ${platform}: ${res.status}`);
          }
          const data = await res.json() as CoinGeckoPriceResponse;
          const price = data[mappedToken.address.toLowerCase()]?.usd;
          if (typeof price === 'number' && isFinite(price)) {
            return { usd: price };
          }
          return null;
        }
      } catch (error) {
        console.warn(`Could not fetch price for ${token.symbol}-${token.chainId}:`, error);
        return null;
      }

      return null;
    };

    const fetchAllPrices = async () => {
      setRate(null); // Reset rate on new fetch
      try {
        const [fromRes, toRes] = await Promise.all([
          fetchPrice(fromToken, fromMapped),
          fetchPrice(toToken, toMapped),
        ]);

        if (isCancelled) return;

        if (fromRes && toRes && toRes.usd > 0) {
          const calculatedRate = fromRes.usd / toRes.usd;
          if (isFinite(calculatedRate)) {
            setRate(calculatedRate);
          } else {
            setRate(null);
          }
        } else {
          setRate(null);
        }
      } catch (error) {
        console.error('Error in fetchAllPrices:', error);
        setRate(null);
      }
    };

    void fetchAllPrices();

    return () => {
      isCancelled = true;
    };
  }, [fromToken, toToken]);

  return rate;
}