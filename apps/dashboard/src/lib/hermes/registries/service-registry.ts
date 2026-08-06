import { ServiceProvider } from '../contracts/universal';

/**
 * Service Registry
 * ADR-002: Maintains the catalog of all external and internal providers.
 */
export class ServiceRegistry {
  private providers: Map<string, ServiceProvider> = new Map();

  /**
   * Registers a new Service Provider in the Cognitive OS
   */
  public register(provider: ServiceProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`[ServiceRegistry] Overwriting existing provider: ${provider.id}`);
    }
    this.providers.set(provider.id, provider);
  }

  /**
   * Retrieves a Service Provider by its ID
   */
  public get(providerId: string): ServiceProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Retrieves all healthy providers
   */
  public getHealthyProviders(): ServiceProvider[] {
    return Array.from(this.providers.values()).filter(p => p.status === 'healthy');
  }

  /**
   * Returns all registered providers
   */
  public getAll(): ServiceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Unregisters a Service Provider
   */
  public unregister(providerId: string): boolean {
    return this.providers.delete(providerId);
  }
}

// Singleton instance for the Kernel
export const serviceRegistry = new ServiceRegistry();
