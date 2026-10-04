import { HumanDecision, Identity } from '../contracts';
import { WorkflowEngine, WorkflowDefinition } from './workflow-engine';

/**
 * Servicio encargado de recibir el input humano (Mision Control UI)
 * y reinyectarlo en el motor de ejecución.
 * 
 * Separa completamente a los actores humanos de la lógica de negocio
 * y del estado de las campañas.
 */
export class HumanInteractionService {
  constructor(private workflowEngine: WorkflowEngine) {}

  /**
   * Recibe una decisión de un humano (ej. APPROVED, REJECTED, NEEDS_CHANGES)
   * y reanuda el workflow pausado.
   * 
   * @param decision La decisión tomada por el humano
   * @param workflow El workflow a reanudar
   * @param context El contexto que estaba en pausa
   * @param identity La identidad del sistema o del actor reanudando
   * @param terminalStates Los estados en los que el workflow debe detenerse
   */
  public async submitDecision<TContext, TState>(
    decision: HumanDecision,
    workflow: WorkflowDefinition<TContext, TState>,
    context: TContext,
    identity: Identity,
    terminalStates: TState[]
  ): Promise<void> {
    console.log(`[HumanInteractionService] Actor ${decision.actor.id} submitted decision: ${decision.type}`);
    
    // Aquí el servicio podría hacer auditoría, emitir eventos de 'DecisionSubmitted' al EventBus, etc.
    
    // Inyecta la decisión al motor
    await this.workflowEngine.resume(
      workflow,
      context,
      identity,
      terminalStates,
      decision
    );
  }
}
