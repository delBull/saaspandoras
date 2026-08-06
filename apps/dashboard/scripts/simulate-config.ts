import { JsonBindingRepository } from '../src/lib/hermes/runtimes/json-binding-repository';
import { RuntimeCompiler } from '../src/lib/hermes/runtimes/runtime-compiler';
import { artifactStore } from '../src/lib/hermes/runtimes/artifact-store';
import { HermesKernel } from '../src/lib/hermes/runtimes/hermes-kernel';
import { KernelContext } from '../src/lib/hermes/runtimes/kernel-types';

async function runSimulation() {
  const tenantId = 2;

  console.log('=== PHASE 1: COMPILATION ===');
  const bindingRepo = new JsonBindingRepository();
  const compiler = new RuntimeCompiler(bindingRepo);

  // Mock artifact store for simulation
  const mockStore: any = {};
  artifactStore.saveArtifact = async (tId: number, type: string, v: string, c: string, data: any) => {
    mockStore[`${tId}_${type}`] = data;
    return 'mock-uri';
  };
  artifactStore.loadLatestArtifact = async (tId: number, type: string) => {
    return mockStore[`${tId}_${type}`] || null;
  };
  
  // 1. Compile configurations
  await compiler.compileAndSave(tenantId);

  // 2. Load compiled configuration from Artifact Store
  const configGraph = await artifactStore.loadLatestArtifact(tenantId, 'config');
  const meshGraph = await artifactStore.loadLatestArtifact(tenantId, 'mesh');

  console.log('\n=== PHASE 2: RUNTIME EXECUTION ===');
  const kernel = new HermesKernel();
  
  const context: KernelContext = {
    tenantId,
    sessionId: 'session_999',
    input: 'Quiero invertir pero no estoy logueado',
    artifacts: {
      configGraph, // Kernel consumes compiled artifacts, not the repo directly
      meshGraph
    },
    state: { isAuthenticated: false },
  };

  const experience = await kernel.processInput(context);

  console.log('\n=== FINAL EXPERIENCE ===');
  console.log(JSON.stringify(experience, null, 2));
}

runSimulation().catch(console.error);
