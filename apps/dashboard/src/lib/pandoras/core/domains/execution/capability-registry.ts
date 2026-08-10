import { Capability } from './contracts/capability-contracts';

export class CapabilityRegistry {
  // Key format: `${capabilityId}:${version}`
  private capabilities = new Map<string, Capability<any, any>>();

  register(capability: Capability<any, any>) {
    const key = `${capability.id}:${capability.version}`;
    if (this.capabilities.has(key)) {
      console.warn(`[CapabilityRegistry] Overwriting capability: ${key}`);
    }
    this.capabilities.set(key, capability);
    console.log(`[CapabilityRegistry] Registered: ${key}`);
  }

  resolve(capabilityId: string, version: string): Capability<any, any> | undefined {
    const key = `${capabilityId}:${version}`;
    return this.capabilities.get(key);
  }
}
