import { CapabilityAdapter, CapabilityRegistry, CapabilityResolver, CapabilityRuntime } from '../src/lib/pandoras/core/capabilities/capability-runtime';
import { Artifact, Identity } from '../src/lib/pandoras/core/contracts';
import { ExecutionContext, DefaultExecutionContext } from '../src/lib/pandoras/core/execution/execution-context';
import { DefaultExecutionRuntime } from '../src/lib/pandoras/core/execution/default-execution-runtime';
import { DefaultExecutionJournal } from '../src/lib/pandoras/core/execution/default-execution-journal';
import { DefaultPolicyEngine } from '../src/lib/pandoras/core/execution/default-policy-engine';
import { DefaultPlatformEventBus } from '../src/lib/pandoras/core/platform/events/default-event-bus';
import { WorkflowRegistry } from '../src/lib/pandoras/core/execution/workflow-registry';
import { ExecutionDirector } from '../src/lib/pandoras/core/execution/execution-director';
import { WorkflowDefinition } from '../src/lib/pandoras/core/execution/workflow-definition';
import { KnowledgeEngine } from '../src/lib/pandoras/core/knowledge/knowledge-engine';
import { PatternExtractor } from '../src/lib/pandoras/core/knowledge/pattern-extractor';
import { AssetRepository } from '../src/lib/pandoras/core/knowledge/asset-repository';

// 1. Un Adapter Mock para generación de imágenes
class MockImageAdapter implements CapabilityAdapter<any, Artifact> {
  readonly adapterId = 'openai_dalle3_mock';
  
  async execute(input: any, context?: any): Promise<Artifact> {
    console.log(`[MockImageAdapter] Generando imagen con prompt: "${input.prompt}"...`);
    // Simulamos latencia
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: `art_img_${Date.now()}`,
      type: 'IMAGE',
      name: 'Generated Image',
      url: 'https://mock.pandoras.io/image.png',
      metadata: { source: 'dall-e-3', prompt: input.prompt },
      createdAt: new Date().toISOString()
    };
  }
}

async function runBlueprintV9Slice() {
  console.log("==================================================");
  console.log("🧊 Pandora's Execution OS - Blueprint v9 Slice");
  console.log("==================================================\n");

  // A. Configurar Capability Layer
  const capRegistry = new CapabilityRegistry();
  capRegistry.registerCapability({
    id: 'generate.image',
    name: 'Image Generation',
    version: '1.0',
    inputType: 'ImagePrompt',
    outputType: 'Artifact'
  });
  capRegistry.registerAdapter('generate.image', new MockImageAdapter());
  
  const capResolver = new CapabilityResolver(capRegistry);
  const capabilityRuntime = new CapabilityRuntime(capRegistry, capResolver);

  // B. Configurar Event Bus y Journal
  const eventBus = new DefaultPlatformEventBus();
  const journal = new DefaultExecutionJournal(eventBus);

  // C. Configurar Knowledge Engine
  const extractor = new PatternExtractor(journal);
  const assetRepo = new AssetRepository();
  const knowledge = new KnowledgeEngine(extractor, assetRepo);
  eventBus.register(knowledge);

  // D. Configurar ExecutionContext (Service Locator)
  const executionContext = new DefaultExecutionContext(journal, eventBus, capabilityRuntime);

  // E. Configurar Runtime y Director
  const policyEngine = new DefaultPolicyEngine();
  const runtime = new DefaultExecutionRuntime(policyEngine, journal);
  const workflowRegistry = new WorkflowRegistry();
  
  // F. Registrar un Workflow de prueba en el Registry
  const mediaWorkflow: WorkflowDefinition<any, string> = {
    id: 'media.generate_asset.v1',
    version: '1.0',
    initialState: 'REQUESTED',
    terminalStates: ['COMPLETED', 'FAILED'],
    stages: ['REQUESTED', 'GENERATING', 'COMPLETED', 'FAILED'],
    requiredCapabilities: ['generate.image'],
    inputType: 'AssetRequest',
    outputType: 'Artifact',
    retryPolicies: { 'GENERATING': { maxAttempts: 3, backoffMs: 1000 } }, // Metadata guardada para el futuro
  };
  workflowRegistry.register(mediaWorkflow, {
    status: 'ACTIVE',
    tags: ['media', 'ai'],
    owner: 'media_co',
    createdAt: new Date().toISOString()
  });

  const director = new ExecutionDirector(workflowRegistry, runtime);

  const actor: Identity = { id: 'usr_hermes', type: 'SYSTEM' };
  const payload = { prompt: 'A futuristic cybernetic Pandora box, glowing blue.' };

  console.log("\n🚀 [Hermes] Solicitando nuevo workflow de media al Director...");
  const instance = await director.startProcess('media.generate_asset.v1', payload, actor);
  
  console.log(`\n[ExecutionRuntime] Current Stage: ${instance.currentStage}`);
  
  // Simulamos que el Runtime (o un worker) avanza el estado y pide la capacidad
  // (En el futuro, ExecutionRuntime o el Stage Executor llamará al CapabilityRuntime internamente usando el ExecutionContext)
  console.log(`\n⚙️ [Stage Executor] Ejecutando etapa GENERATING, llamando al CapabilityRuntime via ExecutionContext...`);
  const artifact = await executionContext.capabilityRuntime.executeCapability('generate.image', { prompt: instance.payload.prompt });
  
  console.log(`\n✅ [Stage Executor] Capacidad resuelta. Artifact creado: ${artifact.id} (${artifact.url})`);
  
  // Forzamos el completion
  await journal.append({
    id: `evt_${Date.now()}`,
    instanceId: instance.id,
    workflowId: instance.workflowDefinitionId,
    type: 'EXECUTION_COMPLETED',
    timestamp: new Date().toISOString(),
    payload: { status: 'COMPLETED' },
    actor: { id: 'usr_system', type: 'SYSTEM' }
  });

  await new Promise(resolve => setTimeout(resolve, 300));

  console.log("\n🧠 VERIFICANDO APRENDIZAJE DEL KNOWLEDGE ENGINE...");
  const assets = await assetRepo.getAll();
  console.log(`Knowledge Assets generados: ${assets.length}`);
  assets.forEach(a => {
    console.log(` - [${a.type}] ${a.title}: ${a.description}`);
  });
}

runBlueprintV9Slice().catch(console.error);
