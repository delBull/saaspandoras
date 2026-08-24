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
  IpfsReplicationStatus,
  SovereignIpfsHealth,
  ArtifactStorageCategory,
} from './contracts';
import { KuboRpcIpfsProvider } from './kubo-provider';
import { PinataIpfsProvider } from './pinata-provider';
import { MockIpfsProvider } from './mock-provider';
import { SovereignStoragePolicyEngine } from './storage-policy';
import { SovereignIpfsAlerting } from './ipfs-alerting';

export class SovereignIpfsOrchestrator {
  private static readonly globalCidAliasMap = new Map<string, string>();
  /** K27.x: settled replication outcome per primary CID (REPLICATING is never terminal). */
  private static readonly replicationOutcomes = new Map<string, IpfsReplicationStatus>();
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
   * Statically registers a global bidirectional mapping between two CIDs.
   */
  public static registerGlobalCidAlias(primaryCid?: string | null, backupCid?: string | null): void {
    if (primaryCid && backupCid && primaryCid !== backupCid) {
      this.globalCidAliasMap.set(primaryCid, backupCid);
      this.globalCidAliasMap.set(backupCid, primaryCid);
    }
  }

  /**
   * Registers a bidirectional mapping between two CIDs representing identical underlying content.
   */
  public registerCidAlias(primaryCid?: string | null, backupCid?: string | null): void {
    if (primaryCid && backupCid && primaryCid !== backupCid) {
      this.cidAliasMap.set(primaryCid, backupCid);
      this.cidAliasMap.set(backupCid, primaryCid);
      SovereignIpfsOrchestrator.registerGlobalCidAlias(primaryCid, backupCid);
    }
  }

  /**
   * Retrieves the mapped CID alias if registered (checks instance and global process maps).
   */
  public getCidAlias(cid: string): string | undefined {
    return this.cidAliasMap.get(cid) || SovereignIpfsOrchestrator.globalCidAliasMap.get(cid);
  }

  /**
   * K27.x: Returns the settled replication outcome for a primary CID.
   * Undefined means the mirror decision has not settled yet (still REPLICATING).
   */
  public getReplicationOutcome(primaryCid: string): IpfsReplicationStatus | undefined {
    return SovereignIpfsOrchestrator.replicationOutcomes.get(primaryCid);
  }

  /**
   * K27.x Production integrity gate: fetches content (with fail-over) and
   * recomputes the canonical SHA-256, failing closed on replica divergence.
   * This is the enforcement behind the DURABLE invariant — no test-side logic.
   */
  public async fetchJsonVerified<T = unknown>(cid: string, expectedCanonicalContentHash: string): Promise<T> {
    const data = await this.fetchJson<T>(cid);
    const recomputedHash = SovereignStoragePolicyEngine.computeCanonicalContentHash(data);
    if (recomputedHash !== expectedCanonicalContentHash) {
      throw new Error(
        `KNOWLEDGE_INTEGRITY_MISMATCH: Recovered replica content does not match canonical hash for CID '${cid}'. Expected '${expectedCanonicalContentHash}', got '${recomputedHash}'. Failing closed.`
      );
    }
    return data;
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
    let isAsyncInFlight = false;

    if (shouldMirror && this.backup) {
      if (policy.synchronousMirror) {
        try {
          const backupProvider = this.backup;
          backupCid = await backupProvider.pinJson(data, artifactName);
          backupMirrored = true;
          if (backupCid && backupCid !== primaryCid) {
            this.registerCidAlias(primaryCid, backupCid);
          }
        } catch (err: any) {
          console.warn(`[SovereignIpfsOrchestrator] Synchronous backup dual-pinning warning for '${artifactName}':`, err?.message);
          backupMirrored = false;
          if (this.backup?.providerType === 'PINATA') {
            SovereignIpfsAlerting.notifyPinataDrDown({
              error: err?.message || 'Synchronous DR mirror pinning failed',
              affectedCategory: category,
            }).catch(() => {});
          }
          if (category === 'CLAIM_CONTRACT' || category === 'LEGAL_AGREEMENT' || category === 'AUDIT_SNAPSHOT' || category === 'AGENT_SOUL') {
            SovereignIpfsAlerting.notifyL3DurabilityDegraded({
              category,
              name: artifactName,
              primaryCid,
              reason: err?.message || 'Synchronous DR mirror failed',
            }).catch(() => {});
          }
        }
      } else {
        // Non-blocking Async / Background Mirror (Fire-and-forget)
        isAsyncInFlight = true;
        const backupProvider = this.backup;
        backupProvider.pinJson(data, artifactName)
          .then((bCid) => {
            if (bCid && bCid !== primaryCid) {
              this.registerCidAlias(primaryCid, bCid);
            }
            SovereignIpfsOrchestrator.replicationOutcomes.set(primaryCid, 'DURABLE');
          })
          .catch((err: any) => {
            // K27.x: REPLICATING must never be terminal — record the degraded outcome.
            SovereignIpfsOrchestrator.replicationOutcomes.set(primaryCid, 'DEGRADED');
            console.warn(`[SovereignIpfsOrchestrator] Background backup dual-pinning warning for '${artifactName}':`, err?.message);
            if (this.backup?.providerType === 'PINATA') {
              SovereignIpfsAlerting.notifyPinataDrDown({
                error: err?.message || 'Background DR mirror pinning failed',
                affectedCategory: category,
              }).catch(() => {});
            }
          });
      }
    }

    const durabilityProof = SovereignStoragePolicyEngine.buildDurabilityProof({
      data,
      primaryCid,
      backupCid,
      tenantId: options.tenantId,
      category,
      policy,
      primarySuccess: !!primaryCid,
      backupSuccess: backupMirrored,
      isAsyncInFlight,
    });

    if (durabilityProof.replicationStatus !== 'REPLICATING') {
      SovereignIpfsOrchestrator.replicationOutcomes.set(primaryCid, durabilityProof.replicationStatus);
    }

    return {
      cid: primaryCid,
      ipfsUri: `ipfs://${primaryCid}`,
      provider: this.primary.providerType,
      pinnedAt,
      backupCid,
      backupMirrored,
      replicationStatus: durabilityProof.replicationStatus,
      storageCategory: category,
      durabilityProof,
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
        // K27.x Cold-Start DR: resolve aliases from instance AND process-global
        // registry so rehydrated mappings survive vault/orchestrator disposal.
        const targetCid = this.getCidAlias(cid) || cid;
        console.warn(`[SovereignIpfsOrchestrator] Primary (${this.primary.providerType}) fetch failed for CID '${cid}'. Initiating fail-over to backup (${this.backup.providerType}) using CID '${targetCid}'...`);
        
        // Dispatch alert only when Kubo primary node is down
        if (this.primary.providerType === 'KUBO') {
          SovereignIpfsAlerting.notifyKuboPrimaryDown({
            error: primaryErr?.message || 'Primary Kubo daemon unreachable',
            cidRequested: cid,
            fallbackProvider: this.backup.providerType,
          }).catch(() => {});
        }

        try {
          return await this.backup.fetchJson<T>(targetCid);
        } catch (backupErr: any) {
          throw new Error(`[SovereignIpfsOrchestrator] Complete fetch failure for CID '${cid}'. Primary error: ${primaryErr?.message}. Backup error: ${backupErr?.message}`);
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
    const targetCid = this.getCidAlias(cid) || cid;
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
