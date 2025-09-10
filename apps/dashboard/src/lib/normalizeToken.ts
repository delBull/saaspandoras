import type { Token } from "@/types/token";

// Tabla universal de conversiones nativo→wrapped (siempre upper case para symbol)
const WRAPPED_ADDRESSES: Record<number, Record<string, string>> = {
  1: { ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" }, // Ethereum
  137: {
    POL: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC is the canonical wrapped token for POL
    MATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
  }, // Polygon POL/MATIC
  42161: {
    ETH: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  }, // Arbitrum
  10: { ETH: "0x4200000000000000000000000000000000000006" }, // Optimism
  8453: {
    ETH: "0x4200000000000000000000000000000000000006",
  }, // Base
  43114: {
    AVAX: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  }, // Avalanche
  56: { BNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" }, // BNB Chain
  250: {
    FTM: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
  }, // Fantom
};

// Legacy nativo para Polygon, etc
const NATIVE_ALIAS: Record<number, string[]> = {
  137: [
    "0x0000000000000000000000000000000000001010", // MATIC/POL nativo legacy
  ],
};

/**
 * Normaliza la dirección de un token nativo a su equivalente ERC20 "wrapped".
 * Si el token no es nativo o no requiere normalización, devuelve su dirección original.
 * @param token - El objeto del token a normalizar.
 * @param chainId - El ID de la cadena.
 * @returns La dirección del token normalizada como `0x${string}`.
 */
export function normalizeNativeToWrappedAddress(
  token: Token,
  chainId: number,
): `0x${string}` {
  const symbol = token.symbol?.toUpperCase() ?? "";
  // 1. Polygon MATIC/POL tiene address legacy especial
  if (
    chainId === 137 &&
    (["POL", "MATIC"].includes(symbol) || NATIVE_ALIAS[137]?.includes(token.address.toLowerCase()))
  ) {
    return WRAPPED_ADDRESSES[137]!.MATIC as `0x${string}`;
  }
  // 2. Otras EVM
  if (WRAPPED_ADDRESSES[chainId]?.[symbol]) {
    return WRAPPED_ADDRESSES[chainId]![symbol] as `0x${string}`;
  }
  return token.address;
}