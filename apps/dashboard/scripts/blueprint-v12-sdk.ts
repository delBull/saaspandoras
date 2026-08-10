import { createPandorasRuntime } from '../src/lib/pandoras/core/sdk/create-runtime';
import { createPandorasApp } from '../src/lib/pandoras/core/sdk/create-app';
import { defineWorkflow } from '../src/lib/pandoras/core/sdk/define-workflow';
import { defineCapability } from '../src/lib/pandoras/core/sdk/define-capability';
import { defineAdapter } from '../src/lib/pandoras/core/sdk/define-adapter';
import { CapabilityAdapter } from '../src/lib/pandoras/core/capabilities/capability-runtime';
import { Artifact, Identity } from '../src/lib/pandoras/core/contracts';

// ============================================================================
// 1. Declarar el Adapter (Implementación técnica específica)
// ============================================================================
class OpenAIImageAdapter implements CapabilityAdapter<any, Artifact> {
  readonly adapterId = 'openai_dalle3_adapter';
  
  async execute(input: any): Promise<Artifact> {
    console.log(`[OpenAIImageAdapter] LLM Request: "${input.prompt}"...`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulamos latencia de red
    
    return {
      id: `art_img_${Date.now()}`,
      type: 'IMAGE',
      name: 'Cyber Pandora',
      url: 'https://mock.pandoras.io/image.png',
      metadata: { source: 'dall-e-3' },
      createdAt: new Date().toISOString()
    };
  }
}

// ============================================================================
// 2. Definir los "Packs" de la Aplicación de forma declarativa (Developer Experience)
// ============================================================================
const MediaWorkflowPack = defineWorkflow({
  id: 'media.generate_asset.v1',
  version: '1.0',
  initialState: 'REQUESTED',
  terminalStates: ['COMPLETED', 'FAILED'],
  stages: ['REQUESTED', 'GENERATING', 'COMPLETED', 'FAILED'],
  requiredCapabilities: ['generate.image'],
  inputType: 'AssetRequest',
  outputType: 'Artifact'
}, { tags: ['media'], owner: 'media_co' });

const ImageCapabilityPack = defineCapability({
  id: 'generate.image',
  name: 'Image Generation',
  version: '1.0',
  inputType: 'ImagePrompt',
  outputType: 'Artifact'
});

const ImageAdapterPack = defineAdapter('generate.image', new OpenAIImageAdapter());

// ============================================================================
// 3. Ensamblaje: SDK de Pandora's
// ============================================================================
async function runBlueprintV12SDK() {
  console.log("==================================================");
  console.log("🚀 Pandora's OS - Sprint 12: Developer Experience");
  console.log("==================================================\n");

  // 3.1. Inicializar el SO (Runtime vivo)
  const runtime = createPandorasRuntime();

  // 3.2. Cargar nuestra "App" (Media Co) en el SO
  createPandorasApp({
    runtime,
    packs: {
      workflows: [MediaWorkflowPack],
      capabilities: [ImageCapabilityPack],
      adapters: [ImageAdapterPack]
    }
  });

  // ============================================================================
  // 4. Ejecución (Simulando a Hermes)
  // ============================================================================
  console.log("\n💬 [Hermes] Solicitando nuevo workflow 'media.generate_asset.v1'...");
  const actor: Identity = { id: 'usr_hermes', type: 'SYSTEM' };
  const payload = { prompt: 'A futuristic cybernetic Pandora box, glowing blue.' };

  const instance = await runtime.startProcess('media.generate_asset.v1', payload, actor);
  
  console.log(`\n[ExecutionRuntime] Workflow iniciado. Estado: ${instance.currentStage}`);
  
  // (Simulación de la ejecución interna del CapabilityRuntime dentro de un StageExecutor)
  console.log(`\n⚙️ [Stage Executor] Ejecutando etapa GENERATING... llamando capacidad 'generate.image'...`);
  const artifact = (await runtime.capabilityRuntime.executeCapability('generate.image', { prompt: instance.payload.prompt })) as Artifact;
  
  console.log(`\n✅ [Stage Executor] Capacidad resuelta. Artifact creado: ${artifact.id} (${artifact.url})`);
  
  // Forzamos el completion para que Knowledge Engine extraiga el Asset
  await (runtime.director as any).runtime.journal.append({ // Acceso raw solo para este test (Journal)
    id: `evt_${Date.now()}`,
    instanceId: instance.id,
    workflowId: instance.workflowDefinitionId,
    type: 'EXECUTION_COMPLETED',
    timestamp: new Date().toISOString(),
    payload: { status: 'COMPLETED' },
    actor: { id: 'usr_system', type: 'SYSTEM' }
  });

  await new Promise(resolve => setTimeout(resolve, 300)); // Esperar async KnowledgeEngine

  console.log("\n🧠 VERIFICANDO APRENDIZAJE DEL KNOWLEDGE ENGINE...");
  console.log("Revisa los logs superiores: el [KnowledgeEngine] automáticamente detectó el evento EXECUTION_COMPLETED y generó un Asset de tipo [EXECUTION_PATTERN].");
  console.log("¡La Developer Experience es un éxito! 🚀");
}

runBlueprintV12SDK().catch(console.error);
