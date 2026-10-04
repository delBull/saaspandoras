import { ExecutionPlan, ExecutionTask } from './kernel-types';

/**
 * Execution Scheduler
 * 
 * Takes the ExecutionPlan from the Policy Engine and organizes tasks into a DAG (Directed Acyclic Graph).
 * For simplicity in this sprint, we assume independent tasks can run in parallel,
 * while blocking tasks must run first.
 */
export class ExecutionScheduler {
  schedule(plan: ExecutionPlan): ExecutionTask[][] {
    const blockingTasks = plan.tasks.filter(t => t.type === 'enforce_block');
    const normalTasks = plan.tasks.filter(t => t.type !== 'enforce_block');

    const dag: ExecutionTask[][] = [];

    // Stage 1: Blocking Tasks (run sequentially or in parallel if multiple, but before normal tasks)
    if (blockingTasks.length > 0) {
      dag.push(blockingTasks);
    }

    // Stage 2: Parallel execution of all other tasks
    if (normalTasks.length > 0) {
      dag.push(normalTasks);
    }

    return dag;
  }
}
