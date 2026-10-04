/**
 * 📦 Dash Contracts — Growth OS / Control Plane DTOs
 * src/lib/dash-contracts/control-plane.ts
 */

export interface ControlPlaneOverviewDTO {
  id: string;
  name: string;
  slug: string;
  hasHermes: boolean;
  stats: {
    totalInteractions: number;
    activeJourneys: number;
    governanceScore: number;
    knowledgeSourcesCount: number;
  };
  metrics?: {
    activeMissionsCount: number;
    pendingIntentsCount: number;
    completedMissionsCount: number;
    riskScore: number;
  };
}

export interface OperationalIntentDTO {
  id: string;
  intentId: string;
  organizationId: string;
  missionId: string;
  missionName?: string;
  strategyDecision?: string;
  reasonSummary?: string;
  intentType: string;
  objective: string;
  rationale: string;
  pack?: string;
  budget?: string;
  authorityRequired?: string;
  consequence?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  riskScore: number;
  decisionReason?: string | null;
  createdAt: string;
}

export interface GetPendingIntentsResponseDTO {
  pendingIntents: OperationalIntentDTO[];
}
