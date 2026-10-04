import { IExecutionRuntime } from './execution-runtime';
import { ExecutionInstance } from './execution-instance';
import { WorkflowDefinition } from './workflow-definition';
import { Identity, HumanDecision, PendingAction, ExecutionIdentitySnapshot } from '../contracts';
import { IPolicyEngine } from './policy-engine';
import { IExecutionJournal } from './execution-journal';

export class DefaultExecutionRuntime implements IExecutionRuntime {
  // En memoria para la validación (MVP)
  private instances = new Map<string, ExecutionInstance<any, string>>();

  constructor(
    private policyEngine: IPolicyEngine,
    private journal: IExecutionJournal
  ) {}

  public async start<TPayload, TState extends string>(
    workflow: WorkflowDefinition<any, TState>, 
    initialPayload: TPayload, 
    identity: ExecutionIdentitySnapshot
  ): Promise<ExecutionInstance<TPayload, TState>> {

    const instanceId = `exec_${Date.now()}`;
    const instance: ExecutionInstance<TPayload, TState> = {
      id: instanceId,
      workflowDefinitionId: workflow.id,
      status: 'RUNNING',
      currentStage: workflow.initialState as TState,
      identityContext: identity,
      payload: initialPayload,
      runtimeMemory: {},
      pendingActions: [],
      generatedArtifacts: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Policy check
    const actor: Identity = { id: identity.actor.userId, type: 'USER', roles: identity.actor.roles };
    const policyResult = await this.policyEngine.canExecute(workflow, instance, actor);
    if (!policyResult.allowed) {
      instance.status = 'FAILED';
      throw new Error(`Policy Rejected: ${policyResult.reason}`);
    }

    this.instances.set(instanceId, instance);

    await this.journal.append({
      id: `evt_${Date.now()}`,
      instanceId,
      workflowId: workflow.id,
      type: 'EXECUTION_STARTED',
      payload: { stage: instance.currentStage },
      actor: actor,
      timestamp: new Date().toISOString()
    });

    await this.drive(instance, workflow, actor);

    return instance;
  }

  public async resume<TPayload, TState extends string>(
    workflow: WorkflowDefinition<any, TState>,
    instanceId: string, 
    decision: HumanDecision, 
    identity: Identity
  ): Promise<ExecutionInstance<TPayload, TState>> {
    const instance = this.instances.get(instanceId) as ExecutionInstance<TPayload, TState>;
    if (!instance) throw new Error('Instance not found');

    if (instance.status !== 'PAUSED') {
      throw new Error(`Cannot resume instance in status: ${instance.status}`);
    }

    await this.journal.append({
      id: `evt_${Date.now()}`,
      instanceId,
      workflowId: instance.workflowDefinitionId,
      type: 'DECISION_SUBMITTED',
      payload: { decision },
      actor: identity,
      timestamp: new Date().toISOString()
    });

    // Resolve all pending actions for now
    instance.pendingActions = instance.pendingActions.map(pa => ({ ...pa, status: 'RESOLVED' }));
    instance.status = 'RUNNING';
    instance.runtimeMemory['lastDecision'] = decision;

    await this.drive(instance, workflow, identity);

    return instance;
  }

  public async cancel(instanceId: string, identity: Identity, reason: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    instance.status = 'CANCELLED';
    await this.journal.append({
      id: `evt_${Date.now()}`,
      instanceId,
      workflowId: instance.workflowDefinitionId,
      type: 'EXECUTION_CANCELLED',
      payload: { reason },
      actor: identity,
      timestamp: new Date().toISOString()
    });
  }

  public async retry(workflow: WorkflowDefinition<any, any>, instanceId: string, identity: Identity): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'FAILED') return;
    
