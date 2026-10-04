import { Identity } from '../contracts';

/**
 * Representa cualquier suceso inmutable que ha ocurrido dentro del Runtime.
 */
export interface ExecutionEvent {
  id: string;
  instanceId: string;
  workflowId: string;
  
  type: string; // ej. 'EXECUTION_STARTED', 'STAGE_FINISHED', 'DECISION_SUBMITTED'
  
  payload: any;
  
  actor: Identity;
  timestamp: string; // ISO 8601
}

/**
 * Journal del Runtime.
 * Registra y provee acceso a todos los eventos ocurridos.
 * Este será el puente principal hacia el Platform Event Bus (Sprint 8).
 */
export interface IExecutionJournal {
  
  /**
   * Agrega un nuevo evento al registro inmutable.
   */
  append(event: ExecutionEvent): Promise<void>;
  
  /**
   * Recupera todos los eventos asociados a una instancia.
   */
  getHistory(instanceId: string): Promise<ExecutionEvent[]>;
  
  /**
   * Reconstruye el estado de una instancia basándose únicamente en sus eventos (Event Sourcing).
   * Opcional, pero sienta las bases para "Replay".
   */
  replay?(instanceId: string): Promise<any>;
}
