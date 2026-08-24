/**
 * 🌐 Pandora's Sovereign IPFS Stack — Sovereign IPFS Orchestrator
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/knowledge/ipfs/orchestrator.ts
 *
 * Coordinates multi-tier IPFS storage:
 * - Primary: Pandora's Sovereign Kubo Node / IPFS Cluster
 * - Backup / Mirror: Pinata Cloud (for disaster recovery and external redundancy)
 * - Dev/Test: Deterministic Mock Provider with RFC4648 CIDv1 Multihashes
 */

import { IpfsProvider, SovereignIpfsConfig, IpfsPinResult, IpfsHealthStatus } from './contracts';
import { KuboRpcIpfsProvider } from './kubo-provider';
import { PinataIpfsProvider } from './pinata-provider';
import { MockIpfsProvider } from './mock-provider';

export class SovereignIpfsOrchestrator {
  private primary: IpfsProvider;
  private backup?: IpfsProvider;
  private enableDualPinning: boolean;

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
      // In production without configured primary, throw fail-closed
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
   * Pins JSON data using the primary provider and optionally mirrors to the backup provider.
   */
  public async pinJson(data: unknown, name?: string): Promise<IpfsPinResult> {
    const pinnedAt = new Date().toISOString();

    // 1. Pin to Primary (Sovereign Kubo or Pinata)
    const primaryCid = await this.primary.pinJson(data, name);

    let backupMirrored = false;
    let backupCid: string | undefined = undefined;

    // 2. Dual-Pinning Redundancy Mirror
    if (this.enableDualPinning && this.backup) {
      try {
        backupCid = await this.backup.pinJson(data, name);
        backupMirrored = true;
      } catch (err: any) {
        console.warn(`[SovereignIpfsOrchestrator] Backup dual-pinning warning for '${name}':`, err?.message);
      }
    }

    return {
      cid: primaryCid,
      ipfsUri: `ipfs://${primaryCid}`,
      provider: this.primary.providerType,
      pinnedAt,
      backupCid,
      backupMirrored,
    };
  }

  /**
   * Fetches JSON content with automatic fail-over between Primary and Backup.
   */
  public async fetchJson<T = unknown>(cid: string): Promise<T> {
    try {
      return await this.primary.fetchJson<T>(cid);
    } catch (primaryErr: any) {
      if (this.backup) {
        console.warn(`[SovereignIpfsOrchestrator] Primary (${this.primary.providerType}) fetch failed for CID '${cid}'. Initiating fail-over to backup (${this.backup.providerType})...`);
        try {
          return await this.backup.fetchJson<T>(cid);
        } catch (backupErr: any) {
          throw new Error(`[SovereignIpfsOrchestrator] Both primary and backup providers failed to retrieve CID '${cid}'. Primary: ${primaryErr?.message}; Backup: ${backupErr?.message}`);
        }
      }
      throw primaryErr;
    }
  }

  /**
   * Checks if CID exists across providers.
   */
  public async exists(cid: string): Promise<boolean> {
    if (this.primary.exists && await this.primary.exists(cid)) {
      return true;
    }
    if (this.backup?.exists && await this.backup.exists(cid)) {
      return true;
    }
    return false;
  }

  /**
   * Health check across all configured providers.
   */
  public async healthCheck(): Promise<{
    primary: IpfsHealthStatus;
    backup?: IpfsHealthStatus;
    overallOk: boolean;
  }> {
    const primaryStatus = await this.primary.healthCheck();
    const backupStatus = this.backup ? await this.backup.healthCheck() : undefined;

    return {
      primary: primaryStatus,
      backup: backupStatus,
      overallOk: primaryStatus.ok || (backupStatus?.ok ?? false),
    };
  }
}
