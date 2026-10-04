import { ExecutionEvent } from './execution-journal';
import { ExecutionInstance } from './execution-instance';
import { WorkflowDefinition } from './workflow-definition';
import { Identity } from '../contracts';

/**
 * Audit & Replay (Viaje en el tiempo)
 * Reconstruye una ExecutionInstance basada pura y exclusivamente en sus Eventos Inmutables,
 * garantizando el patrón Event Sourcing de Pandora's.
 */
export class EventReplayer {
  
  /**
   * Toma la definición del flujo y el historial de eventos,
   * y devuelve el estado exacto en el que se encontraba la instancia.
   */
  static replay<TPayload, TState extends string>(
    workflow: WorkflowDefinition<any, string>,
    events: ExecutionEvent[]
  ): ExecutionInstance<TPayload, TState> | null {
    
    if (!events || events.length === 0) return null;

    // Ordenar cronológicamente por seguridad
    const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let instance: Partial<ExecutionInstance<TPayload, TState>> = {};
    
    sorted.forEach(evt => {
      switch(evt.type) {
        case 'EXECUTION_STARTED':
          instance = {
            id: evt.instanceId,
            workflowDefinitionId: workflow.id,
            status: 'RUNNING',
            currentStage: evt.payload?.stage || workflow.initialState,
            payload: {} as TPayload, // idealmente se saca de algún snapshot o del payload inicial
            runtimeMemory: {},
            pendingActions: [],
            generatedArtifacts: [],
            startedAt: evt.timestamp,
            updatedAt: evt.timestamp
          };
          break;
          
        case 'STAGE_FINISHED':
          instance.currentStage = evt.payload?.newStage;
          instance.updatedAt = evt.timestamp;
          break;
          
        case 'DECISION_SUBMITTED':
          instance.runtimeMemory = instance.runtimeMemory || {};
          instance.runtimeMemory['lastDecision'] = evt.payload?.decision;
          if (instance.pendingActions) {
             instance.pendingActions = instance.pendingActions.map(pa => ({...pa, status: 'RESOLVED'}));
          }
          instance.status = 'RUNNING';
          instance.updatedAt = evt.timestamp;
          break;
          
        case 'EXECUTION_COMPLETED':
          instance.status = 'COMPLETED';
          instance.completedAt = evt.timestamp;
          instance.updatedAt = evt.timestamp;
          break;
          
        case 'EXECUTION_CANCELLED':
          instance.status = 'CANCELLED';
          instance.updatedAt = evt.timestamp;
          break;
      }
    });

    return instance as ExecutionInstance<TPayload, TState>;
  }
}
