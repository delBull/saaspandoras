// Wallet contract addresses configuration
// This file contains contract addresses for different blockchain networks

export type ContractAddresses = Record<string, Record<number, string>>;

// Contract addresses for different networks
const CONTRACT_ADDRESSES: ContractAddresses = {
  PANDORAS_KEY: {
    // Ethereum Mainnet
    1: '0x0000000000000000000000000000000000000000', // Placeholder - to be updated
    // Base
    8453: '0xA6694331d22C3b0dD2d550a2f320D601bE17FBba', // Pandoras Key contract on Base
    // Polygon
    137: '0x0000000000000000000000000000000000000000', // Placeholder
    // Arbitrum
    42161: '0x0000000000000000000000000000000000000000', // Placeholder
  },
  // Add more contracts here as needed
};

/**
 * Get contract address for a specific contract and chain
 * @param contractName - Name of the contract (e.g., 'PANDORAS_KEY')
 * @param chainId - Chain ID of the network
 * @returns Contract address or placeholder if not configured
 */
export function getContractAddress(contractName: string, chainId: number): string {
  const contract = CONTRACT_ADDRESSES[contractName];
  if (!contract) {
    console.warn(`Contract ${contractName} not found in configuration`);
    return '0x...'; // Placeholder for missing contracts
  }

  const address = contract[chainId];
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    console.warn(`Contract ${contractName} not configured for chain ${chainId}`);
    return '0x...'; // Placeholder for unconfigured addresses
  }

  return address;
}

/**
 * Check if a contract is configured for a specific chain
 * @param contractName - Name of the contract
 * @param chainId - Chain ID of the network
 * @returns true if configured, false otherwise
 */
export function isContractConfigured(contractName: string, chainId: number): boolean {
  const address = getContractAddress(contractName, chainId);
  return address !== '0x...' && address !== '0x0000000000000000000000000000000000000000';
}
