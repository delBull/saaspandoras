import { WorkflowDefinition } from '../execution/workflow-definition';
import { WorkflowMetadata } from '../execution/workflow-registry';

export interface WorkflowPack<TPayload = any, TState extends string = string> {
  definition: WorkflowDefinition<TPayload, TState>;
  metadata: WorkflowMetadata;
}

/**
 * Define de manera declarativa un Workflow y sus metadatos asociados.
 */
export function defineWorkflow<TPayload = any, TState extends string = string>(
  definition: WorkflowDefinition<TPayload, TState>,
  metadata: Partial<WorkflowMetadata> = {}
): WorkflowPack<TPayload, TState> {
  return {
    definition,
    metadata: {
      status: metadata.status || 'ACTIVE',
      tags: metadata.tags || [],
      owner: metadata.owner || 'system',
      createdAt: metadata.createdAt || new Date().toISOString()
    }
  };
}
