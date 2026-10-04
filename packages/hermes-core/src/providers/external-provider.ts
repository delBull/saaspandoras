import { ExecutionRequest, ExecutionResult, ServiceProvider } from '../contracts/universal';
import { HttpTransport } from '../kernel/transport/http-transport';
import { TransportLayer } from '../kernel/transport/transport-layer';

/**
 * 👑 Pandora's Platform OS — External Provider Adapter
 * 
 * ADR: External Provider shouldn't know about HTTP. It delegates to the Transport Layer.
 */
export class ExternalProvider {
  private transport: TransportLayer;

  constructor(transport?: TransportLayer) {
    this.transport = transport || new HttpTransport(); // Default to HTTP, but can be injected
  }

  public async execute(provider: ServiceProvider, context: ExecutionRequest): Promise<ExecutionResult> {
    console.log(`[ExternalProvider] Delegating ${context.capability} to ${provider.name} via Transport`);
    
    // Delegate to the transport layer
    return await this.transport.execute(provider, context);
  }
}
