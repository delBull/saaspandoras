import type { BlockchainEnvironment } from "./types";

export interface EnvironmentConfig {
  chainId: number;
  rpcUrlKey: string;
  explorerUrl: string;
  currency: string;
  factoryAddress: string;
  displayName: string;
}

const ENVIRONMENTS: Record<BlockchainEnvironment, EnvironmentConfig> = {
  BASE_MAINNET: {
    chainId: 8453,
    rpcUrlKey: "BASE_RPC_URL",
    explorerUrl: "https://basescan.org",
    currency: "ETH",
    factoryAddress: "0x1d0048De43Ec28d8B76D5705C33113Ab3de6bc65",
    displayName: "Base Mainnet",
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    rpcUrlKey: "BASE_SEPOLIA_RPC_URL",
    explorerUrl: "https://sepolia.basescan.org",
    currency: "ETH",
    factoryAddress: "",
    displayName: "Base Sepolia",
  },
  ETHEREUM: {
    chainId: 1,
    rpcUrlKey: "ETHEREUM_RPC_URL",
    explorerUrl: "https://etherscan.io",
    currency: "ETH",
    factoryAddress: "",
    displayName: "Ethereum Mainnet",
  },
  POLYGON: {
    chainId: 137,
    rpcUrlKey: "POLYGON_RPC_URL",
    explorerUrl: "https://polygonscan.com",
    currency: "MATIC",
    factoryAddress: "",
    displayName: "Polygon",
  },
  LOCAL: {
    chainId: 31337,
    rpcUrlKey: "LOCAL_RPC_URL",
    explorerUrl: "http://localhost:8545",
    currency: "ETH",
    factoryAddress: "",
    displayName: "Localhost",
  },
};

export function getEnvironmentConfig(env: BlockchainEnvironment): EnvironmentConfig {
  const config = ENVIRONMENTS[env];
  if (!config) {
    throw new Error(`Unknown blockchain environment: ${env}`);
  }
  return config;
}

export function getChainId(env: BlockchainEnvironment): number {
  return ENVIRONMENTS[env].chainId;
}

export function isEnvironmentSupported(env: string): env is BlockchainEnvironment {
  return env in ENVIRONMENTS;
}

export const SUPPORTED_ENVIRONMENTS = Object.keys(ENVIRONMENTS) as BlockchainEnvironment[];
