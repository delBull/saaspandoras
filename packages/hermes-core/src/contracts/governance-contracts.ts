export interface OperationalConstraint {
  type: 'budget' | 'time' | 'provider' | 'compliance' | 'other';
  value: unknown;
}

export interface ApprovalPolicy {
  required: boolean;
  approvers?: string[];
  reason?: string;
}

export interface ApprovalDecision {
  actorId: string;
  decision: 'approved' | 'rejected';
  reason?: string;
  timestamp: Date;
}

export type OperationalIntentStatus =
  | 'proposed'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'completed'
  | 'cancelled';

export interface OperationalIntent {
  id: string;
  organizationId: string;
  missionId: string;
  packId: string;
  packVersion: string;
  strategyDecisionId: string;

  // Qué busca lograr
  objective: string;

  // Acción propuesta (desacoplada de la implementación técnica)
  intentType: string;

  // Contexto estratégico / justificación
  rationale: string;

  constraints: OperationalConstraint[];
  approvalPolicy: ApprovalPolicy;
  status: OperationalIntentStatus;
  
  approvals?: ApprovalDecision[]; // Registro de decisiones de aprobación
  
  createdAt: Date;
  updatedAt: Date;
}
