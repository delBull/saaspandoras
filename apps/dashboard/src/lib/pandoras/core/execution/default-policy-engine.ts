import { IPolicyEngine, PolicyEvaluationResult } from './policy-engine';
import { WorkflowDefinition } from './workflow-definition';
import { ExecutionInstance } from './execution-instance';
import { Identity } from '../contracts';

export class DefaultPolicyEngine implements IPolicyEngine {
  async canExecute(
    workflow: WorkflowDefinition<any, string>, 
    instance: ExecutionInstance<any, string>, 
    identity: Identity
  ): Promise<PolicyEvaluationResult> {
    console.log(`[PolicyEngine] Evaluating CanExecute for workflow ${workflow.id}`);
    
    // Stub: siempre aprueba por ahora
    return { allowed: true };
  }

  async canTransition(
    instance: ExecutionInstance<any, string>, 
    targetState: string, 
    identity: Identity
  ): Promise<PolicyEvaluationResult> {
    console.log(`[PolicyEngine] Evaluating CanTransition to ${targetState} for instance ${instance.id}`);
    return { allowed: true };
  }
}
