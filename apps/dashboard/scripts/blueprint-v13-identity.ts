import { createPandorasRuntime } from '../src/lib/pandoras/core/sdk/create-runtime';
import { createPandorasApp } from '../src/lib/pandoras/core/sdk/create-app';
import { defineWorkflow } from '../src/lib/pandoras/core/sdk/define-workflow';
import { defineCapability } from '../src/lib/pandoras/core/sdk/define-capability';
import { defineAdapter } from '../src/lib/pandoras/core/sdk/define-adapter';
import { CapabilityAdapter } from '../src/lib/pandoras/core/capabilities/capability-runtime';
import { Artifact, ExecutionIdentitySnapshot } from '../src/lib/pandoras/core/contracts';
import { ExecutionContext } from '../src/lib/pandoras/core/execution/execution-context';
import { ExecutionIdentityAssembler } from '../src/lib/pandoras/core/identity/assembler';
import { 
  DefaultTenantResolver, 
  DefaultBrandResolver, 
  DefaultPolicyResolver, 
  DefaultUserResolver, 
  DefaultLocalizationResolver, 
  DefaultCapabilityContextResolver 
} from '../src/lib/pandoras/core/identity/resolvers';

// ============================================================================
// 1. Declarar el Adapter Sensible al Contexto (Identity-Aware)
// ============================================================================
class OpenAIImageAdapter implements CapabilityAdapter<any, Artifact> {
  readonly adapterId = 'openai_dalle3_adapter';
  
  async execute(input: any, context: ExecutionContext): Promise<Artifact> {
    // 1. Lee políticas del snapshot inmutable
    const allowedModels = context.identity.policy.allowedModels;
    const model = context.identity.capabilities['generate.image']?.model || 'dall-e-3';
    
    // 2. Lee branding del snapshot inmutable
    const brandVoice = context.identity.branding.voice;
    const promptStyle = context.identity.branding.promptStyle;
    
    console.log(`\n[OpenAIImageAdapter] Resolviendo ejecución para Tenant: ${context.identity.tenant.organization}`);
    console.log(`[OpenAIImageAdapter] Política: Presupuesto restante $${context.identity.policy.budgetUsd}`);
    console.log(`[OpenAIImageAdapter] Usando modelo '${model}' basado en el CapabilityContext.`);
    console.log(`[OpenAIImageAdapter] Aplicando estilo de marca: Voice='${brandVoice}', PromptStyle='${promptStyle}'`);
    console.log(`[OpenAIImageAdapter] LLM Request Final: "${input.prompt} (Style: ${promptStyle})"...`);
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulamos latencia de red
    
    return {
      id: `art_img_${Date.now()}`,
      type: 'IMAGE',
      name: 'Cyber Pandora',
      url: 'https://mock.pandoras.io/image.png',
      metadata: { source: model },
      createdAt: new Date().toISOString()
    };
  }
}

// ============================================================================
// 2. Definir los "Packs" de la Aplicación de forma declarativa
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
// 3. Ensamblaje: SDK y Execution Identity
// ============================================================================
async function runBlueprintV13Identity() {
  console.log("==================================================");
  console.log("🚀 Pandora's OS - Sprint 13: Execution Identity");
  console.log("==================================================\n");

  // 3.1. Inicializar el SO
  const runtime = createPandorasRuntime();

  // 3.2. Cargar nuestra "App"
  createPandorasApp({
    runtime,
    packs: {
      workflows: [MediaWorkflowPack],
      capabilities: [ImageCapabilityPack],
      adapters: [ImageAdapterPack]
    }
  });

  // 3.3. Preparar el Ensamblador de Identidades
  const identityAssembler = new ExecutionIdentityAssembler(
    new DefaultTenantResolver(),
    new DefaultBrandResolver(),
    new DefaultPolicyResolver(),
    new DefaultUserResolver(),
    new DefaultLocalizationResolver(),
    new DefaultCapabilityContextResolver()
  );

  // ============================================================================
  // 4. Ejecución
  // ============================================================================
  console.log("\n💬 [Hermes] Recibe un request y resuelve el Execution Identity...");
  
  // El Identity se ensambla y se CONGELA antes de iniciar la ejecución
  const identitySnapshot = await identityAssembler.assemble({
    tenantId: 'tenant_123',
    userId: 'usr_abc',
    sourceApp: 'hermes'
  });

  console.log(`[IdentityAssembler] Snapshot congelado para ${identitySnapshot.tenant.organization}`);

  const payload = { prompt: 'A futuristic cybernetic Pandora box, glowing blue.' };

  // Hermes arranca el motor pasándole un único objeto: el Snapshot.
  const instance = await runtime.startProcess('media.generate_asset.v1', payload, identitySnapshot);
  
  console.log(`\n[ExecutionRuntime] Workflow iniciado. Estado: ${instance.currentStage}`);
  
  // (Simulación de la ejecución interna del CapabilityRuntime dentro de un StageExecutor)
  console.log(`\n⚙️ [Stage Executor] Ejecutando etapa GENERATING... llamando capacidad 'generate.image'...`);
  
  // Creamos el Scoped Execution Context (esto lo haría el StageExecutor o Runtime)
  const scopedContext: ExecutionContext = {
    instanceId: instance.id,
    identity: instance.identityContext,
    journal: (runtime.director as any).runtime.journal,
    eventBus: (runtime.director as any).runtime.journal.eventBus,
    capabilityRuntime: runtime.capabilityRuntime
  };

  const artifact = (await runtime.capabilityRuntime.executeCapability('generate.image', { prompt: instance.payload.prompt }, scopedContext)) as Artifact;
  
  console.log(`\n✅ [Stage Executor] Capacidad resuelta. Artifact creado: ${artifact.id} (${artifact.url})`);
  
  console.log("\n¡El Execution Identity Snapshot fue un éxito! 🚀");
}

runBlueprintV13Identity().catch(console.error);
