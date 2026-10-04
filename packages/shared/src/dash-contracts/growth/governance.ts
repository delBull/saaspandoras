/**
 * 📦 Dash Contracts — Growth Governance & Operational Intents
 * src/lib/dash-contracts/growth/governance.ts
 */

export interface GrowthOperationalIntentDTO {
  id: string;
  intentId: string;
  organizationId: string;
  missionId: string;
  missionName: string;
  strategyDecision: string;
  reasonSummary: string;
  intentType: string;
  objective: string;
  rationale: string;
  pack: string;
  budget?: string;
  authorityRequired: string;
  consequence: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  riskScore: number;
  decisionReason?: string | null;
  createdAt: string;
}

export interface GetGrowthIntentsResponseDTO {
  pendingIntents: GrowthOperationalIntentDTO[];
  approvedCount: number;
  rejectedCount: number;
}
