import { createPandorasRuntime } from '../src/lib/pandoras/core/sdk/create-runtime';
import { createPandorasApp } from '../src/lib/pandoras/core/sdk/create-app';
import { defineWorkflow } from '../src/lib/pandoras/core/sdk/define-workflow';
import { defineCapability } from '../src/lib/pandoras/core/sdk/define-capability';
import { defineAdapter } from '../src/lib/pandoras/core/sdk/define-adapter';
import { CapabilityAdapter } from '../src/lib/pandoras/core/capabilities/capability-runtime';
import { Artifact } from '../src/lib/pandoras/core/contracts';
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

// Componentes de Hermes Shell
import { HermesShell } from '../src/lib/pandoras/core/domains/hermes/hermes-shell';
import { DefaultConversationManager } from '../src/lib/pandoras/core/domains/hermes/conversation-manager';
import { MockIntentEngine } from '../src/lib/pandoras/core/domains/hermes/intent-engine';
import { SemanticWorkflowResolver } from '../src/lib/pandoras/core/domains/hermes/workflow-resolver';
import { DefaultPlanner } from '../src/lib/pandoras/core/domains/hermes/planner';

// ============================================================================
// 1. App Mocks
// ============================================================================
class OpenAIImageAdapter implements CapabilityAdapter<any, Artifact> {
  readonly adapterId = 'openai_dalle3_adapter';
  
  async execute(input: any, context: ExecutionContext): Promise<Artifact> {
    console.log(`[Adapter] Simulando request LLM...`);
    return {
      id: `art_img_${Date.now()}`,
      type: 'IMAGE',
      name: 'Cyber Pandora',
      url: 'https://mock.pandoras.io/image.png',
      createdAt: new Date().toISOString()
    };
  }
}

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

const CommercialLaunchPack = defineWorkflow({
  id: 'commercial.product_launch.v1',
  version: '1.0',
  initialState: 'PROSPECT',
  terminalStates: ['CLOSED_WON', 'CLOSED_LOST'],
  stages: ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'CLOSED_WON', 'CLOSED_LOST'],
  requiredCapabilities: [],
  inputType: 'LaunchRequest',
  outputType: 'Any'
}, { tags: ['sales'], owner: 'commercial' });

const ImageCapabilityPack = defineCapability({
  id: 'generate.image',
  name: 'Image Generation',
  version: '1.0',
  inputType: 'ImagePrompt',
  outputType: 'Artifact'
});
const ImageAdapterPack = defineAdapter('generate.image', new OpenAIImageAdapter());


// ============================================================================
// 2. Ejecución Completa
// ============================================================================
async function runBlueprintV14Hermes() {
  console.log("==================================================");
  console.log("🚀 Pandora's OS - Sprint 14: Hermes Shell");
  console.log("==================================================\n");

  // 1. Init OS
  const runtime = createPandorasRuntime();
  createPandorasApp({
    runtime,
    packs: {
      workflows: [MediaWorkflowPack, CommercialLaunchPack],
      capabilities: [ImageCapabilityPack],
      adapters: [ImageAdapterPack]
    }
  });

  // 2. Init Hermes Shell (El Intérprete)
  const identityAssembler = new ExecutionIdentityAssembler(
    new DefaultTenantResolver(),
    new DefaultBrandResolver(),
    new DefaultPolicyResolver(),
    new DefaultUserResolver(),
    new DefaultLocalizationResolver(),
    new DefaultCapabilityContextResolver()
  );

  const hermes = new HermesShell(
    new DefaultConversationManager(),
    new MockIntentEngine(),
    new SemanticWorkflowResolver(runtime.workflowRegistry),
    new DefaultPlanner(),
    identityAssembler,
    runtime
  );

  // ============================================================================
  // 3. Simulación de Interacción (ej. desde el Webhook de Telegram)
  // ============================================================================
  
  // El Gateway de Telegram solo llama a .handleMessage() y no sabe nada del SO interno.
  const response = await hermes.handleMessage({
    channelId: 'telegram_chat_123',
    userId: 'usr_abc',
    tenantId: 'tenant_123',
    text: "Quiero lanzar el producto S'Narai con un presupuesto de 50 mil"
  });

  console.log("\n[Gateway] Respuesta de Hermes para el usuario:");
  console.log(JSON.stringify(response, null, 2));

  console.log("\n¡Hermes Shell v1 Pipeline completado con éxito! 🚀");
}

runBlueprintV14Hermes().catch(console.error);
