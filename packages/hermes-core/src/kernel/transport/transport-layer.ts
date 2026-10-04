import { ExecutionRequest, ExecutionResult, ServiceProvider } from '../../contracts/universal';

/**
 * Transport Layer Interface
 * ADR-XXX: Providers should not know about HTTP. 
 * They delegate to a Transport (HTTP, MCP, gRPC).
 */
export interface TransportLayer {
  execute(provider: ServiceProvider, request: ExecutionRequest): Promise<ExecutionResult>;
}
