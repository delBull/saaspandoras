// Contratos desplegados en blockchain
export const CONTRACT_ADDRESSES = {
  // Mainnet addresses (actualizar con direcciones reales)
  PANDORAS_KEY: {
    base: "0xA6694331d22C3b0dD2d550a2f320D601bE17FBba",
  },
  GAMIFICATION_ERC1155: {
    ethereum: "0x...",
    base: "0x...",
    polygon: "0x...",
    arbitrum: "0x..."
  },
  STAKING_CONTROLLER: {
    ethereum: "0x...",
    base: "0x...",
    polygon: "0x...",
    arbitrum: "0x..."
  }
} as const;

// Función helper para obtener dirección por chain
export const getContractAddress = (contractName: keyof typeof CONTRACT_ADDRESSES, chainId: number) => {
  const chainName = {
    1: 'ethereum',      // Ethereum Mainnet
    8453: 'base',       // Base
    137: 'polygon',     // Polygon
    42161: 'arbitrum'   // Arbitrum
  }[chainId] as keyof typeof CONTRACT_ADDRESSES[keyof typeof CONTRACT_ADDRESSES];

  if (!chainName) return null;

  return CONTRACT_ADDRESSES[contractName][chainName];
};
