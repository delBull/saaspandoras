/**
 * 🏛️ PLATFORM GOVERNANCE CONTRACTS: PLATFORM & SYSTEM HEALTH
 * apps/dashboard/src/lib/dash-contracts/admin/platform.ts
 *
 * Global platform overview, infrastructure metrics, runtime versions
 * and connectivity health checks.
 */

export interface InfrastructureHealth {
  neonPoolerStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  ipfsGatewayStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  runpodServerlessStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  blockchainRpcStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  discordWebhookStatus: 'ONLINE' | 'DISABLED' | 'ERROR';
  latencyMs: number;
}

export interface PlatformGlobalKpis {
  totalTenantsCount: number;
  activeTenantsCount: number;
  trialTenantsCount: number;
  rwaProjectsCount: number;
  totalGpuSecondsExecuted: number;
  totalGrossDepositsUsd: number;
  totalRawGpuCostUsd: number;
  totalRetainedMarginUsd: number;
  totalCirculatingCreditsUsd: number;
  averageMarkupPercentage: number;
}

export interface PlatformOverviewDTO {
  platformName: string;
  environment: 'production' | 'staging' | 'development';
  hermesKernelVersion: string;
  growthOsVersion: string;
  health: InfrastructureHealth;
  kpis: PlatformGlobalKpis;
  lastUpdated: string;
}
