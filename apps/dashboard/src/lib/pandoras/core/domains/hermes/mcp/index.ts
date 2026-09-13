/**
 * 📦 Hermes OS — MCP Public API (F6)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/mcp/index.ts
 */

import { HermesToolExecutor } from '../runtime/tool-executor';
import { HermesMcpBridge } from './mcp-bridge';

export * from './contracts';
export * from './mcp-bridge';

/**
 * Registers MCP gateway tools into HermesToolExecutor.
 */
export function registerMcpTools(executor: HermesToolExecutor): void {
  const bridge = HermesMcpBridge.getInstance();

  executor.registerHandler('mcp.execute', async (params, context) => {
    const serverId = (params as any)?.serverId;
    const toolName = (params as any)?.toolName;
    const args = (params as any)?.arguments || (params as any)?.args;
    const tenantId = (params as any)?.tenantId || (context as any)?.organizationId || 'global';

    return bridge.executeTool({
      serverId,
      toolName,
      arguments: args,
      tenantId,
    });
  });
}
