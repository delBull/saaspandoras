import { Address } from "thirdweb";

export const UNISWAP_V3_FACTORY_ADDRESS: Address = "0x1F98431c8aD98523631AE4a59f267346ea31F984" as const;

export const UNISWAP_V3_QUOTER_V2_ADDRESSES = {
  1: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e" as Address, // Ethereum
  10: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a" as Address, // Optimism
  137: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a" as Address, // Polygon
  42161: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a" as Address, // Arbitrum
  43114: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a" as Address, // Avalanche
  8453: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6" as Address, // Base (uses QuoterV1, but compatible)
} as const;

export const UNISWAP_V3_SWAP_ROUTER_02_ADDRESSES = {
  1: "0x2626664c2603336E57B271c5C0b26F421741e481" as Address, // Ethereum
  10: "0x2626664c2603336E57B271c5C0b26F421741e481" as Address, // Optimism
  137: "0x2626664c2603336E57B271c5C0b26F421741e481" as Address, // Polygon
  42161: "0x2626664c2603336E57B271c5C0b26F421741e481" as Address, // Arbitrum
  43114: "0x7EE5c5D7bC7cE0aCC0D3f0aD4D4E4b0a5c7D8E9" as Address, // Avalanche (custom if needed, but standard is same)
  8453: "0x2626664c2603336E57B271c5C0b26F421741e481" as Address, // Base
} as const;

export const SUPPORTED_CHAINS = [1, 10, 137, 42161, 43114, 8453] as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[number];

export function getUniswapV3Contracts(chainId: SupportedChainId) {
  return {
    factory: UNISWAP_V3_FACTORY_ADDRESS,
    quoter: UNISWAP_V3_QUOTER_V2_ADDRESSES[chainId],
    router: UNISWAP_V3_SWAP_ROUTER_02_ADDRESSES[chainId],
  };
}