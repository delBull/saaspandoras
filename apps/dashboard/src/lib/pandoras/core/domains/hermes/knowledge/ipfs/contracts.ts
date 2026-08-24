/**
 * 🌐 Pandora's Sovereign IPFS Stack — Contracts & Interfaces
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/contracts.ts
 */

export type IpfsProviderType = 'KUBO' | 'PINATA' | 'MOCK';

/**
 * Institutional Durability States for Sovereign Artifacts
 */
export type IpfsReplicationStatus = 
  | 'LOCAL_ONLY'   // Pinned only on primary Kubo node (no mirror required/configured)
  | 'REPLICATING'  // Primary OK, async mirror in flight
  | 'DURABLE'      // Satisfies required storage durability policy (primary + confirmed mirror)
  | 'DEGRADED'     // Primary OK, but required external backup mirror failed
  | 'FAILED';      // Primary and backup failed

/**
 * Storage categories that map to institutional durability policies
 */
export type ArtifactStorageCategory = 
  | 'PUBLIC_DOCUMENT'
  | 'KNOWLEDGE_VAULT'
  | 'CLAIM_CONTRACT'
  | 'AUDIT_SNAPSHOT'
  | 'AGENT_SOUL'
  | 'ACADEMY_RUBRIC';

/**
 * Durability requirements per artifact tier
 */
export interface StorageDurabilityPolicy {
  minReplicationCopies: number;
  requireExternalBackup: boolean;
  synchronousMirror: boolean;
  description: string;
}

export interface IpfsHealthStatus {
  ok: boolean;
  providerType: IpfsProviderType;
  version?: string;
  latencyMs: number;
  error?: string;
}

export interface SovereignIpfsHealth {
  overallOk: boolean;
  primary: IpfsHealthStatus;
  backup?: IpfsHealthStatus;
  replication: {
    primaryOnline: boolean;
    backupOnline: boolean;
    dualPinningEnabled: boolean;
  };
  durability: {
    status: IpfsReplicationStatus;
    clusterPeers?: number;
  };
}

export interface IpfsPinOptions {
  name?: string;
  category?: ArtifactStorageCategory;
  policyOverride?: Partial<StorageDurabilityPolicy>;
}

export interface IpfsPinResult {
  cid: string;
  ipfsUri: string;
  provider: IpfsProviderType;
  pinnedAt: string;
  backupCid?: string;
  backupMirrored?: boolean;
  replicationStatus: IpfsReplicationStatus;
  storageCategory?: ArtifactStorageCategory;
}

export interface IpfsProvider {
  readonly providerType: IpfsProviderType;
  
  /**
   * Pins a JSON object to IPFS, returning the canonical CIDv1.
   */
  pinJson(data: unknown, name?: string): Promise<string>;

  /**
   * Retrieves and parses a JSON object from IPFS by CID.
   */
  fetchJson<T = unknown>(cid: string): Promise<T>;

  /**
   * Checks if a CID is pinned or available on this provider.
   */
  exists?(cid: string): Promise<boolean>;

  /**
   * Performs an active health check on the provider node / gateway.
   */
  healthCheck(): Promise<IpfsHealthStatus>;
}

export interface SovereignIpfsConfig {
  primaryProvider?: IpfsProviderType;
  enableDualPinning?: boolean;
  kuboRpcUrl?: string;
  kuboGatewayUrl?: string;
  kuboApiKey?: string;
  pinataJwt?: string;
  pinataGateway?: string;
  customPrimary?: IpfsProvider;
  customBackup?: IpfsProvider;
}
