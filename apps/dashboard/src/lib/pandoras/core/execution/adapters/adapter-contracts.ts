export interface ToolExecutionRequest {
  toolName: string;
  parameters: Record<string, any>;
  context: {
    organizationId: string;
    actorId: string;
    correlationId?: string;
  };
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  sandboxMetrics?: {
    durationMs: number;
    memoryUsedMb?: number;
  };
}

/**
 * Hito 3 - ExecutionAdapter (HARC-01)
 * Abstraction to isolate tool execution from the central database.
 * This allows swapping out in-process execution with secure sandboxes (Eve, Fleek, etc.)
 */
export interface IExecutionRuntimeAdapter {
  readonly adapterId: string;
  readonly isSandboxed: boolean;
  
  executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
}
