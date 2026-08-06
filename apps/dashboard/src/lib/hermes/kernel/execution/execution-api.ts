import { ExecutionRequest, ExecutionResult } from '../../contracts/universal';
import { BootSequence } from '../boot/boot-sequence';
import { Dispatcher } from './dispatcher';
import { ResourceManager } from './resource-manager';
import { Scheduler } from '../scheduler/scheduler';
import { DecisionJournal } from '../intelligence/decision-journal';

/**
 * Unified Execution API
 * ADR-001: The single entry point for all cognitive execution requests.
 */
export class HermesExecutionEngine {
  constructor() {
    console.log('[Hermes OS] Execution Engine v5 Instantiated');
  }
  
  /**
   * Universal Execution Method.
   * All Channel Adapters, Web Widgets, APIs, and CLI must route through this.
   */
  public async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    console.log(`[Hermes OS] Received ExecutionRequest: ${request.executionId} -> ${request.capability}`);

    // Ensure system is booted (idempotent)
    await BootSequence.boot();

    // 1. Scheduler: Enqueue job in DB
    await Scheduler.enqueue(request);

    try {
      // 2. Resource Manager: Decide who handles this
      const { binding, provider } = ResourceManager.resolveProvider(request);
      
      // Update state
      await Scheduler.updateState(request.executionId, 'Running');
      console.log(`[Hermes OS] Routing via Resource Manager to Provider: ${provider.name} (Priority: ${binding.priority})`);

      // 3. Dispatch to Provider via appropriate Transport Layer
      const result = await Dispatcher.dispatch(provider, request);
      
      // 4. Intelligence Engine: Log the decision
      await DecisionJournal.logDecision(request, binding, provider, result);

      if (result.status === 'running') {
        // Handled by callback route later
        // State was already set to 'Waiting Callback' by Transport
      } else {
        await Scheduler.updateState(request.executionId, 'Completed', result);
      }

      return result;

    } catch (error: any) {
      console.error(`[Hermes OS] Execution failed for ${request.executionId}:`, error);
      
      // Log failure in DB
      await Scheduler.updateState(request.executionId, 'Failed', {
        status: 'failed',
        telemetry: { error: error.message }
      });
      
      const failedResult: ExecutionResult = {
        status: 'failed',
        telemetry: { error: error.message }
      };

      await DecisionJournal.logDecision(request, {} as any, {} as any, failedResult);
      
      return failedResult;
    }
  }
}

// Singleton instance for the OS Kernel
export const Hermes = new HermesExecutionEngine();
