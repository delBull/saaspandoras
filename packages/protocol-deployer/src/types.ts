// Tipos principales para el sistema SCaaS W2E

export type NetworkType = 'sepolia' | 'base';

export type TokenType = 'license' | 'utility' | 'governance';

export interface TokenConfig {
  name: string;                    // Token name (e.g., "Licencia Vista Horizonte")
  symbol: string;                  // Token symbol (e.g., "VHORA", "PHI_VH")
  maxSupply?: number;             // Maximum supply (for licenses)
  initialSupply?: number;         // Initial supply (for utility tokens)
  price?: string;                 // Price in wei (for licenses)
  feePercentage?: number;         // Transaction fee in basis points (for utility)
  decimals?: number;              // Token decimals (default 18)
  feeRecipient?: string;          // Address that receives transaction fees
}


export interface NFTPassConfig {
  name: string;
  symbol: string;
  maxSupply: string | number;
  price: string;
  owner: string;
  treasuryAddress?: string;
  oracleAddress?: string;
}

export interface W2EConfig {
  // Configuración general del protocolo
  protocolName: string;           // Nombre del protocolo/creación
  protocolCategory: string;       // Categoría (ej: "residencial", "comercial")

  // Configuración de tokens
  licenseToken: TokenConfig;      // Configuración del token de acceso
  utilityToken: TokenConfig;      // Configuración del token de utilidad

  // Configuración de gobernanza
  quorumPercentage: number;       // Minimum quorum for proposals (0-100)
  votingDelaySeconds: number;     // Delay before voting starts (in seconds)
  votingPeriodHours: number;      // Voting period in hours
  executionDelayHours: number;    // Delay before execution in hours
  emergencyPeriodHours: number;   // Emergency inactivity period in hours
  emergencyQuorumPct: number;     // Emergency quorum percentage (0-100)

  // Configuración económica y staking
  platformFeePercentage: number;  // Platform fee (0-1)
  stakingRewardRate: string;      // Staking reward rate per second (in wei)
  phiFundSplitPct: number;        // Percentage to PHI reward pool (0-100)
  maxLicenses: number;           // Maximum license supply
  treasurySigners: string[];     // Multi-sig signers

  // Configuración de distribución de capital
  creatorWallet: string;          // Creator wallet for initial payouts
  creatorPayoutPct: number;       // Percentage for creator from initial sale (0-100)
  targetAmount: string;           // Target amount for successful sale (in wei)
  payoutWindowSeconds: number;    // Time window for creator to claim payout

  // Configuración de fases y ciclo de vida
  inactivityThresholdSeconds: number; // Inactivity threshold for emergency releases

  // Configuración de red
  targetNetwork: NetworkType;    // Red de despliegue
}

export interface W2EDeploymentResult {
  licenseAddress: string;     // VHORA contract address
  phiAddress: string;         // PHI token contract address
  loomAddress: string;        // VHLoom logic contract address
  governorAddress: string;    // DAO Governor contract address
  treasuryAddress: string;    // Protocol Treasury contract address
  timelockAddress: string;    // Timelock contract address
  deploymentTxHash: string;   // Deployment transaction hash
  network: string;           // Target network
  chainId: number;           // Chain ID
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
