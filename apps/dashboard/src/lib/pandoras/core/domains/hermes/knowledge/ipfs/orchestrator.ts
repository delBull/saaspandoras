/**
 * 🌐 Pandora's Sovereign IPFS Stack — Sovereign IPFS Orchestrator
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/orchestrator.ts
 *
 * Coordinates multi-tier IPFS storage:
 * - Primary: Pandora's Sovereign Kubo Node / IPFS Cluster
 * - Backup / Mirror: Pinata Cloud (for disaster recovery and external redundancy)
 * - Dev/Test: Deterministic Mock Provider with RFC4648 CIDv1 Multihashes
 */

import { 
  IpfsProvider, 
  SovereignIpfsConfig, 
  IpfsPinResult, 
  IpfsHealthStatus,
  IpfsPinOptions,
  ArtifactStorageCategory,
  SovereignIpfsHealth,
  IpfsReplicationStatus,
} from './contracts';
import { KuboRpcIpfsProvider } from './kubo-provider';
import { PinataIpfsProvider } from './pinata-provider';
import { MockIpfsProvider } from './mock-provider';
import { SovereignStoragePolicyEngine } from './storage-policy';

export class SovereignIpfsOrchestrator {
  private primary: IpfsProvider;
  private backup?: IpfsProvider;
  private enableDualPinning: boolean;
  private cidAliasMap = new Map<string, string>();

  constructor(config?: SovereignIpfsConfig) {
    const isProduction = process.env.NODE_ENV === 'production';
    this.enableDualPinning = config?.enableDualPinning ?? (process.env.PANDORAS_IPFS_DUAL_PIN === 'true');

    // 1. Resolve Primary Provider
    if (config?.customPrimary) {
      this.primary = config.customPrimary;
    } else if (config?.primaryProvider === 'KUBO' || (!config?.primaryProvider && process.env.PANDORAS_KUBO_RPC_URL)) {
      this.primary = new KuboRpcIpfsProvider({
        rpcUrl: config?.kuboRpcUrl,
        gatewayUrl: config?.kuboGatewayUrl,
        apiKey: config?.kuboApiKey,
      });
    } else if (config?.primaryProvider === 'PINATA' || (!config?.primaryProvider && (config?.pinataJwt || process.env.PINATA_JWT))) {
      this.primary = new PinataIpfsProvider({
        pinataJwt: config?.pinataJwt,
        pinataGateway: config?.pinataGateway,
      });
    } else if (!isProduction) {
      this.primary = new MockIpfsProvider();
    } else {
      this.primary = new PinataIpfsProvider({
        pinataJwt: config?.pinataJwt,
        pinataGateway: config?.pinataGateway,
      });
    }

    // 2. Resolve Backup / Redundancy Provider
    if (config?.customBackup) {
      this.backup = config.customBackup;
    } else if (this.primary.providerType === 'KUBO' && (config?.pinataJwt || process.env.PINATA_JWT)) {
      this.backup = new PinataIpfsProvider({
        pinataJwt: config?.pinataJwt,
        pinataGateway: config?.pinataGateway,
      });
    }
  }

  public get primaryProvider(): IpfsProvider {
    return this.primary;
  }

  public get backupProvider(): IpfsProvider | undefined {
    return this.backup;
  }

  /**
   * Registers a bidirectional mapping between two CIDs representing identical underlying content.
   */
  public registerCidAlias(primaryCid: string, backupCid: string): void {
    if (primaryCid && backupCid && primaryCid !== backupCid) {
      this.cidAliasMap.set(primaryCid, backupCid);
      this.cidAliasMap.set(backupCid, primaryCid);
    }
  }

  /**
   * Retrieves the mapped CID alias if registered.
   */
  public getCidAlias(cid: string): string | undefined {
    return this.cidAliasMap.get(cid);
  }

  /**
   * Pins JSON data using the primary provider and optionally mirrors to the backup provider
   * according to the institutional storage policy.
   */
  public async pinJson(
    data: unknown, 
    nameOrOptions?: string | IpfsPinOptions
  ): Promise<IpfsPinResult> {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !process.env.PANDORAS_KUBO_RPC_URL && !process.env.PINATA_JWT && this.primary.providerType === 'PINATA') {
      throw new Error('[SovereignIpfsOrchestrator] PANDORAS_KUBO_RPC_URL or PINATA_JWT is mandatory in production.');
    }

    const options: IpfsPinOptions = typeof nameOrOptions === 'string'
      ? { name: nameOrOptions }
      : (nameOrOptions || {});

