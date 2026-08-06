import { CapabilityDefinition } from '../contracts/universal';

/**
 * Capability Registry
 * ADR-003: Maintains the catalog of all functional contracts (what the OS can do).
 */
export class CapabilityRegistry {
  private capabilities: Map<string, CapabilityDefinition> = new Map();

  /**
   * Registers a new Capability definition
   */
  public register(capability: CapabilityDefinition): void {
    if (this.capabilities.has(capability.id)) {
      console.warn(`[CapabilityRegistry] Overwriting existing capability: ${capability.id}`);
    }
    this.capabilities.set(capability.id, capability);
  }

  /**
   * Retrieves a Capability definition by its ID
   */
  public get(capabilityId: string): CapabilityDefinition | undefined {
    return this.capabilities.get(capabilityId);
  }

  /**
   * Retrieves all capabilities for a specific domain (e.g. 'editorial')
   */
  public getByDomain(domain: string): CapabilityDefinition[] {
    return Array.from(this.capabilities.values()).filter(c => c.domain === domain);
  }

  /**
   * Returns all registered capabilities
   */
  public getAll(): CapabilityDefinition[] {
    return Array.from(this.capabilities.values());
  }
}

// Singleton instance for the Kernel
export const capabilityRegistry = new CapabilityRegistry();
