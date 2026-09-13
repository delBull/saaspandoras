/**
 * 🌉 Hermes OS — MCP Bridge Transport Engine (F6)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/mcp/mcp-bridge.ts
 *
 * Enforces Zero-Trust boundary over external Model Context Protocol servers.
 */

import { EgressGuard } from '../runtime/egress-guard';
import { 
  McpServerConfig, 
  McpTool, 
  McpToolCallRequest, 
  McpToolCallResponse 
} from './contracts';

export type McpToolHandler = (args?: Record<string, unknown>, context?: Record<string, unknown>) => Promise<unknown>;

export class HermesMcpBridge {
  private static instance: HermesMcpBridge;
  private servers: Map<string, McpServerConfig> = new Map();
  private toolHandlers: Map<string, Map<string, McpToolHandler>> = new Map();
  private toolDefinitions: Map<string, McpTool[]> = new Map();

  private constructor() {}

  public static getInstance(): HermesMcpBridge {
    if (!HermesMcpBridge.instance) {
      HermesMcpBridge.instance = new HermesMcpBridge();
    }
    return HermesMcpBridge.instance;
  }

  /**
   * Registers an MCP server configuration with declarative security filters.
   */
  public async registerServer(config: McpServerConfig): Promise<void> {
    if (!config.id || !config.name) {
      throw new Error('[HermesMcpBridge] server id and name are required.');
    }

    // Si el transporte es HTTP/SSE remoto, validar que el endpoint no sea un objetivo SSRF
    if (config.transport === 'HTTP_SSE' && config.endpoint) {
      const egressCheck = await EgressGuard.validateUrl(config.endpoint);
      if (!egressCheck.allowed) {
        throw new Error(`[HermesMcpBridge] MCP Server endpoint rejected by EgressGuard: ${egressCheck.reason}`);
      }
    }

    this.servers.set(config.id, Object.freeze({ ...config }));
    if (!this.toolHandlers.has(config.id)) {
      this.toolHandlers.set(config.id, new Map());
    }
    if (!this.toolDefinitions.has(config.id)) {
      this.toolDefinitions.set(config.id, []);
    }
  }

  /**
   * Mounts a tool handler onto a registered MCP server.
   */
  public mountTool(
    serverId: string, 
    toolDef: { name: string; description: string; inputSchema?: Record<string, unknown> },
    handler: McpToolHandler
  ): void {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`[HermesMcpBridge] Server '${serverId}' is not registered.`);
    }

    // Verificar si la tool está explícitamente denegada
    if (server.deniedTools && server.deniedTools.includes(toolDef.name)) {
      return; // No se monta una herramienta bloqueada por política
    }

    // Si hay lista blanca (allowedTools), verificar si está incluida
    if (server.allowedTools && server.allowedTools.length > 0 && !server.allowedTools.includes(toolDef.name)) {
      return; // Ignorada por no estar en la lista blanca
    }

    const handlers = this.toolHandlers.get(serverId)!;
    handlers.set(toolDef.name, handler);

    const tools = this.toolDefinitions.get(serverId)!;
    tools.push({
      name: toolDef.name,
      description: toolDef.description,
      inputSchema: toolDef.inputSchema || {},
      serverId,
    });
  }

  /**
   * Lists exposed tools for an MCP server, strictly filtered by allow/deny rules.
   */
  public listTools(serverId: string): McpTool[] {
    return this.toolDefinitions.get(serverId) || [];
  }

  /**
   * Executes a tool through the MCP Bridge with security enforcement.
   */
  public async executeTool(request: McpToolCallRequest): Promise<McpToolCallResponse> {
    const startTime = Date.now();
    const { serverId, toolName, arguments: args, tenantId } = request;

    const server = this.servers.get(serverId);
    if (!server) {
      return {
        success: false,
        serverId,
        toolName,
        error: `MCP Server '${serverId}' is not registered.`,
        durationMs: Date.now() - startTime,
      };
    }

    // 1. Tenant Scope Check
    if (server.tenantScope && server.tenantScope !== 'global' && server.tenantScope !== tenantId) {
      return {
        success: false,
        serverId,
        toolName,
        error: `Cross-tenant violation: Server '${serverId}' scoped to '${server.tenantScope}' cannot be accessed by '${tenantId}'.`,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Denied Tools Filter
    if (server.deniedTools && server.deniedTools.includes(toolName)) {
      return {
        success: false,
        serverId,
        toolName,
        error: `Tool '${toolName}' is explicitly DENIED by MCP security policy on server '${serverId}'.`,
        durationMs: Date.now() - startTime,
      };
    }

    // 3. Allowed Tools Filter
    if (server.allowedTools && server.allowedTools.length > 0 && !server.allowedTools.includes(toolName)) {
      return {
        success: false,
        serverId,
        toolName,
        error: `Tool '${toolName}' is not in the allowedTools whitelist for server '${serverId}'.`,
        durationMs: Date.now() - startTime,
      };
    }

    // 4. Lookup Handler
    const handlers = this.toolHandlers.get(serverId);
    const handler = handlers?.get(toolName);
    if (!handler) {
      return {
        success: false,
        serverId,
        toolName,
        error: `Tool '${toolName}' is not available on server '${serverId}'.`,
        durationMs: Date.now() - startTime,
      };
    }

    // 5. Execute with Timeout
    const timeoutMs = server.timeoutMs || 8000;
    try {
      const data = await Promise.race([
        handler(args, { tenantId, serverId }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`MCP Tool execution timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      return {
        success: true,
        serverId,
        toolName,
        data,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        serverId,
        toolName,
        error: err.message || String(err),
        durationMs: Date.now() - startTime,
      };
    }
  }

  public clear(): void {
    this.servers.clear();
    this.toolHandlers.clear();
    this.toolDefinitions.clear();
  }
}
