// src/lib/tokens/baseTokenList.ts
import type { Token } from "@/types/token";

// Lista de tokens para depuración, enfocada en WETH, USDC y MORPHO en Base.
export const BASE_TOKENLIST: Token[] = [
  {
    name: "Ether",
    symbol: "ETH",
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    decimals: 18,
    chainId: 8453,
    logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  {
    name: "Wrapped Ether",
    symbol: "WETH",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
    chainId: 8453,
    logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913", // Dirección nativa de USDC en Base
    decimals: 6,
    chainId: 8453,
    logoURI: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
    image: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  },
  {
    name: "Morpho",
    symbol: "MORPHO",
    address: "0x1d9925232875b32352102e8151a3a5a7a793915c", // Dirección correcta de Morpho en Base
    decimals: 18,
    chainId: 8453,
    logoURI: "https://assets.coingecko.com/coins/images/27295/large/morpho-logo.png",
    image: "https://assets.coingecko.com/coins/images/27295/large/morpho-logo.png",
  },
];
