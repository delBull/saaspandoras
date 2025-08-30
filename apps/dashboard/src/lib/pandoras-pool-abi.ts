export const PANDORAS_POOL_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getUserStats",
    "outputs": [
      { "internalType": "uint256", "name": "depositedETH", "type": "uint256" },
      { "internalType": "uint256", "name": "depositedUSDC", "type": "uint256" },
      { "internalType": "uint256", "name": "withdrawnETH", "type": "uint256" },
      { "internalType": "uint256", "name": "withdrawnUSDC", "type": "uint256" },
      { "internalType": "uint256", "name": "claimableUtilityETH", "type": "uint256" },
      { "internalType": "uint256", "name": "claimableUtilityUSDC", "type": "uint256" },
      { "internalType": "uint256", "name": "reinvestedETH", "type": "uint256" },
      { "internalType": "uint256", "name": "reinvestedUSDC", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
