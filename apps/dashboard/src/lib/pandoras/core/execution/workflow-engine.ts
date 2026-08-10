import { Identity, HumanDecision, PendingAction } from '../contracts';

/**
 * Representa una etapa dentro de un Workflow (Ej. 'GENERATING_ASSETS')
 */
export interface WorkflowStageExecutor<TContext> {
  execute(context: TContext, identity: Identity, decision?: HumanDecision): Promise<void>;
}

export interface WorkflowDefinition<TContext, TState> {
  id: string;
  initialState: TState;
  getState(context: TContext): TState;
  getExecutor(state: TState): WorkflowStageExecutor<TContext> | undefined;
}

/**
 * Motor Genérico de Workflows.
 * No sabe si está corriendo una Campaña, una Venta o un Onboarding.
 * Solo administra el loop, pausas y reanudaciones.
 */
export class WorkflowEngine {
  
  /**
   * Ejecuta el loop de vida de un contexto en base a su Workflow.
   * Se detiene cuando no hay un ejecutor (pausa para espera de humanos/eventos)
   * o cuando el estado no cambia.
   */
  public async drive<TContext, TState>(
    workflow: WorkflowDefinition<TContext, TState>,
    context: TContext, 
    identity: Identity,
    terminalStates: TState[],
    decision?: HumanDecision
  ): Promise<void> {
    
    let currentState = workflow.getState(context);
    console.log(`[WorkflowEngine] Starting drive for workflow ${workflow.id} at state ${String(currentState)}`);

    while (!terminalStates.includes(currentState)) {
      const executor = workflow.getExecutor(currentState);
      
      if (executor) {
        console.log(`[WorkflowEngine] Executing stage for state ${String(currentState)}`);
        // Pasamos la decisión humana a la etapa si existe.
        // Después de usarla una vez, la limpiamos para no aplicarla en bucle.
        await executor.execute(context, identity, decision);
        decision = undefined; 
      } else {
        console.log(`[WorkflowEngine] Workflow ${workflow.id} paused. Waiting for external action in state ${String(currentState)}.`);
        // Aquí es donde el motor normalmente emitiría un PendingAction
        break;
      }
      
      const nextState = workflow.getState(context);
      if (nextState === currentState) {
        console.warn(`[WorkflowEngine] Executor for ${String(currentState)} did not advance the state. Pausing loop to prevent infinity.`);
        break;
      }
      currentState = nextState;
    }

    if (terminalStates.includes(currentState)) {
      console.log(`[WorkflowEngine] Workflow ${workflow.id} reached terminal state ${String(currentState)}.`);
    }
  }

  /**
   * Reanuda el workflow basándose en una decisión humana
   */
  public async resume<TContext, TState>(
    workflow: WorkflowDefinition<TContext, TState>,
    context: TContext, 
    identity: Identity,
    terminalStates: TState[],
    decision: HumanDecision
  ): Promise<void> {
    console.log(`[WorkflowEngine] Resuming workflow ${workflow.id} with decision: ${decision.type}`);
    await this.drive(workflow, context, identity, terminalStates, decision);
  }
}