    instance.status = 'RUNNING';
    await this.drive(instance, workflow, identity);
  }

  private async drive(instance: ExecutionInstance<any, string>, workflow: WorkflowDefinition<any, string>, identity: Identity) {
    console.log(`[Runtime] Driving instance ${instance.id}. Current state: ${instance.currentStage}`);
    
    // Simulate generic stage transition logic based on workflow transitions definition
    let advanced = true;
    while (advanced && !workflow.terminalStates.includes(instance.currentStage)) {
      advanced = false;
      const possibleTransitions = workflow.transitions?.[instance.currentStage] || [];
      
      // Stub logic for demonstration: 
      // Si el estado es 'CONTENT_GENERATION', transiciona a 'REVIEW'
      if (instance.currentStage === 'CONTENT_GENERATION') {
        this.transitionTo(instance, workflow, 'REVIEW', identity);
        advanced = true;
      }
      // Soporte para Sales Workflow (CRM)
      else if (instance.currentStage === 'PROSPECT') {
        this.transitionTo(instance, workflow, 'QUALIFIED', identity);
        advanced = true;
      }
      else if (instance.currentStage === 'QUALIFIED') {
        this.transitionTo(instance, workflow, 'PROPOSAL', identity);
        advanced = true;
      }
      else if (instance.currentStage === 'PROPOSAL') {
        const lastDecision = instance.runtimeMemory['lastDecision'];
        if (!lastDecision) {
          console.log(`[Runtime] Pausing for Commercial Decision on ${instance.id}`);
          instance.status = 'PAUSED';
          instance.pendingActions.push({
            id: `pa_${Date.now()}`,
            type: 'APPROVE_PROPOSAL',
            status: 'PENDING',
            instructions: 'Approve or Reject the proposal deal',
            contextRef: instance.id
          });
          break;
        } else {
          if (lastDecision.type === 'APPROVED') {
            this.transitionTo(instance, workflow, 'CLOSED_WON', identity);
            advanced = true;
          } else {
            this.transitionTo(instance, workflow, 'CLOSED_LOST', identity);
            advanced = true;
          }
        }
      }
      // Si el estado es 'REVIEW', PAUSA y espera acción humana si no hay una decisión reciente
      else if (instance.currentStage === 'REVIEW') {
        const lastDecision = instance.runtimeMemory['lastDecision'];
        if (!lastDecision) {
          console.log(`[Runtime] Pausing for Human Approval on ${instance.id}`);
          instance.status = 'PAUSED';
          instance.pendingActions.push({
            id: `pa_${Date.now()}`,
            type: 'REVIEW_ASSETS',
            status: 'PENDING',
            instructions: 'Review generated assets before distribution',
            contextRef: instance.id
          });
          break; // Stop the loop
        } else {
          // Decisión tomada, mover a SCHEDULED
          if (lastDecision.type === 'APPROVED') {
            this.transitionTo(instance, workflow, 'SCHEDULED', identity);
            advanced = true;
          } else {
            instance.status = 'CANCELLED'; // simplificado
            break;
          }
        }
      }
      else if (instance.currentStage === 'SCHEDULED') {
        this.transitionTo(instance, workflow, 'DISTRIBUTED', identity);
        advanced = true;
      }
    }

    if (workflow.terminalStates.includes(instance.currentStage) && instance.status === 'RUNNING') {
      instance.status = 'COMPLETED';
      instance.completedAt = new Date().toISOString();
      await this.journal.append({
        id: `evt_${Date.now()}`,
        instanceId: instance.id,
        workflowId: workflow.id,
        type: 'EXECUTION_COMPLETED',
        payload: {},
        actor: identity,
        timestamp: new Date().toISOString()
      });
    }
  }

  private transitionTo(instance: ExecutionInstance<any, string>, workflow: WorkflowDefinition<any, string>, newState: string, identity: Identity) {
    console.log(`[Runtime] Transitioning ${instance.id} from ${instance.currentStage} to ${newState}`);
    instance.currentStage = newState;
    this.journal.append({
      id: `evt_${Date.now()}`,
      instanceId: instance.id,
      workflowId: workflow.id,
      type: 'STAGE_FINISHED',
      payload: { newStage: newState },
      actor: identity,
      timestamp: new Date().toISOString()
    });
  }

  public getInstance(instanceId: string) {
    return this.instances.get(instanceId);
  }
}
