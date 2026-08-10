import { Intent, ExecutionPlan } from './contracts';

export interface IPlanner {
  generatePlan(intent: Intent, workflowIds: string[]): Promise<ExecutionPlan>;
}

export class DefaultPlanner implements IPlanner {
  async generatePlan(intent: Intent, workflowIds: string[]): Promise<ExecutionPlan> {
    
    // Si solo hay un workflow, el plan es trivial.
    const steps = workflowIds.map((wId, index) => ({
      workflowId: wId,
      order: index,
      payloadMapping: intent.payload
    }));

    return {
      id: `plan_${Date.now()}`,
      goal: `Ejecución generada por Intent ${intent.type}`,
      steps
    };
  }
}
