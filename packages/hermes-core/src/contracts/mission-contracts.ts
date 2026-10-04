/**
 * Mission Contracts (ADR-007)
 * Definiciones de la capa estratégica (Hermes).
 */

export interface Goal {
  id: string;
  objective: string;
  createdAt: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  successCriteria: string[];
}

export interface MissionConstraint {
  type: 'budget' | 'market' | 'timeline' | 'policy' | string;
  value: any;
}

export interface MissionMilestone {
  name: string;
  completed: boolean;
  completedAt?: string;
}

export interface Mission {
  id: string;
  organizationId: string;
  packId: string;
  packVersion: string;
  goal: Goal;
  status: 'active' | 'paused' | 'blocked' | 'completed' | 'failed';
  currentPhase: string;
  state: Record<string, any>;
  milestones: MissionMilestone[];
  constraints: MissionConstraint[];
  executions: string[]; // IDs de ejecuciones en el OS
  createdAt: string;
  updatedAt: string;
}

export interface Intent {
  type: 
    | 'START_WORKFLOW' 
    | 'RESUME_WORKFLOW' 
    | 'CANCEL_WORKFLOW' 
    | 'QUERY_STATUS' 
    | 'SEARCH_KNOWLEDGE' 
    | 'CHAT' 
    | 'UNKNOWN';
  confidence: number;
  payload: Record<string, any>;
}

export interface HumanDecision {
  type: 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES' | 'CANCEL' | string;
  actor: import('./identity-contracts').Identity;
  notes?: string;
  payload?: any;
}

export interface PendingAction {
  id: string;
  type: string; // ej: 'REVIEW_ASSETS', 'APPROVAL_REQUIRED'
  actor?: string; // id de usuario específico si aplica
  requiredRole?: string; // ej: 'MARKETING_MANAGER'
  status: 'PENDING' | 'RESOLVED' | 'EXPIRED';
  dueDate?: string; // ISO 8601
  instructions: string;
  contextRef: string; // ID del Workflow/Campaign
}
