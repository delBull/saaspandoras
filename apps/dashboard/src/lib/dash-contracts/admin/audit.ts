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
  | 'RWA_STAGE_TRANSITION'
  | 'CONTRACT_DEPLOYED'
  | 'ADMIN_KEY_ROTATED'
  | 'SECURITY_OVERRIDE_TRIGGERED';

export type PlatformAuditResult = 'SUCCESS' | 'DENIED' | 'FAILED';

export interface PlatformAuditGovernanceContext {
  isDiscord2faVerified: boolean;
  delegationToken?: string | null;
  secondApprover?: string | null;
  auditReason: string;
}

export interface PlatformAuditStateTransition {
  previousState: Record<string, any> | null;
  newState: Record<string, any> | null;
}

export interface PlatformAuditEntryDTO {
  id: string;
  sequenceNumber: number;
  prevHash: string;
  currentHash: string;
  // 1. Quién
  actorId: string;
  actorWallet: string;
  actorRole: string;
  actorType: string;
  // 2. Qué intentó
  action: PlatformAuditEventAction;
  // 3. Sobre qué recurso
  targetResource: string;
  resourceId?: string | null;
  // 4. Bajo qué capability
  capability: string;
  // 5. Qué governance presentó
  governance: PlatformAuditGovernanceContext;
  // 6. Qué cambió
  stateTransition: PlatformAuditStateTransition;
  // 7. Cuándo
  timestamp: string;
  // 8. Resultado
  result: PlatformAuditResult;
  // 9. Evidencia
  evidenceCid?: string | null;
  txHash?: string | null;
  signature?: string | null;
}
