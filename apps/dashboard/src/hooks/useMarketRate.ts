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
  "DAI-1": { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", coingeckoId: "dai" },

  // Polygon (137)
  "ETH-137": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-137": { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619" },
  "USDC-137": { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
  "DAI-137": { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" },

  // Optimism (10)
  "ETH-10": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-10": { address: "0x4200000000000000000000000000000000000006" },
  "USDC-10": { address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" },
  "DAI-10": { address: "0xda10009cBd5D07dd0CeCc66161FC93D7c9000da1" },

  // Arbitrum One (42161)
  "ETH-42161": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-42161": { address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1" },
  "USDC-42161": { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
  "DAI-42161": { address: "0xda10009cBd5D07dd0CeCc66161FC93D7c9000da1" },

  // Base (8453)
  "ETH-8453": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-8453": { address: "0x4200000000000000000000000000000000000006" },
  "USDC-8453": { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },

  // Binance Smart Chain (56)
  "ETH-56": { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" },
  "USDC-56": { address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" },
  "DAI-56": { address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3" },

  // Avalanche (43114)
  "WETH-43114": { address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB" },
  "USDC-43114": { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" },
  "DAI-43114": { address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70" },

  // zkSync Era Mainnet (324)
  "ETH-324": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-324": { address: "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91" },
  "USDC-324": { address: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4" },
  "DAI-324": { address: "0x4C40aB6f92cD1cD6F4Ee347E4Ea3A204d4c1c6eE" },

  // Polygon zkEVM (1101)
  "ETH-1101": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-1101": { address: "0x0bD8C3c6f93c3b1d5867B31BdD4093f17ecCe2B5" },
  "USDC-1101": { address: "0xA8CE8aee21bE376A0D2cA0dA53B78a7eADeD6c05" },
  "DAI-1101": { address: "0x7b6e361F87AebD2113E0C6602322eA74ca6b4590" },

  // Linea (59144)
  "ETH-59144": { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
  "WETH-59144": { address: "0xb23C20EFcE6e24Acca0Cef9B7B7aA196b84EC942" },
  "USDC-59144": { address: "0xA219439258ca9d6A15eAFFF05c90Af0bDcBB0b11" },

  // Gnosis/xDAI (100)
  "WETH-100": { address: "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1" },
  "USDC-100": { address: "0xddafbb505ad214d7b80b1f830fcccc89b60fb7a3" },
  "DAI-100": { address: "0x44fa8e6f47987339850636f88629646662444217" },

  // Fantom (250)
  "ETH-250": { address: "0x74B23882a30290451A17c44f4F05243B6b58C76d" },
  "WETH-250": { address: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83" },
  "USDC-250": { address: "0x04068da6c83afcfa0e13ba15a6696662335d5b75" },
  "DAI-250": { address: "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E" },

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

useEffect(() => { if (!fromToken || !toToken) { setRate(null); return; }

const fromKey = `${fromToken.symbol.toUpperCase()}-${fromToken.chainId}`;
const toKey = `${toToken.symbol.toUpperCase()}-${toToken.chainId}`;
const fromMapped = TOKEN_MAP[fromKey];
const toMapped = TOKEN_MAP[toKey];

if (!fromMapped?.address || !toMapped?.address) {
  setRate(null);
  return;
}

const bothMainnet =
  fromToken.chainId === 1 &&
  toToken.chainId === 1 &&
  !!fromMapped.coingeckoId &&
  !!toMapped.coingeckoId;

if (bothMainnet) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${fromMapped.coingeckoId},${toMapped.coingeckoId}&vs_currencies=usd`;
  void fetch(url)
    .then(r => r.json() as Promise<CoinGeckoPriceResponse>)
    .then((data) => {
      const fromUsd = data[fromMapped.coingeckoId!]?.usd;
      const toUsd = data[toMapped.coingeckoId!]?.usd;
      if (fromUsd && toUsd && toUsd > 0) setRate(fromUsd / toUsd);
      else setRate(null);
    })
    .catch(() => setRate(null));
  return;
}

const fromPlatform = getPlatform(fromToken.chainId);
const toPlatform = getPlatform(toToken.chainId);

if (
  fromPlatform && toPlatform &&
  fromPlatform === toPlatform &&
  fromMapped.address &&
  toMapped.address
) {
  const url = `https://api.coingecko.com/api/v3/simple/token_price/${fromPlatform}?contract_addresses=${fromMapped.address},${toMapped.address}&vs_currencies=usd`;
  void fetch(url)
    .then(r => r.json() as Promise<CoinGeckoPriceResponse>)
    .then((data) => {
      const fromUsd = data[fromMapped.address.toLowerCase()]?.usd;
      const toUsd = data[toMapped.address.toLowerCase()]?.usd;
      if (fromUsd && toUsd && toUsd > 0) setRate(fromUsd / toUsd);
      else setRate(null);
    })
    .catch(() => setRate(null));
  return;
}

const fetchMixed = async () => {
    // La cláusula de guarda anterior asegura que fromMapped y toMapped están definidos.
    // TypeScript puede inferir esto porque `fetchMixed` es una expresión de función (const) y no se eleva (hoisted).
    try {
      let fromUsd: number | undefined;
      let toUsd: number | undefined;

      if (fromPlatform && fromMapped.address) {
        const url = `https://api.coingecko.com/api/v3/simple/token_price/${fromPlatform}?contract_addresses=${fromMapped.address}&vs_currencies=usd`;
        const data = await fetch(url).then(r => r.json()) as CoinGeckoPriceResponse;
        fromUsd = data[fromMapped.address.toLowerCase()]?.usd;
      } else if (fromMapped.coingeckoId) {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${fromMapped.coingeckoId}&vs_currencies=usd`;
        const data = await fetch(url).then(r => r.json()) as CoinGeckoPriceResponse;
        fromUsd = data[fromMapped.coingeckoId]?.usd;
      }

      if (toPlatform && toMapped.address) {
        const url = `https://api.coingecko.com/api/v3/simple/token_price/${toPlatform}?contract_addresses=${toMapped.address}&vs_currencies=usd`;
        const data = await fetch(url).then(r => r.json()) as CoinGeckoPriceResponse;
        toUsd = data[toMapped.address.toLowerCase()]?.usd;
      } else if (toMapped.coingeckoId) {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${toMapped.coingeckoId}&vs_currencies=usd`;
        const data = await fetch(url).then(r => r.json()) as CoinGeckoPriceResponse;
        toUsd = data[toMapped.coingeckoId]?.usd;
      }

      if (fromUsd && toUsd && toUsd > 0) {
        setRate(fromUsd / toUsd);
      } else {
        setRate(null);
      }
    } catch {
      setRate(null);
    }
  };

// Usamos una IIFE (Immediately Invoked Function Expression) para manejar la función asíncrona.
void fetchMixed();

}, [fromToken, toToken]);

return rate; }