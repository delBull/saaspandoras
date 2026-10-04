/**
 * 🏛️ PLATFORM GOVERNANCE CONTRACTS: TREASURY & HERMES INTERNAL ACCOUNTING
 * apps/dashboard/src/lib/dash-contracts/admin/treasury.ts
 *
 * Platform treasury oversight, RunPod GPU compute accounting,
 * tenant margin auditing, and immutable sweeps ledger.
 */

export interface TreasuryBalanceSummary {
  adminWalletAddress: string;
  rootTreasurySafeAddress: string;
  totalDepositedUsd: number;
  totalRunpodComputeCostUsd: number;
  totalGrossMarginUsd: number;
  activeCirculatingCreditsUsd: number;
  uncollectedCommissionsUsd: number;
}

export interface InternalAccountingEntryDTO {
  id: string;
  timestamp: string;
  tenantId: string;
  eventType: string;
  amountChargedUsd: number;
  rawCostUsd: number;
  markupProfitUsd: number;
  destinationWallet: string;
  reason: string;
  isSandbox: boolean;
}

export interface TreasurySweepRecord {
  id: string;
  amountUsd: number;
  sourceVault: string;
  destinationWallet: string;
  txHash?: string | null;
  executedByWallet: string;
  reason: string;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  executedAt: string;
}

export interface ManualCreditAdjustmentRequest {
  tenantId: string;
  adjustmentUsd: number;
  isSandbox: boolean;
  reason: string;
  adminActorWallet: string;
}
