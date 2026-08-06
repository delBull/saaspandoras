import { HermesRuntime } from '../src/lib/hermes/runtimes/hermes-runtime';
import { artifactStore } from '../src/lib/hermes/runtimes/artifact-store';

async function runSimulation() {
  const orchestrator = new HermesRuntime();
  
  const mockRuntimeConfig: any = { status: 'installed' };
  const mockDiscoveryGraph: any = { tenantId: 2, graph: { entities: [] }, pages: [] };

  // Generate a mock CompiledContentManifest artifact
  const mockContent = {
    tenantId: 2,
    nodes: [
      { id: 'node_1', type: 'heading', content: 'Invertir en S\'Narai', topics: ['investment'] },
      { id: 'node_2', type: 'paragraph', content: 'Puedes invertir desde $1000 USDC.', topics: ['investment'] },
      { id: 'node_3', type: 'faq', content: '¿Es seguro?', topics: ['security'] },
    ],
    checksum: 'abcdef123',
    compiledAt: new Date(),
  };

  // Mock the loadLatestArtifact method to bypass DB connection during simulation
  artifactStore.loadLatestArtifact = async (tenantId: number, type: string) => {
    if (tenantId === 2 && type === 'content') {
      return mockContent;
    }
    return null;
  };

  console.log("=== SIMULATING INTENT: GENERAL ===");
  const res1 = await orchestrator.execute('session_123', 2, 'Hola, ¿cómo estás?', mockRuntimeConfig, mockDiscoveryGraph);
  console.log(JSON.stringify(res1, null, 2));

  console.log("\n=== SIMULATING INTENT: INVEST ===");
  const res2 = await orchestrator.execute('session_123', 2, 'Quiero invertir', mockRuntimeConfig, mockDiscoveryGraph);
  console.log(JSON.stringify(res2, null, 2));
}

runSimulation().catch(console.error);
