import { Artifact } from '../contracts';

/**
 * Representa una habilidad atómica que el OS puede ejecutar.
 * Ej: 'generate.image', 'crm.scoreOpportunity'
 */
export interface CapabilityDefinition {
  id: string;
  name: string;
  version: string;
  inputType: string;
  outputType: string;
}

import { ExecutionContext } from '../execution/execution-context';

/**
 * Interfaz que deben implementar todos los Providers (Adapters)
 */
export interface CapabilityAdapter<TInput = any, TOutput = any> {
  readonly adapterId: string;
  execute(input: TInput, context: ExecutionContext): Promise<TOutput>;
}

export class CapabilityRegistry {
  private capabilities: Map<string, CapabilityDefinition> = new Map();
  private adapters: Map<string, CapabilityAdapter[]> = new Map(); // Un capability puede tener múltiples adapters

  registerCapability(def: CapabilityDefinition): void {
    this.capabilities.set(def.id, def);
  }

  registerAdapter(capabilityId: string, adapter: CapabilityAdapter): void {
    if (!this.adapters.has(capabilityId)) {
      this.adapters.set(capabilityId, []);
    }
    this.adapters.get(capabilityId)!.push(adapter);
    console.log(`[CapabilityRegistry] Registered adapter '${adapter.adapterId}' for capability '${capabilityId}'`);
  }

  getCapability(id: string): CapabilityDefinition | null {
    return this.capabilities.get(id) || null;
  }

  getAdapters(capabilityId: string): CapabilityAdapter[] {
    return this.adapters.get(capabilityId) || [];
  }
}

export class CapabilityResolver {
  constructor(private registry: CapabilityRegistry) {}

  /**
   * Decide cuál es el mejor adapter para una capability específica.
   * Por ahora, devuelve el primero. En el futuro, evaluará carga, costo, SLA.
   */
  resolveAdapter(capabilityId: string): CapabilityAdapter | null {
    const adapters = this.registry.getAdapters(capabilityId);
    if (adapters.length === 0) return null;
    
    // Resolución trivial: el primero que encuentre
    return adapters[0] || null;
  }
}

export class CapabilityRuntime {
  constructor(
    private registry: CapabilityRegistry,
    private resolver: CapabilityResolver
  ) {}

  /**
   * Ejecuta una capacidad abstrayendo completamente al llamador del proveedor final.
   */
  async executeCapability<TInput, TOutput>(
    capabilityId: string, 
    input: TInput, 
    context: ExecutionContext
  ): Promise<TOutput> {
    
    console.log(`[CapabilityRuntime] Solicitando capacidad: ${capabilityId}`);
    
    const def = this.registry.getCapability(capabilityId);
    if (!def) {
      throw new Error(`Capability ${capabilityId} is not registered.`);
    }

    const adapter = this.resolver.resolveAdapter(capabilityId);
    if (!adapter) {
      throw new Error(`No available adapters resolved for capability ${capabilityId}.`);
    }

    console.log(`[CapabilityRuntime] Resolvió usar adapter: ${adapter.adapterId}`);
    
    // Ejecutamos
    const output = await adapter.execute(input, context);
    return output as TOutput;
  }
}
