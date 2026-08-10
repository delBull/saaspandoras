import { IExecutionRuntime } from './execution-runtime';
import { WorkflowRegistry } from './workflow-registry';
import { Identity, HumanDecision, ExecutionIdentitySnapshot } from '../contracts';
import { ExecutionInstance } from './execution-instance';

/**
 * Orquestador principal del OS.
 * Toma solicitudes desde el exterior (ej. Hermes) y gestiona el ciclo de vida,
 * desacoplando el enrutamiento y la instanciación de la pura ejecución.
 */
export class ExecutionDirector {
  constructor(
    private registry: WorkflowRegistry,
    private runtime: IExecutionRuntime
  ) {}

  /**
   * Inicia un proceso desde cero.
   */
  async startProcess(
    workflowId: string, 
    payload: any, 
    identitySnapshot: ExecutionIdentitySnapshot
  ): Promise<ExecutionInstance<any, string>> {
    const registered = this.registry.get(workflowId);
    if (!registered) {
      throw new Error(`[Director] Workflow ${workflowId} not found in Registry.`);
    }

    console.log(`[Director] Starting workflow process: ${workflowId}`);
    
    // Inyectamos la definición en el runtime.
    // Esto asume que el runtime expone 'start' (podemos mover toda esa lógica aquí 
    // y dejar que el runtime solo reciba la instancia para 'drive').
    const instance = await this.runtime.start(registered.definition, payload, identitySnapshot);
    return instance;
  }

  /**
   * Reanuda un proceso pausado.
   */
  async resumeProcess(
    workflowId: string,
    instanceId: string,
    decision: HumanDecision,
    actor: Identity
  ): Promise<void> {
    const registered = this.registry.get(workflowId);
    if (!registered) throw new Error(`[Director] Workflow ${workflowId} not found.`);
    
    console.log(`[Director] Resuming instance: ${instanceId}`);
    await this.runtime.resume(registered.definition, instanceId, decision as HumanDecision, actor);
  }

  /**
   * Cancela un proceso.
   */
  async cancelProcess(
    instanceId: string,
    actor: Identity,
    reason: string = 'Cancelled by Director'
  ): Promise<void> {
    console.log(`[Director] Cancelling instance: ${instanceId}`);
    await this.runtime.cancel(instanceId, actor, reason);
  }
}
