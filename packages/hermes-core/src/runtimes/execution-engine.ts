import { ExecutionTask } from './kernel-types';
import { IExecutor, LanguageExecutor, RoutingExecutor, SecurityExecutor } from './executors';
import { eventBus } from './event-bus';

export class ExecutionEngine {
  private executors = new Map<string, IExecutor>();

  constructor() {
    this.register(new LanguageExecutor());
    this.register(new RoutingExecutor());
    this.register(new SecurityExecutor());
  }

  register(executor: IExecutor) {
    this.executors.set(executor.supportedCapability, executor);
  }

  async executeDAG(dag: ExecutionTask[][]): Promise<any> {
    const sharedContext = {
      messages: [],
      navigation: [],
      actions: [],
    };

    for (const stage of dag) {
      // Execute all tasks in the current stage in parallel
      const stagePromises = stage.map(task => {
        const executor = this.executors.get(task.capabilityRequired);
        if (executor) {
          return executor.execute(task, sharedContext);
        } else {
          console.warn(`[ExecutionEngine] No executor found for capability: ${task.capabilityRequired}`);
          return Promise.resolve();
        }
      });

      await Promise.all(stagePromises);
    }

    eventBus.publish('ExecutionCompleted', { sharedContext });
    return sharedContext;
  }
}
