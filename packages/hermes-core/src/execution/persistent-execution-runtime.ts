import { IExecutionRuntime } from './execution-runtime';
import { ExecutionInstance } from './execution-instance';
import { WorkflowDefinition } from './workflow-definition';
import { Identity, HumanDecision, ExecutionIdentitySnapshot } from '../contracts';
import { IPolicyEngine } from './policy-engine';
import { IExecutionJournal } from './execution-journal';
import { CheckpointRepository } from './checkpoint-repository';
import crypto from 'crypto';

export class PersistentExecutionRuntime implements IExecutionRuntime {
  
  constructor(
    private policyEngine: IPolicyEngine,
    private journal: IExecutionJournal,
    private checkpointRepo: CheckpointRepository
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
    
    const checkpoint = await this.checkpointRepo.findById(instanceId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found for instance: ${instanceId}`);
    }

    if (checkpoint.status !== 'PENDING_APPROVAL') {
      throw new Error(`Cannot resume checkpoint in status: ${checkpoint.status}`);
    }

    // Zero-Trust Invariant 2: Hash Check
    const currentHash = crypto.createHash('sha256').update(JSON.stringify(checkpoint.statePayload)).digest('hex');
    if (currentHash !== checkpoint.stateIntegrityHash) {
      throw new Error('FAIL-CLOSED: Checkpoint state integrity hash mismatch. Possible tampering.');
    }

    const instance = checkpoint.statePayload as ExecutionInstance<TPayload, TState>;

    await this.journal.append({
      id: `evt_${Date.now()}`,
      instanceId,
      workflowId: instance.workflowDefinitionId,
      type: 'DECISION_SUBMITTED',
      payload: { decision },
      actor: identity,
      timestamp: new Date().toISOString()
    });

    // Zero-Trust: Re-evaluate policy before actually running
    const policyResult = await this.policyEngine.canExecute(workflow, instance, identity);
    if (!policyResult.allowed) {
      instance.status = 'FAILED';
      throw new Error(`Policy Rejected on Resume: ${policyResult.reason}`);
    }

    // Mark resumed in DB
    await this.checkpointRepo.markResumed(instanceId);

    instance.pendingActions = instance.pendingActions.map(pa => ({ ...pa, status: 'RESOLVED' }));
    instance.status = 'RUNNING';
    instance.runtimeMemory['lastDecision'] = decision;

    await this.drive(instance, workflow, identity);

    return instance;
  }

  public async cancel(instanceId: string, identity: Identity, reason: string): Promise<void> {
    const checkpoint = await this.checkpointRepo.findById(instanceId);
    if (!checkpoint) return;

    await this.checkpointRepo.markCancelled(instanceId);

    const instance = checkpoint.statePayload as ExecutionInstance<any, any>;
    
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
    const checkpoint = await this.checkpointRepo.findById(instanceId);
    if (!checkpoint) return;
    
    const instance = checkpoint.statePayload as ExecutionInstance<any, any>;
    if (instance.status !== 'FAILED') return;
    
    instance.status = 'RUNNING';
    await this.drive(instance, workflow, identity);
  }

  private async drive(instance: ExecutionInstance<any, string>, workflow: WorkflowDefinition<any, string>, identity: Identity) {
    console.log(`[PersistentRuntime] Driving instance ${instance.id}. Current state: ${instance.currentStage}`);
    
    let advanced = true;
    while (advanced && !workflow.terminalStates.includes(instance.currentStage)) {
      advanced = false;
      const possibleTransitions = workflow.transitions?.[instance.currentStage] || [];
      
      if (instance.currentStage === 'CONTENT_GENERATION') {
        this.transitionTo(instance, workflow, 'REVIEW', identity);
        advanced = true;
      }
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
          console.log(`[PersistentRuntime] Pausing for Commercial Decision on ${instance.id}`);
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
      else if (instance.currentStage === 'REVIEW') {
        const lastDecision = instance.runtimeMemory['lastDecision'];
        if (!lastDecision) {
          console.log(`[PersistentRuntime] Pausing for Human Approval on ${instance.id}`);
          instance.status = 'PAUSED';
          instance.pendingActions.push({
            id: `pa_${Date.now()}`,
            type: 'REVIEW_ASSETS',
            status: 'PENDING',
            instructions: 'Review generated assets before distribution',
            contextRef: instance.id
          });
          break;
        } else {
          if (lastDecision.type === 'APPROVED') {
            this.transitionTo(instance, workflow, 'SCHEDULED', identity);
            advanced = true;
          } else {
            instance.status = 'CANCELLED'; 
            break;
          }
        }
      }
      else if (instance.currentStage === 'SCHEDULED') {
        this.transitionTo(instance, workflow, 'DISTRIBUTED', identity);
        advanced = true;
      }
    }

    if (instance.status === 'PAUSED') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days expiry

      // Save to DB
      await this.checkpointRepo.save({
        organizationId: instance.identityContext.organization.id,
        sessionId: instance.id,
        actorId: identity.id,
        currentStageId: instance.currentStage,
        statePayload: instance,
        expiresAt: expiresAt,
        status: 'PENDING_APPROVAL'
      });
      console.log(`[PersistentRuntime] Checkpoint persisted for instance ${instance.id}`);
    } else if (workflow.terminalStates.includes(instance.currentStage) && instance.status === 'RUNNING') {
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
    console.log(`[PersistentRuntime] Transitioning ${instance.id} from ${instance.currentStage} to ${newState}`);
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
}
