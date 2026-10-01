import { IExecutionRuntimeAdapter, ToolExecutionRequest, ToolExecutionResult } from './adapter-contracts';
import { CapabilityDispatcher } from '@/lib/hermes/capability-dispatcher';

export class NativeAdapter implements IExecutionRuntimeAdapter {
  public readonly adapterId = 'native_in_process_v1';
  public readonly isSandboxed = false; // Native execution runs in the same Node.js process

  async executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    try {
      // Delegating to existing CapabilityDispatcher for backward compatibility
      const dispatchRes = await CapabilityDispatcher.dispatch({
        projectId: parseInt(request.context.organizationId, 10) || 1,
        capability: request.toolName as any,
        payload: request.parameters,
        actorId: request.context.actorId,
      });

      return {
        success: dispatchRes.success,
        data: dispatchRes.data,
        error: !dispatchRes.success ? dispatchRes.userSummary : undefined,
        sandboxMetrics: {
          durationMs: Date.now() - startTime
        }
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unknown NativeAdapter error',
        sandboxMetrics: {
          durationMs: Date.now() - startTime
        }
      };
    }
  }
}
