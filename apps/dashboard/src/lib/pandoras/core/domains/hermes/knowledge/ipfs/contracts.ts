/**
 * 🌐 Pandora's Sovereign IPFS Stack — Contracts & Interfaces
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/contracts.ts
 */

export type IpfsProviderType = 'KUBO' | 'PINATA' | 'MOCK';

export interface IpfsHealthStatus {
  ok: boolean;
  providerType: IpfsProviderType;
  version?: string;
  latencyMs: number;
  error?: string;
}

export interface IpfsPinResult {
  cid: string;
  ipfsUri: string;
  provider: IpfsProviderType;
  pinnedAt: string;
  backupCid?: string;
  backupMirrored?: boolean;
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
