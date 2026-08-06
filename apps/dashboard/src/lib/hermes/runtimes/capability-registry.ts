import { Capability } from './kernel-types';

/**
 * Capability Registry
 * 
 * Maps capabilities (e.g. 'language.generate') to the Module IDs that provide them.
 */
class CapabilityRegistry {
  private registry = new Map<Capability, Set<string>>();

  register(providerId: string, capabilities: Capability[]) {
    for (const cap of capabilities) {
      if (!this.registry.has(cap)) {
        this.registry.set(cap, new Set());
      }
      this.registry.get(cap)!.add(providerId);
    }
  }

  getProvidersFor(capability: Capability): string[] {
    return Array.from(this.registry.get(capability) || []);
  }

  hasCapability(capability: Capability): boolean {
    return (this.registry.get(capability)?.size ?? 0) > 0;
  }
}

export const capabilityRegistry = new CapabilityRegistry();
