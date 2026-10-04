/**
 * 🏛️ PLATFORM GOVERNANCE CONTRACTS: OPERATIONS
 * apps/dashboard/src/lib/dash-contracts/admin/operations.ts
 *
 * Operational telemetry, shortlinks metrics, background jobs
 * and serverless fleet management.
 */

export interface RunPodEndpointInspection {
  id: string;
  endpointId: string;
  endpointName: string;
  modelType: string;
  gpuType: string;
  perSecondCostUsd: number;
  status: 'ACTIVE' | 'WARM' | 'IDLE' | 'DRAINING' | 'OFFLINE';
  tenantId?: string | null;
  createdAt: string;
}

export interface PlatformShortlinkMetric {
  id: string;
  slug: string;
  targetUrl: string;
  clicksCount: number;
  lastClickedAt?: string | null;
  createdByWallet: string;
  createdAt: string;
}

export interface MaintenanceTaskLog {
  id: string;
  taskType: 'CACHE_FLUSH' | 'DB_POOL_OPTIMIZE' | 'IPFS_PIN_VERIFY' | 'CRON_RECONCILE';
  executedBy: string;
  status: 'SUCCESS' | 'FAILED';
  durationMs: number;
  details?: Record<string, any>;
  executedAt: string;
}
