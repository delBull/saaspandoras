import { DefaultExecutionRuntime } from '../src/lib/pandoras/core/execution/default-execution-runtime';
import { DefaultExecutionJournal } from '../src/lib/pandoras/core/execution/default-execution-journal';
import { DefaultPolicyEngine } from '../src/lib/pandoras/core/execution/default-policy-engine';
import { DefaultPlatformEventBus } from '../src/lib/pandoras/core/platform/events/default-event-bus';
import { KnowledgeEngine } from '../src/lib/pandoras/core/knowledge/knowledge-engine';
import { PatternExtractor } from '../src/lib/pandoras/core/knowledge/pattern-extractor';
import { InsightRepository } from '../src/lib/pandoras/core/knowledge/insight-repository';
import { WorkflowDefinition } from '../src/lib/pandoras/core/execution/workflow-definition';
import { Identity } from '../src/lib/pandoras/core/contracts';

async function runKnowledgeSlice() {
  console.log("==================================================");
  console.log("🧠 Pandora's Execution OS - Knowledge Engine Slice");
  console.log("==================================================\n");

  const eventBus = new DefaultPlatformEventBus();
  const journal = new DefaultExecutionJournal(eventBus);
  
  // Instanciar Knowledge Engine y sus dependencias
  const extractor = new PatternExtractor(journal);
  const repository = new InsightRepository();
  const knowledge = new KnowledgeEngine(extractor, repository);
  
  // Conectar Knowledge Engine al Event Bus
  eventBus.register(knowledge);

  const policyEngine = new DefaultPolicyEngine();
  const runtime = new DefaultExecutionRuntime(policyEngine, journal);

  const campaignWorkflow: WorkflowDefinition<any, string> = {
    id: 'campaign.snarai.v1',
    initialState: 'CONTENT_GENERATION',
    terminalStates: ['DISTRIBUTED', 'CANCELLED'],
    stages: ['CONTENT_GENERATION', 'REVIEW', 'SCHEDULED', 'DISTRIBUTED', 'CANCELLED'],
    requiredCapabilities: ['content.fulfill'],
    inputType: 'CampaignPayload',
    version: '1.0'
  };

  runtime.registerWorkflow(campaignWorkflow);
  const adminIdentity: Identity = { id: 'usr_marco', type: 'USER' };

  console.log("🚀 INICIANDO EJECUCIÓN DEL WORKFLOW...");
  const instance = await runtime.start('campaign.snarai.v1', {}, adminIdentity);
  
  await new Promise(resolve => setTimeout(resolve, 300)); 

  console.log("👤 INYECTANDO DECISIÓN HUMANA...");
  await runtime.resume(instance.id, { type: 'APPROVED', actor: adminIdentity }, adminIdentity);

  // Esperar un momento para que el bus asíncrono procese el evento EXECUTION_COMPLETED
  await new Promise(resolve => setTimeout(resolve, 300)); 

  console.log("\n📖 LEYENDO LA MEMORIA A LARGO PLAZO (Insights)...");
  const insights = await repository.getAll();
  console.log(`Insights extraídos: ${insights.length}`);
  insights.forEach(ins => {
    console.log(` - [${ins.type}] Confianza: ${ins.confidenceScore}`);
    console.log(`   Resumen: ${ins.summary}`);
  });
}

runKnowledgeSlice().catch(console.error);
