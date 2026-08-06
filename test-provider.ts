import { BindingRegistry } from './apps/dashboard/src/lib/pandoras/core/registries/binding-registry';
import { ProviderRegistry } from './apps/dashboard/src/lib/pandoras/core/registries/provider-registry';
import { MarketingProvider } from './apps/dashboard/src/lib/pandoras/core/providers/marketing/marketing.provider';
import { ExecutionRequest } from './apps/dashboard/src/lib/pandoras/core/contracts';

async function test() {
  console.log("Registrando MarketingProvider...");
  const marketingProvider = new MarketingProvider();
  ProviderRegistry.register(marketingProvider);

  console.log("Registrando Binding para marketing.getStats...");
  BindingRegistry.register({
    capability: 'marketing.getStats',
    providerId: 'growth_marketing_provider_v1',
    priority: 100,
    enabled: true,
    version: '1.0.0'
  });

  console.log("Despachando capability marketing.getStats...");
  const provider = BindingRegistry.resolve('marketing.getStats');
  
  const request: ExecutionRequest = {
    capability: 'marketing.getStats',
    identity: {
      id: 'test-user',
      type: 'USER',
      tenantId: '17' // S'Narai
    },
    input: {}
  };

  try {
    const result = await provider.execute(request);
    console.log("Resultado de Ejecución:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Fallo la ejecución", error);
  }
}

test();
