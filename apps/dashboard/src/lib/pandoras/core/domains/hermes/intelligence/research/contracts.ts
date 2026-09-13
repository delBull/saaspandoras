/**
 * 🛰️ Hermes OS — Autonomous Research Workflows Contracts (F7)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/research/contracts.ts
 */

export type ResearchMissionTrigger = 'MANUAL' | 'SCHEDULED_CRON' | 'EVENT_TRIGGERED';

export interface ResearchMissionConfig {
  missionId: string;
  tenantId: string;
  title: string;
  tenantUrl: string;
  competitorUrls: string[];
  targetKeywords: string[];
  trigger: ResearchMissionTrigger;
  notifyOnDelta?: boolean;
  ipfsVaultService?: any;
}

export interface DeltaMetric {
  metricName: string;
  competitorUrl: string;
  previousValue?: string | number;
  currentValue: string | number;
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface ResearchMissionReport {
  missionId: string;
  tenantId: string;
  executedAt: string;
  competitorsAnalyzed: number;
  deltasFound: DeltaMetric[];
  captureOpportunities: string[];
  growthOsDirectives: string[];
  vaultCandidateKey?: string;
  candidateCid?: string;
  candidateGovernance: {
    status: 'DISCOVERED' | 'PENDING_REVIEW';
    requiresHumanApproval: true;
    isDirectlyTrusted: false;
    authority: 'DISCOVERED';
  };
}
