// Tipos principales para el sistema SCaaS W2E

export type NetworkType = 'sepolia' | 'base';

export type ArtifactType = 'Access' | 'Identity' | 'Membership' | 'Coupon' | 'Reputation' | 'Yield';

export interface TokenConfig {
  name: string;
  symbol: string;
  maxSupply?: number;
  initialSupply?: number;
  price?: string;
  feePercentage?: number;
  decimals?: number;
  feeRecipient?: string;
  type?: ArtifactType;             // V2
  standard?: 'ERC721' | 'ERC1155' | 'ERC20' | 'SBT'; // V2
  transferable?: boolean;          // V2
  burnable?: boolean;              // V2
}

export interface W2EConfig {
  protocolName: string;
  protocolCategory: string;

  // V1 compatibility (still used for main utility)
  licenseToken?: TokenConfig;
  utilityToken: TokenConfig;

  // V2 modular artifacts
  artifacts?: TokenConfig[];

  quorumPercentage: number;
  votingDelaySeconds: number;
  votingPeriodHours: number;
  executionDelayHours: number;
  emergencyPeriodHours: number;
  emergencyQuorumPct: number;

  platformFeePercentage: number;
  stakingRewardRate: string;
  phiFundSplitPct: number;
  maxLicenses: number;
  treasurySigners: string[];

  creatorWallet: string;
  creatorPayoutPct: number;
  targetAmount: string;
  payoutWindowSeconds: number;

  inactivityThresholdSeconds: number;
  targetNetwork: NetworkType;
}

export interface W2EDeploymentResult {
  licenseAddress?: string;    // V1 legacy
  phiAddress: string;
  loomAddress: string;
  governorAddress: string;
  treasuryAddress: string;
  registryAddress?: string;   // V2
  artifacts?: {               // V2
    type: ArtifactType;
    address: string;
  }[];
  timelockAddress: string;
  deploymentTxHash: string;
  network: string;
  chainId: number;
}

export interface ContractDeployment {
  address: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
}

export interface DeploymentConfig {
  network: NetworkType;
  config: W2EConfig;
  verifyContracts: boolean;
  saveToDatabase: boolean;
}

export interface OracleConfig {
  address: string;
  privateKey: string;
  gasLimit: number;
  priorityFee: string;
}

// Tipos para métricas y monitoreo
export interface W2EMetrics {
  licenseMetrics: {
    totalMinted: number;
    adoptionRate: number;
    tradingVolume: number;
  };
  daoMetrics: {
    activeProposals: number;
    totalVotesCast: number;
    averageQuorum: number;
  };
  phiMetrics: {
    totalSupply: number;
    burnedAmount: number;
    deflationRate: number;
  };
}

export interface ContractHealth {
  isHealthy: boolean;
  error?: string;
  lastChecked?: Date;
}

export interface HealthCheckResult {
  isHealthy: boolean;
  issues: string[];
  timestamp: Date;
}

// Tipos para eventos y auditoría
export interface W2EEvent {
  type: 'license_minted' | 'phi_minted' | 'proposal_created' | 'vote_cast' | 'work_certified';
  projectId: string;
  userAddress: string;
  data: Record<string, any>;
  timestamp: Date;
  transactionHash?: string;
}

export interface AuditLogEntry {
  id: string;
  projectId: string;
  action: string;
  userAddress: string;
  data: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

// Tipos para configuración de contratos
export interface ContractConfig {
  name: string;
  symbol: string;
  maxSupply?: number;
  initialSupply?: number;
  owner: string;
  pausable?: boolean;
  burnable?: boolean;
}

// Tipos para validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeploymentValidation extends ValidationResult {
  networkSupported: boolean;
  sufficientFunds: boolean;
  contractsCompiled: boolean;
}

// NFT Pass configuration (used by deploy-nft.ts and deploy-nft-server.ts)
export interface NFTPassConfig {
  name: string;
  symbol: string;
  maxSupply: number;
  price: string;           // ETH value as string e.g. "0" or "0.01"
  owner: string;           // Wallet address of the deployer/owner
  oracleAddress?: string;  // Defaults to owner wallet if not set
  treasuryAddress?: string; // Defaults to owner wallet if not set
  image?: string;          // DataURI or IPFS URL for NFT image
  transferable?: boolean;  // Default: true
  burnable?: boolean;      // Default: false
  artifactType?: ArtifactType; // V2 type classification
}

