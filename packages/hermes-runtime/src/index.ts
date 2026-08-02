import { SDKDomainPack } from '@pandoras/hermes-sdk';
import { MemoryProvider } from './memory';
import { PolicyEngine } from './policy';
import { ToolRegistry } from './tools';
import { HermesEventBus } from './events';
import { ModelProvider } from './provider';

export interface HermesRuntimeConfig {
  pack: SDKDomainPack;
  memoryProvider?: MemoryProvider;
  policyEngine?: PolicyEngine;
  toolRegistry?: ToolRegistry;
  eventBus?: HermesEventBus;
  modelProvider?: ModelProvider;
}

export class HermesRuntime {
  public pack: SDKDomainPack;
  public policyEngine: PolicyEngine;
  public toolRegistry: ToolRegistry;
  public eventBus: HermesEventBus;
  public modelProvider?: ModelProvider;

  constructor(config: HermesRuntimeConfig) {
    this.pack = config.pack;
    this.policyEngine = config.policyEngine || new PolicyEngine();
    this.toolRegistry = config.toolRegistry || new ToolRegistry();
    this.eventBus = config.eventBus || new HermesEventBus();
    this.modelProvider = config.modelProvider;

    // Inject Domain Pack Policies with priority=50
    if (config.pack.policies) {
      const packPolicies = config.pack.policies.map((p: any) => ({
        id: p.id,
        source: 'DOMAIN_PACK' as const,
        ruleType: p.ruleType,
        pattern: p.pattern,
        description: p.description,
        priority: p.priority ?? 50
      }));
      this.policyEngine.addRules(packPolicies);
    }
  }
}

export * from './memory';
export * from './policy';
export * from './tools';
export * from './events';
export * from './provider';
