import { ExecutionRequest, CapabilityBinding, ServiceProvider } from '../../contracts/universal';
import { capabilityRegistry } from '../../registries/capability-registry';
import { bindingRegistry } from '../../registries/binding-registry';
import { serviceRegistry } from '../../registries/service-registry';

/**
 * 🏭 Execution Engine — Resource Manager
 * ADR-XXX: Separates decision making from execution. 
 * Resolves the best provider for a capability based on bindings and health.
 */
export class ResourceManager {
  public static resolveProvider(request: ExecutionRequest): { binding: CapabilityBinding, provider: ServiceProvider } {
    const capabilityDef = capabilityRegistry.get(request.capability);
    
    if (!capabilityDef) {
      throw new Error(`[ResourceManager] Capability not found: ${request.capability}`);
    }

    const binding = bindingRegistry.resolve(request.capability, request.tenantId);
    
    if (!binding) {
      throw new Error(`[ResourceManager] No active bindings for capability: ${request.capability}`);
    }

    const provider = serviceRegistry.get(binding.providerId);
    if (provider && provider.status === 'healthy') {
      return { binding, provider };
    }

    throw new Error(`[ResourceManager] No healthy provider found for capability: ${request.capability}`);
  }
}
