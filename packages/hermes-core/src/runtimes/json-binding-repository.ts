import { CapabilityBindingRepository, TenantRuntimeConfigurationData } from './binding-repository';

export class JsonBindingRepository implements CapabilityBindingRepository {
  async getBindingsForTenant(tenantId: number): Promise<TenantRuntimeConfigurationData> {
    // In a real system, this would read from a JSON file.
    // For now, we mock the content directly.
    return {
      capabilities: [
        { capability: 'security.authorize', providerId: 'SecurityProvider', executionMode: 'sync' },
        { capability: 'routing.navigate', providerId: 'NavigationProvider', executionMode: 'sync' },
        { capability: 'language.generate', providerId: 'OllamaProvider', executionMode: 'sync' },
      ],
      policies: {
        auth_required: true,
      },
      features: {
        referral_mode: 'enabled',
      },
      limits: {
        max_parallel_jobs: 5,
      }
    };
  }
}
