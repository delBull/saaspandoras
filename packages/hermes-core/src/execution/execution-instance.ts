import { PendingAction, Artifact, ExecutionIdentitySnapshot } from '../contracts';
import { WorkflowDefinition } from './workflow-definition';

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'FAILED' | 'COMPLETED' | 'CANCELLED';

/**
 * La Instancia de Ejecución viva.
 * El Runtime la hidrata en memoria a partir de la persistencia.
 */
export interface ExecutionInstance<TPayload = any, TState = string> {
  id: string;
  workflowDefinitionId: string; // Referencia al activo de Workflow
  
  status: ExecutionStatus;
  currentStage: TState;
  
  /**
   * Snapshot de la identidad bajo la cual se ejecuta esta instancia.
   */
  identityContext: ExecutionIdentitySnapshot;
  
  
  /**
   * El núcleo de datos propio del dominio (Ej. El objeto Campaign, o SalesOpportunity).
   * El Runtime es ciego a lo que hay aquí adentro.
   */
  payload: TPayload;
  
  /**
   * Memoria de ejecución temporal (resultados parciales)
   */
  runtimeMemory: Record<string, any>;
  
  pendingActions: PendingAction[];
  generatedArtifacts: Artifact[];
  
  startedAt?: string;
  updatedAt: string;
  completedAt?: string;
}
