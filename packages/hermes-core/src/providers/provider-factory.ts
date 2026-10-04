import { ServiceProvider } from '../contracts/universal';
import { serviceRegistry } from '../registries/service-registry';

/**
 * Loads and provisions service providers from manifests.
 */
export class ProviderFactory {
  public static loadManifest(manifest: Partial<ServiceProvider>): void {
    if (!manifest.id || !manifest.name || !manifest.type) {
      throw new Error(`[ProviderFactory] Invalid manifest provided: missing required fields.`);
    }

    const provider: ServiceProvider = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version || '1.0.0',
      type: manifest.type as any,
      status: manifest.status || 'healthy',
      authentication: manifest.authentication,
      endpoint: manifest.endpoint,
      capabilities: manifest.capabilities || [],
      metadata: manifest.metadata
    };

    serviceRegistry.register(provider);
    console.log(`[Hermes OS] Loaded provider from manifest: ${provider.name} (${provider.id})`);
  }
}
