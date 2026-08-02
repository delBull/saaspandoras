export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  cost: 'FREE' | 'METERED';
  latency: 'REALTIME' | 'ASYNC';
  requiresApproval: boolean;
  handler: (input: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition) {
    this.tools.set(tool.id, tool);
  }

  get(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}
