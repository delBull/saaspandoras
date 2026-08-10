import { WorkflowRegistry } from '../execution/workflow-registry';
import { CapabilityRegistry, CapabilityResolver, CapabilityRuntime } from '../capabilities/capability-runtime';
import { KnowledgeEngine } from '../knowledge/knowledge-engine';
import { PatternExtractor } from '../knowledge/pattern-extractor';
import { AssetRepository } from '../knowledge/asset-repository';
import { DefaultPlatformEventBus } from '../platform/events/default-event-bus';
import { DefaultExecutionJournal } from '../execution/default-execution-journal';
import { DefaultPolicyEngine } from '../execution/default-policy-engine';

import { DefaultExecutionRuntime } from '../execution/default-execution-runtime';
import { ExecutionDirector } from '../execution/execution-director';
import { Identity, HumanDecision, ExecutionIdentitySnapshot } from '../../core/contracts'; // <-- from contracts
import { ExecutionInstance } from '../execution/execution-instance';

/**
 * Representa el Sistema Operativo vivo (El Kernel en ejecución).
 * Mantiene todas las referencias a los motores internos.
 */
export class PandorasRuntime {
  public readonly workflowRegistry: WorkflowRegistry;
  public readonly capabilityRegistry: CapabilityRegistry;
  public readonly capabilityRuntime: CapabilityRuntime;
  public readonly director: ExecutionDirector;
  
  constructor() {
    // 1. Capa Capability
    this.capabilityRegistry = new CapabilityRegistry();
    const resolver = new CapabilityResolver(this.capabilityRegistry);
    this.capabilityRuntime = new CapabilityRuntime(this.capabilityRegistry, resolver);

    // 2. Capa Eventos y Journal
    const eventBus = new DefaultPlatformEventBus();
    const journal = new DefaultExecutionJournal(eventBus);

    // 3. Capa Knowledge
    const extractor = new PatternExtractor(journal);
    const assetRepo = new AssetRepository();
    const knowledge = new KnowledgeEngine(extractor, assetRepo);
    eventBus.register(knowledge);

    // 4. Capa Execution
    const policyEngine = new DefaultPolicyEngine();
    const runtime = new DefaultExecutionRuntime(policyEngine, journal);
    
    // 5. Capa Director y Workflows
    this.workflowRegistry = new WorkflowRegistry();
    this.director = new ExecutionDirector(this.workflowRegistry, runtime);
  }

  // Métodos expuestos para la capa superior (Hermes / Apps)
  public async startProcess(workflowId: string, payload: any, identitySnapshot: ExecutionIdentitySnapshot): Promise<ExecutionInstance<any, string>> {
    return this.director.startProcess(workflowId, payload, identitySnapshot);
  }

  public async resumeProcess(workflowId: string, instanceId: string, decision: HumanDecision, actor: Identity): Promise<void> {
    return this.director.resumeProcess(workflowId, instanceId, decision, actor);
  }

  public async cancelProcess(instanceId: string, actor: Identity, reason?: string): Promise<void> {
    return this.director.cancelProcess(instanceId, actor, reason);
  }
}

/**
 * Bootstraps the Pandora's OS Runtime.
 */
export function createPandorasRuntime(): PandorasRuntime {
  return new PandorasRuntime();
}
