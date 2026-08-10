import { ExecutionBootstrap } from '../src/lib/pandoras/bootstrap/execution-bootstrap';
import { HermesShell } from '../src/lib/pandoras/core/domains/hermes/hermes-shell';
import { createPandorasRuntime } from '../src/lib/pandoras/core/sdk/create-runtime';

async function runBlueprintV16Bootstrap() {
  console.log("==================================================");
  console.log("🚀 Pandora's OS - Sprint 16: Bootstrap Layer");
  console.log("==================================================\n");

  console.log("----- MUNDO DE LA APLICACIÓN (SaaS) -----");

  // 1. El Gateway recibe una petición HTTP desde NextJS
  const payload = {
    tenantId: "tenant_snarai_123",
    userId: "usr_marco_456",
    channel: "telegram",
    message: "Quiero lanzar S'Narai con 50k"
  };

  console.log(`[Gateway] Recibido mensaje de usuario en canal ${payload.channel}`);

  // 2. Usamos el Bootstrap Layer (que pertenece al SaaS) para hidratar la identidad
  // sin que Hermes o el OS se enteren de cómo lo hicimos.
  const bootstrap = new ExecutionBootstrap();
  const identitySnapshot = await bootstrap.hydrateIdentity(
    payload.tenantId,
    payload.userId,
    payload.channel
  );

  console.log("\n[Gateway] ✅ Snapshot generado externamente. Transfiriendo control a Hermes...\n");

  console.log("----- MUNDO DE PANDORA'S (Kernel) -----");

  // 3. Inicializamos el OS de forma estándar
  const runtime = createPandorasRuntime();

  // (Instalamos el workflow mockeado para que Hermes lo encuentre)
  const { defineWorkflow } = require('../src/lib/pandoras/core/sdk/define-workflow');
  const CommercialLaunchPack = defineWorkflow({
    id: 'commercial.product_launch.v1',
    version: '1.0',
    initialState: 'PROSPECT',
    terminalStates: ['CLOSED_WON', 'CLOSED_LOST'],
    stages: ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'CLOSED_WON', 'CLOSED_LOST'],
    requiredCapabilities: [],
    inputType: 'LaunchRequest',
    outputType: 'Any'
  });
  runtime.workflowRegistry.register(CommercialLaunchPack.definition, CommercialLaunchPack.metadata);

  // (Para el test simulamos los componentes internos de Hermes)
  const { DefaultConversationManager } = require('../src/lib/pandoras/core/domains/hermes/conversation-manager');
  const { MockIntentEngine } = require('../src/lib/pandoras/core/domains/hermes/intent-engine');
  const { SemanticWorkflowResolver } = require('../src/lib/pandoras/core/domains/hermes/workflow-resolver');
  const { DefaultPlanner } = require('../src/lib/pandoras/core/domains/hermes/planner');

  const hermes = new HermesShell(
    new DefaultConversationManager(),
    new MockIntentEngine(),
    new SemanticWorkflowResolver(runtime.workflowRegistry),
    new DefaultPlanner(),
    runtime
  );

  // 4. Hermes procesa el mensaje recibiendo el snapshot puro.
  const response = await hermes.handleMessage({
    identitySnapshot,
    text: payload.message
  });

  console.log(`\n[Resultado Final] Hermes responde:`);
  console.log(response);
}

runBlueprintV16Bootstrap().catch(console.error);
