/**
 * 🔌 Hermes OS — MCP (Model Context Protocol) Bridge Contracts (F6)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/mcp/contracts.ts
 *
 * ARCHITECTURAL INVARIANT:
 * MCP is a Transport Adapter, NOT an Authority.
 * Tools exposed by MCP servers MUST pass strict allow/deny filters,
 * anti-SSRF checks, and capability mapping before execution.
 */

export type McpServerTransportType = 'STDIO' | 'HTTP_SSE' | 'IN_PROCESS';

export interface McpServerConfig {
  id: string;
  name: string;
  transport: McpServerTransportType;
  endpoint?: string;
  allowedTools?: string[];
  deniedTools?: string[];
  defaultRiskClass?: 'LOW' | 'MEDIUM' | 'HIGH';
  timeoutMs?: number;
  tenantScope?: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
}

export interface McpToolCallRequest {
  serverId: string;
  toolName: string;
  arguments?: Record<string, unknown>;
  tenantId: string;
}

export interface McpToolCallResponse {
  success: boolean;
  serverId: string;
  toolName: string;
  data?: unknown;
  error?: string;
  durationMs: number;
}
