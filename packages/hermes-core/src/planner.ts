import { Intent } from './contracts';
import { ExecutionPlan } from './runtimes/kernel-types';

export interface IPlanner {
  generatePlan(intent: Intent, workflowIds: string[]): Promise<ExecutionPlan>;
}

export class DefaultPlanner implements IPlanner {
  async generatePlan(intent: Intent, workflowIds: string[]): Promise<ExecutionPlan> {
    
    // Si solo hay un workflow, el plan es trivial.
    const tasks = workflowIds.map((wId, index) => ({
      id: `task_${index}`,
      type: 'workflow_trigger',
      capabilityRequired: 'workflow.advance' as any,
      payload: {
        workflowId: wId,
        payloadMapping: intent.payload
      }
    }));

    return {
      goals: [`Ejecución generada por Intent ${intent.type}`],
      tasks
    };
  }
}
