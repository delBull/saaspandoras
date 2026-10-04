/**
 * 📦 Dash Contracts — Hermes Activity DTOs
 * src/lib/dash-contracts/activity.ts
 */

export interface SecurityEventItemDTO {
  id: string;
  eventType: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  policyDecision?: 'ALLOW' | 'BLOCK' | 'REWRITE' | 'DEGRADE' | 'ESCALATE' | 'NONE';
  sequenceNumber: number;
  contentHash: string;
  eventHash: string;
  previousEventHash?: string | null;
  actorId: string;
  toolId?: string | null;
  timestamp: string;
}

export interface AddonAuditEventItemDTO {
  id: string;
  addonId: string;
  action: string;
  performedBy: string;
  statusBefore?: string | null;
  statusAfter: string;
  timestamp: string;
}

export interface GetActivityResponseDTO {
  securityEvents: SecurityEventItemDTO[];
  addonAudits: AddonAuditEventItemDTO[];
  organizationName: string;
}