    const artifactName = options.name || 'hermes-artifact.json';
    const category: ArtifactStorageCategory = options.category || 'KNOWLEDGE_VAULT';
    const policy = SovereignStoragePolicyEngine.resolvePolicy(category, options.policyOverride);

    const pinnedAt = new Date().toISOString();

    // 1. Pin to Primary (Sovereign Kubo or Pinata)
    const primaryCid = await this.primary.pinJson(data, artifactName);

    let backupMirrored = false;
    let backupCid: string | undefined = undefined;

    // 2. Dual-Pinning Redundancy Mirror based on Storage Policy
    const shouldMirror = (this.enableDualPinning || policy.requireExternalBackup) && !!this.backup;

    if (shouldMirror && this.backup) {
      if (policy.synchronousMirror) {
        try {
          backupCid = await this.backup.pinJson(data, artifactName);
          backupMirrored = true;
          if (backupCid && backupCid !== primaryCid) {
            this.registerCidAlias(primaryCid, backupCid);
          }
        } catch (err: any) {
          console.warn(`[SovereignIpfsOrchestrator] Synchronous backup dual-pinning warning for '${artifactName}':`, err?.message);
        }
      } else {
        // Async/Parallel execution
        try {
          backupCid = await this.backup.pinJson(data, artifactName);
          backupMirrored = true;
          if (backupCid && backupCid !== primaryCid) {
            this.registerCidAlias(primaryCid, backupCid);
          }
        } catch (err: any) {
          console.warn(`[SovereignIpfsOrchestrator] Async backup dual-pinning warning for '${artifactName}':`, err?.message);
        }
      }
    }

    const replicationStatus = SovereignStoragePolicyEngine.evaluateReplicationStatus(
      !!primaryCid,
      backupMirrored,
      policy
    );

    return {
      cid: primaryCid,
      ipfsUri: `ipfs://${primaryCid}`,
      provider: this.primary.providerType,
      pinnedAt,
      backupCid,
      backupMirrored,
      replicationStatus,
      storageCategory: category,
    };
  }

  /**
   * Fetches JSON content with automatic fail-over between Primary and Backup.
   * Resolves CID alias mappings when formats differ across storage engines.
   */
  public async fetchJson<T = unknown>(cid: string): Promise<T> {
    try {
      return await this.primary.fetchJson<T>(cid);
    } catch (primaryErr: any) {
      if (this.backup) {
        const targetCid = this.cidAliasMap.get(cid) || cid;
        console.warn(`[SovereignIpfsOrchestrator] Primary (${this.primary.providerType}) fetch failed for CID '${cid}'. Initiating fail-over to backup (${this.backup.providerType}) using CID '${targetCid}'...`);
        try {
          return await this.backup.fetchJson<T>(targetCid);
        } catch (backupErr: any) {
          throw new Error(`[SovereignIpfsOrchestrator] Both primary and backup providers failed to retrieve CID '${cid}' (target: '${targetCid}'). Primary: ${primaryErr?.message}; Backup: ${backupErr?.message}`);
        }
      }
      throw primaryErr;
    }
  }

  /**
   * Checks if CID exists across providers, taking into account CID aliases.
   */
  public async exists(cid: string): Promise<boolean> {
    if (this.primary.exists && await this.primary.exists(cid)) {
      return true;
    }
    const targetCid = this.cidAliasMap.get(cid) || cid;
    if (this.backup?.exists && await this.backup.exists(targetCid)) {
      return true;
    }
    return false;
  }

  /**
   * Health check across all configured providers reporting institutional durability metrics.
   */
  public async healthCheck(): Promise<SovereignIpfsHealth> {
    const primaryStatus = await this.primary.healthCheck();
    const backupStatus = this.backup ? await this.backup.healthCheck() : undefined;

    const primaryOnline = primaryStatus.ok;
    const backupOnline = backupStatus?.ok ?? false;

    let durabilityStatus: IpfsReplicationStatus = 'FAILED';
    if (primaryOnline && backupOnline) {
      durabilityStatus = 'DURABLE';
    } else if (primaryOnline && !backupOnline) {
      durabilityStatus = this.enableDualPinning ? 'DEGRADED' : 'LOCAL_ONLY';
    } else if (!primaryOnline && backupOnline) {
      durabilityStatus = 'DEGRADED';
    }

    return {
      primary: primaryStatus,
      backup: backupStatus,
      overallOk: primaryOnline || backupOnline,
      replication: {
        primaryOnline,
        backupOnline,
        dualPinningEnabled: this.enableDualPinning,
      },
      durability: {
        status: durabilityStatus,
        clusterPeers: primaryStatus.providerType === 'KUBO' ? 1 : undefined,
      },
    };
  }
}
