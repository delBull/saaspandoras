import { ExecutionRequest, ExecutionResult, ServiceProvider } from '../../contracts/universal';
import { CompatibilityProvider } from '../../providers/compatibility-provider';
import { ExternalProvider } from '../../providers/external-provider';

export class Dispatcher {
  public static async dispatch(provider: ServiceProvider, context: ExecutionRequest): Promise<ExecutionResult> {
    if (provider.id === 'compatibility-provider') {
      return await CompatibilityProvider.execute(context);
    }
    
    if (provider.type === 'external') {
      const external = new ExternalProvider();
      return await external.execute(provider, context);
    }

    console.warn(`[Hermes OS] Dispatcher has no transport for provider type: ${provider.type} (ID: ${provider.id})`);
    
    return {
      status: 'failed',
      telemetry: { error: 'No transport available' }
    };
  }
}
