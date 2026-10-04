import { ProviderDefinition, ProviderId } from '../contracts';
import { AbstractProvider } from '../providers/abstract-provider';

/**
 * Mantiene el registro de todos los Providers inicializados en el sistema.
 * Permite descubrir qué provider soporta qué capabilities.
 */
export class ProviderRegistry {
  private static providers: Map<ProviderId, AbstractProvider> = new Map();

  /**
   * Registra un nuevo Provider en el ecosistema.
   */
  public static register(provider: AbstractProvider): void {
    const def = provider.definition;
    
    if (this.providers.has(def.id)) {
      console.warn(`[ProviderRegistry] Provider ${def.id} está siendo sobrescrito.`);
    }

    this.providers.set(def.id, provider);
    console.info(`[ProviderRegistry] Registrado Provider: ${def.name} (${def.id}) con ${def.capabilities.length} capabilities.`);
  }

  /**
   * Recupera un Provider específico por ID.
   */
  public static get(providerId: ProviderId): AbstractProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Obtiene todos los Providers registrados.
   */
  public static getAll(): AbstractProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Obtiene las definiciones de todos los providers para auditoría/descubrimiento.
   */
  public static getDefinitions(): ProviderDefinition[] {
    return this.getAll().map(p => p.definition);
  }

  /**
   * Limpia el registro (útil para tests).
   */
  public static clear(): void {
    this.providers.clear();
  }
}
