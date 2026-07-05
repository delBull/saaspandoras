export type ProtocolLifecycle =
  | "QUEUED" | "VALIDATING" | "FAILED_VALIDATE" | "VALIDATED"
  | "PREPARING" | "DEPLOYING_INFRASTRUCTURE" | "FAILED_INFRASTRUCTURE"
  | "INFRASTRUCTURE_DEPLOYED"
  | "MINTING_TOKENS" | "FAILED_MINT" | "MINT_COMPLETED"
  | "TRANSFERRING_OWNERSHIP" | "FAILED_OWNERSHIP"
  | "FINALIZED" | "UNRECOVERABLE";

export type BlockchainEnvironment =
  | "BASE_MAINNET" | "BASE_SEPOLIA"
  | "ETHEREUM" | "POLYGON" | "LOCAL";

export type ProtocolCapabilityType =
  | "IDENTITY" | "MEMBERSHIP" | "MARKETPLACE" | "MORTGAGE" | "LENDING"
  | "DAO" | "BRIDGE" | "RENTAL" | "GOVERNANCE" | "VOTING" | "TREASURY"
  | "REFERRAL" | "ANALYTICS" | "AI";

export type AuditActor =
  | "Founder" | "Worker" | "Cron" | "API" | "Railway" | "Admin";

export type CheckpointName =
  | "InfrastructureReady" | "MintCompleted"
  | "OwnershipTransferred" | "DAOConfigured" | "TreasuryReady";

export interface ProtocolRuntime {
  id: number;
  projectId: number;
  lifecycle: ProtocolLifecycle;
  protocolVersion: number;
  runtimeVersion: string | null;
  engineVersion: string | null;
  environment: BlockchainEnvironment;
  salt: string | null;
  factoryAddress: string | null;
  creatorWallet: string | null;
  retryCount: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProtocolArtifact {
  id: number;
  runtimeId: number;
  role: string;
  address: string | null;
  transactionHash: string | null;
  deployedAt: Date | null;
  artifactType: string | null;
  metadata: Record<string, unknown>;
}

export interface ProtocolCapability {
  id: number;
  runtimeId: number;
  capability: ProtocolCapabilityType;
  enabledAt: Date;
  metadata: Record<string, unknown>;
}

export interface ProtocolVersion {
  id: number;
  semanticVersion: string;
  migration: string | null;
  compatibility: Record<string, unknown>;
  createdAt: Date;
}

export interface ProtocolTimelineEvent {
  id: number;
  runtimeId: number;
  fromState: ProtocolLifecycle | null;
  toState: ProtocolLifecycle;
  action: string;
  durationMs: number | null;
  gasUsed: string | null;
  effectiveGasPrice: string | null;
  blockNumber: number | null;
  confirmations: number | null;
  txHash: string | null;
  rpcLatencyMs: number | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface ProtocolAuditLog {
  id: number;
  runtimeId: number;
  action: string;
  actor: AuditActor;
  actorId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: Date;
}

export interface ProtocolRuntimeLock {
  id: number;
  runtimeId: number;
  workerId: string;
  acquiredAt: Date;
  heartbeatAt: Date;
  releasedAt: Date | null;
}

export interface ProtocolCheckpoint {
  id: number;
  runtimeId: number;
  checkpoint: CheckpointName;
  completedAt: Date;
  metadata: Record<string, unknown>;
}
