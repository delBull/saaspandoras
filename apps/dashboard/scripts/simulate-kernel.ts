import { HermesKernel } from '../src/lib/hermes/runtimes/hermes-kernel';
import { moduleLoader } from '../src/lib/hermes/runtimes/module-loader';
import { SecurityProvider } from '../src/lib/hermes/runtimes/security-provider';
import { NavigationProvider } from '../src/lib/hermes/runtimes/navigation-provider';
import { OllamaDecisionProvider } from '../src/lib/hermes/runtimes/ollama-provider';
import { KernelContext } from '../src/lib/hermes/runtimes/kernel-types';

async function runKernelSimulation() {
  console.log('=== BOOTING HERMES KERNEL ===');
  
  // 1. Load Modules
  moduleLoader.load(new SecurityProvider());
  moduleLoader.load(new NavigationProvider());
  moduleLoader.load(new OllamaDecisionProvider());

  const kernel = new HermesKernel();

  // 2. Simulate an Unauthenticated User Trying to Invest
  const context: KernelContext = {
    tenantId: 2,
    sessionId: 'session_456',
    input: 'Quiero invertir $5000',
    artifacts: {},
    state: { isAuthenticated: false },
  };

  console.log('\n=== PROCESSING INPUT: "Quiero invertir $5000" (Unauthenticated) ===');
  const experience = await kernel.processInput(context);

  console.log('\n=== FINAL RENDERED EXPERIENCE ===');
  console.log(JSON.stringify(experience, null, 2));
}

runKernelSimulation().catch(console.error);
