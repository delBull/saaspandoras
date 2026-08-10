// campaign-workflow module is pending implementation — type defined locally
export type CampaignState = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export type CampaignId = string;

/**
 * 1. Entidad de Negocio (Persistente)
 * Esta es la entidad "Campaign" pura del dominio.
 * Solo guarda lo permanente, no el runtime stack.
 */
export interface Campaign {
  id: CampaignId;
  tenantId: string;
  projectId: number;
  objective: string;
  targetAudience: string;
  channels: string[];
  budget?: number;
  status: CampaignState;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 2. Contexto de Ejecución (Efímero / Runtime)
 * El Workflow Engine utiliza este objeto en memoria para coordinar
 * los distintos Motores (Media, Commercial, Calendar).
 * Puede persistirse en una caché (Redis) si el proceso se interrumpe,
 * pero no es la entidad principal del negocio.
 */
export interface CampaignContext {
  campaignId: CampaignId;
  
  // Runtime Variables
  aiThoughts?: string[];
  temporaryVariables?: Record<string, any>;
  currentStageStart?: string;
  
  // Enriquecimientos acumulativos
  attackPlan?: any; // El plan que originó la campaña
  researchInsights?: any; // Insights de Media Engine
  editorialPlan?: any; // Plan de Content Engine
  assetsGenerated?: string[]; // IDs de Artefactos (referencian a la tabla central de Artifacts)
  
  // Vínculos Comerciales
  associatedLeads?: string[];
  commercialApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  
  // Calendario
  scheduledSlots?: string[];
}

export interface AttackPlan {
  objective: string;
  strategy: string;
  targetAudience: string;
  channels: string[];
  contentRequirements: string[];
  timeline: {
    startDate: string;
    endDate?: string;
  };
  budget?: number;
  constraints?: string[];
  approvalsRequired: boolean;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  owner: string;
  distributionPolicy: string;
  successCriteria: string[];
  kpis: string[];
}
