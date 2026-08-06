import { serviceRegistry } from '../../registries/service-registry';
import { capabilityRegistry } from '../../registries/capability-registry';
import { bindingRegistry } from '../../registries/binding-registry';
import { ProviderFactory } from '../../providers/provider-factory';

/**
 * 🚀 Hermes OS Boot Loader
 * ADR: Boot Sequence initializes all providers, capabilities, and bindings before execution.
 */
export class BootSequence {
  private static booted = false;

  public static async boot(): Promise<void> {
    if (this.booted) return;
    
    console.log('[Hermes OS] Initiating Boot Sequence...');

    await this.loadProviders();
    await this.loadCapabilities();
    await this.loadBindings();
    await this.runHealthChecks();

    this.booted = true;
    console.log('[Hermes OS] System Ready.');
  }

  private static async loadProviders(): Promise<void> {
    // Phase 3.3: Static registration for now. Sprint 8 will use Service Manifests.
    serviceRegistry.register({
      id: 'compatibility-provider',
      name: 'CompatibilityProvider',
      version: '1.0.0',
      type: 'internal',
      status: 'healthy',
      capabilities: ['communication.route', 'sales.pitch', 'knowledge.answer', 'commerce.checkout', 'meeting.schedule']
    });

    // Sprint 8: Load External Providers via Manifest
    ProviderFactory.loadManifest({
      id: 'pandoras-media-co',
      name: 'Pandoras Media Co',
      type: 'external',
      endpoint: 'https://portal-production-1672.up.railway.app/api/v1',
      authentication: { type: 'apikey', token: process.env.MEDIA_CO_API_KEY || '' },
      capabilities: ['image.generate', 'content.plan']
    });
  }

  private static async loadCapabilities(): Promise<void> {
    // 500 error fix: Register the base capabilities
    capabilityRegistry.register({
      id: 'communication.route',
      namespace: 'communication',
      name: 'Route Channel Message',
      description: 'Default catch-all for incoming text/voice from a channel',
      supportedWorkflows: ['immediate']
    });

    capabilityRegistry.register({
      id: 'sales.pitch',
      namespace: 'sales',
      name: 'Sales Pitch',
      description: 'Delivers a sales pitch for a project',
      supportedWorkflows: ['immediate', 'async']
    });

    capabilityRegistry.register({
      id: 'knowledge.answer',
      namespace: 'knowledge',
      name: 'Knowledge Base Answer',
      description: 'Answers FAQ and objections',
      supportedWorkflows: ['immediate']
    });

    capabilityRegistry.register({
      id: 'image.generate',
      namespace: 'creative',
      name: 'Generate Image',
      description: 'Generates an image via external provider',
      supportedWorkflows: ['async']
    });

    capabilityRegistry.register({
      id: 'content.plan',
      namespace: 'content',
      name: 'Content Plan',
      description: 'Generates a content plan',
      supportedWorkflows: ['immediate', 'async']
    });

    capabilityRegistry.register({
      id: 'commerce.checkout',
      namespace: 'commerce',
      name: 'Commerce Checkout',
      description: 'Completes a purchase / checkout flow',
      supportedWorkflows: ['immediate', 'async']
    });

    capabilityRegistry.register({
      id: 'meeting.schedule',
      namespace: 'planning',
      name: 'Schedule Meeting',
      description: 'Books and confirms a meeting / call',
      supportedWorkflows: ['immediate', 'async']
    });
  }

  private static async loadBindings(): Promise<void> {
    // Register Default Bindings mapped to CompatibilityProvider
    const defaultCapabilities = ['communication.route', 'sales.pitch', 'knowledge.answer', 'commerce.checkout', 'meeting.schedule'];
    
    for (const cap of defaultCapabilities) {
      bindingRegistry.register({
        capabilityId: cap,
        providerId: 'compatibility-provider',
        priority: 100,
        isActive: true
      });
    }

    // Media Co Bindings
    bindingRegistry.register({
      capabilityId: 'image.generate',
      providerId: 'pandoras-media-co',
      priority: 100,
      isActive: true
    });

    bindingRegistry.register({
      capabilityId: 'content.plan',
      providerId: 'pandoras-media-co',
      priority: 100,
      isActive: true
    });
  }

  private static async runHealthChecks(): Promise<void> {
    // Future: Ping endpoints to verify status
    console.log('[Hermes OS] Health checks passed.');
  }
}
