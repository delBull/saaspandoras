import { ethereum, base, polygon, arbitrum, type Chain } from "thirdweb/chains";

// Types for network configuration
export interface NetworkToken {
  name: string;
  symbol: string;
  isNative: boolean;
  address?: string;
}

export interface NetworkConfig {
  chain: Chain;
  name: string;
  symbol: string;
  tokens: NetworkToken[];
  description?: string;
  isActive: boolean;
}

// Centralized network configurations
export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    chain: ethereum,
    name: "Ethereum",
    symbol: "ETH",
    description: "Main Ethereum network",
    isActive: true,
    tokens: [
      {
        name: "Ethereum",
        symbol: "ETH",
        isNative: true
      },
      {
        name: "USD Coin",
        symbol: "USDC",
        isNative: false,
        address: "0xA0b86a33E6441a8d5ffF2f2C5A1A8A6FEa8E5A8E" // USDC on Ethereum
      },
      {
        name: "Tether",
        symbol: "USDT",
        isNative: false,
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" // USDT on Ethereum
      }
    ]
  },
  {
    chain: base,
    name: "Base",
    symbol: "ETH",
    description: "Base Layer 2 network",
    isActive: true,
    tokens: [
      {
        name: "Ethereum",
        symbol: "ETH",
        isNative: true
      },
      {
        name: "USD Coin",
        symbol: "USDC",
        isNative: false,
        address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" // USDC on Base
      }
    ]
  },
  {
    chain: polygon,
    name: "Polygon",
    symbol: "POL",
    description: "Polygon PoS network with POL token",
    isActive: true,
    tokens: [
      {
        name: "Polygon",
        symbol: "POL",
        isNative: true
      },
      {
        name: "USD Coin",
        symbol: "USDC",
        isNative: false,
        address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" // USDC on Polygon
      }
    ]
  },
  {
    chain: arbitrum,
    name: "Arbitrum",
    symbol: "ETH",
    description: "Arbitrum One Layer 2 network",
    isActive: true,
    tokens: [
      {
        name: "Ethereum",
        symbol: "ETH",
        isNative: true
      },
      {
        name: "USD Coin",
        symbol: "USDC",
        isNative: false,
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" // USDC on Arbitrum
      },
      {
        name: "Arbitrum",
        symbol: "ARB",
        isNative: false,
        address: "0x912CE59144191C1204E64559FE8253a0e49E6548" // ARB token
      }
    ]
  }
];

// Helper functions for network management
export const getActiveNetworks = (): NetworkConfig[] => {
  return SUPPORTED_NETWORKS.filter(network => network.isActive);
};

export const getNetworkByChain = (chainId: number): NetworkConfig | undefined => {
  return SUPPORTED_NETWORKS.find(network => network.chain.id === chainId);
};

export const getNetworkByName = (name: string): NetworkConfig | undefined => {
  return SUPPORTED_NETWORKS.find(network => network.name.toLowerCase() === name.toLowerCase());
};

// Default network (Ethereum)
export const DEFAULT_NETWORK = SUPPORTED_NETWORKS[0];

// Network icons and metadata (for future UI enhancements)
export const NETWORK_METADATA: Record<number, { color: string; icon?: string }> = {
  [ethereum.id]: { color: "#627eea" },
  [base.id]: { color: "#0052ff" },
  [polygon.id]: { color: "#8247e5" },
  [arbitrum.id]: { color: "#28a0f0" }
};