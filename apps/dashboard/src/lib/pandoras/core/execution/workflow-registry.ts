import { WorkflowDefinition } from './workflow-definition';

export interface WorkflowMetadata {
  status: 'ACTIVE' | 'DEPRECATED' | 'EXPERIMENTAL';
  tags: string[];
  owner: string;
  createdAt: string;
}

export interface RegisteredWorkflow {
  definition: WorkflowDefinition;
  metadata: WorkflowMetadata;
}

/**
 * Registry central para todas las definiciones de workflows.
 * Hermes y los motores buscarán aquí por ID para ejecutar.
 */
export class WorkflowRegistry {
  private registry: Map<string, RegisteredWorkflow> = new Map();

  register(definition: WorkflowDefinition, metadata: WorkflowMetadata): void {
    if (this.registry.has(definition.id)) {
      console.warn(`[WorkflowRegistry] Overwriting workflow definition: ${definition.id}`);
    }
    this.registry.set(definition.id, { definition, metadata });
    console.log(`[WorkflowRegistry] Registered workflow: ${definition.id}@${definition.version} (Status: ${metadata.status})`);
  }

  get(workflowId: string): RegisteredWorkflow | null {
    return this.registry.get(workflowId) || null;
  }

  listActive(): RegisteredWorkflow[] {
    return Array.from(this.registry.values()).filter(w => w.metadata.status === 'ACTIVE');
  }
}
