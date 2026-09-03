/**
 * 🏛️ PLATFORM GOVERNANCE CONTRACTS: AUDIT & HASH-CHAIN LEDGER
 * apps/dashboard/src/lib/dash-contracts/admin/audit.ts
 *
 * Cryptographically verifiable audit log entries with previous hash chaining.
 */

export type PlatformAuditEventAction =
  | 'PLATFORM_POLICY_UPDATED'
  | 'TENANT_MARKUP_MODIFIED'
  | 'TENANT_SUSPENDED'
  | 'CREDIT_MANUAL_ADJUSTMENT'
  | 'TREASURY_SWEEP_EXECUTED'
  | 'RWA_DEAL_APPROVED'
  | 'CONTRACT_DEPLOYED'
  | 'ADMIN_KEY_ROTATED'
  | 'SECURITY_OVERRIDE_TRIGGERED';

export interface PlatformAuditEntryDTO {
  id: string;
  sequenceNumber: number;
  prevHash: string;
  currentHash: string;
  actorWallet: string;
  actorRole: string;
  action: PlatformAuditEventAction;
  targetResource: string;
  resourceId?: string | null;
  payloadSummary: string;
  timestamp: string;
  signature?: string | null;
}
