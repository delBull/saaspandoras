/**
 * 🏛️ PLATFORM GOVERNANCE CONTRACTS: SECURITY & AUDIT
 * apps/dashboard/src/lib/dash-contracts/admin/security.ts
 *
 * Platform security telemetry, incident tracking, policy enforcement,
 * and cryptographic vault integrity.
 */

export type SecuritySeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface SecurityIncident {
  id: string;
  incidentType: 'RATE_LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS_ATTEMPT' | 'POLICY_VIOLATION' | 'VAULT_TAMPER_SUSPECTED';
  severity: SecuritySeverity;
  sourceIp?: string | null;
  actorWallet?: string | null;
  tenantId?: string | null;
  description: string;
  resolved: boolean;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SovereignVaultIntegritySummary {
  totalNotarizedDocuments: number;
  totalUniqueCids: number;
  unpinnedCount: number;
  isConstitutionalVaultLocked: boolean;
  discord2faWebhookConfigured: boolean;
  lastIntegrityCheckAt: string;
}

export interface SecurityCenterOverviewDTO {
  incidents: SecurityIncident[];
  activeThreatCount: number;
  vault: SovereignVaultIntegritySummary;
  systemFirewallActive: boolean;
}
