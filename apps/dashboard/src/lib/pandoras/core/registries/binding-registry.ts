import { Binding, CapabilityId, ProviderId } from '../contracts';
import { ProviderRegistry } from './provider-registry';
import { AbstractProvider } from '../providers/abstract-provider';

/**
 * El BindingRegistry resuelve quién ejecuta qué.
 * Mapea una CapabilityId a un ProviderId específico.
 */
export class BindingRegistry {
  // Mapa de CapabilityId -> Binding
  private static bindings: Map<CapabilityId, Binding> = new Map();

  /**
   * Registra un nuevo Binding (enlace entre capacidad y provider).
   * Si ya existe uno, se reemplazará si la prioridad del nuevo es mayor o igual.
   */
  public static register(binding: Binding): void {
    if (!binding.enabled) return;

    const existing = this.bindings.get(binding.capability);
    if (existing && existing.priority > binding.priority) {
      console.debug(`[BindingRegistry] Ignorando binding para ${binding.capability} por prioridad menor.`);
      return;
    }

    this.bindings.set(binding.capability, binding);
    console.info(`[BindingRegistry] Capability [${binding.capability}] -> Provider [${binding.providerId}]`);
  }

  /**
   * Resuelve una capability a su instancia de Provider concreta.
   * Lanza un error si no hay un binding o si el provider no está inicializado.
   */
  public static resolve(capability: CapabilityId): AbstractProvider {
    const binding = this.bindings.get(capability);
    
    if (!binding) {
      throw new Error(`[BindingRegistry] No hay ningún Binding registrado para la capacidad: ${capability}`);
    }

    const provider = ProviderRegistry.get(binding.providerId);
    
    if (!provider) {
      throw new Error(`[BindingRegistry] Binding apunta al provider ${binding.providerId}, pero no está registrado en el ProviderRegistry.`);
    }

    if (!provider.supports(capability)) {
      throw new Error(`[BindingRegistry] Conflicto: Provider ${binding.providerId} fue enlazado a ${capability}, pero su definición no la declara.`);
    }

    return provider;
  }

  /**
   * Carga una configuración completa de bindings.
   */
  public static loadBindings(bindings: Binding[]): void {
    bindings.forEach(b => this.register(b));
  }

  public static clear(): void {
    this.bindings.clear();
  }
}
