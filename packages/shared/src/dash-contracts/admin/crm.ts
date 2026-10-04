/**
 * 🏛️ PLATFORM B2B CRM (F9.11)
 * apps/dashboard/src/lib/dash-contracts/admin/crm.ts
 *
 * Contract definitions for the HQ Deal Room and B2B Pipeline.
 */

export type PlatformB2bLeadStage = 
  | 'PROSPECT' 
  | 'CONTACTED' 
  | 'DEMO' 
  | 'DUE_DILIGENCE' 
  | 'NEGOTIATION' 
  | 'CLOSED_WON' 
  | 'CLOSED_LOST';

export interface PlatformB2bLeadDTO {
  id: string;
  name: string;
  companyName: string;
  email: string | null;
  phone: string | null;
  stage: PlatformB2bLeadStage;
  source: string;
  estimatedValueUsd: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedOperatorId: string | null;
  assignedOperatorName: string | null;
}

export interface B2bPipelineMetricsDTO {
  totalProspects: number;
  activeDeals: number;
  pipelineValueUsd: number;
  conversionRate: number;
}
