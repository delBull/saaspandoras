/**
 * 📦 Dash Contracts — Growth CRM & Lead Pipeline
 * src/lib/dash-contracts/growth/crm.ts
 */

export type LeadStage = 'DISCOVERY' | 'QUALIFIED' | 'PRESENTATION' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

export interface TenantLeadDTO {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  stage: LeadStage;
  source: string;
  assignedAgent?: string;
  score: number;
  tags: string[];
  estimatedValue?: number;
  lastInteractionAt?: string;
  createdAt: string;
}

export interface GetPipelineResponseDTO {
  leads: TenantLeadDTO[];
  stages: Array<{ id: LeadStage; label: string; count: number; totalValue: number }>;
}
