import { Capability } from './kernel-types';

export interface CapabilityBinding {
  capability: Capability;
  providerId: string;
  executionMode: 'sync' | 'async';
}

export interface TenantRuntimeConfigurationData {
  capabilities: CapabilityBinding[];
  policies: Record<string, any>;
  features: Record<string, any>;
  limits: Record<string, number>;
}

export interface CapabilityBindingRepository {
  getBindingsForTenant(tenantId: number): Promise<TenantRuntimeConfigurationData>;
}
