/**
 * Hermes OS — Kernel Types
 */

export type AuthorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'SYSTEM';
export type DecisionType = 'navigate' | 'communicate' | 'block' | 'update_workflow' | 'render_ui' | 'queue_media';
export type Capability = 'language.generate' | 'vision.describe' | 'routing.navigate' | 'security.authorize' | 'workflow.advance';

export interface Decision {
  source: string;
  type: DecisionType;
  authority: AuthorityLevel;
  priority: number;     // 0-1000
  confidence: number;   // 0.0-1.0
  blocking: boolean;
  costEstimate?: number;
  payload: any;
}

export interface ExecutionTask {
  id: string;
  type: string; // e.g. 'explain_investment', 'render_cards', 'redirect_login'
  capabilityRequired: Capability;
  payload: any;
  dependsOn?: string[]; // IDs of tasks that must complete first (DAG edges)
}

export interface ExecutionPlan {
  goals: string[];
  tasks: ExecutionTask[];
}

export interface KernelContext {
  tenantId: number;
  sessionId: string;
  input: string;
  artifacts: {
    runtime?: any;
    content?: any;
    discovery?: any;
    configGraph?: any;
    meshGraph?: any;
  };
  state: Record<string, any>;
}
