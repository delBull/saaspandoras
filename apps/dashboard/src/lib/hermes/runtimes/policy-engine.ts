import { Decision, ExecutionPlan, ExecutionTask, AuthorityLevel } from './kernel-types';
import { eventBus } from './event-bus';

const AUTHORITY_WEIGHT: Record<AuthorityLevel, number> = {
  'SYSTEM': 4000,
  'HIGH': 3000,
  'MEDIUM': 2000,
  'LOW': 1000,
};

export class PolicyEngine {
  
  /**
   * Arbitrates a set of decisions and returns an ExecutionPlan
   */
  arbitrate(decisions: Decision[]): ExecutionPlan {
    const plan: ExecutionPlan = { goals: [], tasks: [] };
    let taskCounter = 0;

    // Sort decisions by absolute weight: Authority + Priority + (Confidence * 100)
    // In a real system, you might not just sort, but resolve logical conflicts.
    const sorted = decisions.sort((a, b) => {
      const weightA = AUTHORITY_WEIGHT[a.authority] + a.priority + (a.confidence * 100);
      const weightB = AUTHORITY_WEIGHT[b.authority] + b.priority + (b.confidence * 100);
      return weightB - weightA;
    });

    for (const decision of sorted) {
      if (decision.blocking) {
        eventBus.publish('PolicyDenied', { decision });
        // If a blocking decision exists, we might abort conflicting lower-authority decisions
        // For simplicity, we just add the blocking task and ignore conflicts here.
        plan.goals.push(`Enforce block from ${decision.source}`);
        plan.tasks.push({
          id: `task_${taskCounter++}`,
          type: 'enforce_block',
          capabilityRequired: 'security.authorize',
          payload: decision.payload,
        });
        continue;
      }

      if (decision.type === 'navigate') {
        plan.goals.push(`Navigate to ${decision.payload.path}`);
        plan.tasks.push({
          id: `task_${taskCounter++}`,
          type: 'redirect',
          capabilityRequired: 'routing.navigate',
          payload: decision.payload,
        });
      }

      if (decision.type === 'communicate') {
        plan.goals.push(`Communicate: ${decision.payload.task}`);
        plan.tasks.push({
          id: `task_${taskCounter++}`,
          type: decision.payload.task,
          capabilityRequired: 'language.generate',
          payload: decision.payload,
        });
      }
    }

    eventBus.publish('DecisionApproved', { plan });
    return plan;
  }
}
