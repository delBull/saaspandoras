import { Identity, HumanDecision, ExecutionIdentitySnapshot } from '../contracts';
import { WorkflowDefinition } from './workflow-definition';
import { ExecutionInstance } from './execution-instance';

/**
 * Kernel de Ejecución Central (API Pública)
 * Reemplaza al antiguo WorkflowEngine.
 * Controla el ciclo de vida de la instancia.
 */
export interface IExecutionRuntime {
  
  /**
   * Inicia una nueva ejecución.
   * Hermes utilizará este método.
   */
  start<TPayload, TState extends string>(
    workflow: WorkflowDefinition<any, TState>, 
    initialPayload: TPayload, 
    identity: ExecutionIdentitySnapshot
  ): Promise<ExecutionInstance<TPayload, TState>>;
  
  /**
   * Reanuda una ejecución pausada (ej. por una decisión humana o un evento de sistema).
   */
  resume<TPayload, TState extends string>(
    workflow: WorkflowDefinition<any, TState>,
    instanceId: string, 
    decision: HumanDecision, 
    identity: Identity
  ): Promise<ExecutionInstance<TPayload, TState>>;
  
  /**
   * Fuerza la cancelación del Workflow.
   */
  cancel(instanceId: string, identity: Identity, reason: string): Promise<void>;
  
  /**
   * Reintenta la etapa actual si ocurrió un fallo técnico (FAILED).
   */
  retry(workflow: WorkflowDefinition<any, any>, instanceId: string, identity: Identity): Promise<void>;
}
