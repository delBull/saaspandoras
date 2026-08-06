import { CapabilityBinding } from '../contracts/universal';

/**
 * Binding Registry
 * ADR-004: Resolves which Provider executes which Capability.
 */
export class BindingRegistry {
  // Map of Capability ID -> Array of Bindings
  private bindings: Map<string, CapabilityBinding[]> = new Map();

  /**
   * Registers a new Binding
   */
  public register(binding: CapabilityBinding): void {
    const existing = this.bindings.get(binding.capabilityId) || [];
    // Remove if exactly the same provider/tenant exists to avoid duplicates
    const filtered = existing.filter(b => 
      !(b.providerId === binding.providerId && b.tenantId === binding.tenantId)
    );
    filtered.push(binding);
    // Sort by priority descending
    filtered.sort((a, b) => b.priority - a.priority);
    
    this.bindings.set(binding.capabilityId, filtered);
  }

  /**
   * Resolves the best provider for a capability, optionally scoped to a tenant
   */
  public resolve(capabilityId: string, tenantId?: string): CapabilityBinding | undefined {
    const allBindings = this.bindings.get(capabilityId);
    if (!allBindings || allBindings.length === 0) return undefined;

    // Filter active bindings
    const activeBindings = allBindings.filter(b => b.isActive);
    
    if (tenantId) {
      // Try to find a tenant-specific binding first
      const tenantSpecific = activeBindings.find(b => b.tenantId === tenantId);
      if (tenantSpecific) return tenantSpecific;
    }

    // Fallback to highest priority global binding (no tenant ID specified)
    return activeBindings.find(b => !b.tenantId);
  }

  /**
   * Retrieves all bindings for a capability
   */
  public getAllForCapability(capabilityId: string): CapabilityBinding[] {
    return this.bindings.get(capabilityId) || [];
  }
}

// Singleton instance for the Kernel
export const bindingRegistry = new BindingRegistry();
