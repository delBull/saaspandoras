import { WorkflowDefinition } from './workflow-definition';

export interface TransitionEvent<TState = string> {
  from: TState;
  to: TState;
  trigger: string;
  timestamp: string;
  metadata?: any;
}

/**
 * Máquina de Estados Genérica para cualquier Workflow.
 * Su única responsabilidad: currentState ➔ canTransition() ➔ transition().
 */
export class WorkflowStateMachine<TState extends string> {
  private currentState: TState;
  private transitions: TransitionEvent<TState>[] = [];

  constructor(
    private workflow: WorkflowDefinition<any, TState>,
    initialState?: TState
  ) {
    this.currentState = initialState || workflow.initialState;
  }

  public getState(): TState {
    return this.currentState;
  }

  public getHistory(): TransitionEvent<TState>[] {
    return [...this.transitions];
  }

  public canTransition(to: TState): boolean {
    if (this.workflow.terminalStates.includes(to)) return true; // Siempre podemos abortar/terminar
    
    // Si el workflow tiene transiciones explícitas, las usamos. 
    // Si no, asume que cualquier stage listado es válido por ahora (simplificación).
    if (this.workflow.transitions) {
      return this.workflow.transitions[this.currentState]?.includes(to) ?? false;
    }

    return this.workflow.stages.includes(to);
  }

  public transitionTo(newState: TState, trigger: string, metadata?: any): void {
    if (!this.canTransition(newState)) {
      throw new Error(`[WorkflowStateMachine] Invalid transition from ${this.currentState} to ${newState} in workflow ${this.workflow.id}`);
    }

    const event: TransitionEvent<TState> = {
      from: this.currentState,
      to: newState,
      trigger,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.currentState = newState;
    this.transitions.push(event);

    console.info(`[StateMachine] Workflow ${this.workflow.id} transitioned to ${newState} (Trigger: ${trigger})`);
  }
}
