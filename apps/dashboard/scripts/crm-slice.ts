import { DefaultExecutionRuntime } from '../src/lib/pandoras/core/execution/default-execution-runtime';
import { DefaultExecutionJournal } from '../src/lib/pandoras/core/execution/default-execution-journal';
import { DefaultPolicyEngine } from '../src/lib/pandoras/core/execution/default-policy-engine';
import { DefaultPlatformEventBus } from '../src/lib/pandoras/core/platform/events/default-event-bus';
import { KnowledgeEngine } from '../src/lib/pandoras/core/knowledge/knowledge-engine';
import { PatternExtractor } from '../src/lib/pandoras/core/knowledge/pattern-extractor';
import { InsightRepository } from '../src/lib/pandoras/core/knowledge/insight-repository';
import { SalesPipelineWorkflow } from '../src/lib/pandoras/core/crm/sales-workflow';
import { Opportunity, Lead } from '../src/lib/pandoras/core/crm/crm-models';
import { Identity } from '../src/lib/pandoras/core/contracts';

async function runCrmSlice() {
  console.log("==================================================");
  console.log("💼 Pandora's Execution OS - Commercial CRM Slice");
  console.log("==================================================\n");

  const eventBus = new DefaultPlatformEventBus();
  const journal = new DefaultExecutionJournal(eventBus);
  const policyEngine = new DefaultPolicyEngine();
  const runtime = new DefaultExecutionRuntime(policyEngine, journal);

  // Conocimiento escuchando eventos del CRM
  const extractor = new PatternExtractor(journal);
  const insightRepo = new InsightRepository();
  const knowledge = new KnowledgeEngine(extractor, insightRepo);
  eventBus.register(knowledge);

  // Registrar Workflow Comercial
  runtime.registerWorkflow(SalesPipelineWorkflow);

  const salesRep: Identity = { id: 'usr_sales_rep', type: 'USER' };

  const lead: Lead = {
    id: 'lead_99',
    name: 'S\'Narai Enterprise Partner',
    email: 'contact@snarai.io',
    status: 'QUALIFIED',
    createdAt: new Date().toISOString()
  };

  const opportunityPayload: Opportunity = {
    id: 'opp_101',
    leadId: lead.id,
    title: 'S\'Narai Whitelabel Licensing Deal',
    valueUsd: 50000,
    stage: 'PROSPECT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  console.log(`🚀 CREANDO OPORTUNIDAD DE VENTA ($${opportunityPayload.valueUsd} USD)...`);
  const instance = await runtime.start('sales.pipeline.v1', opportunityPayload, salesRep);

  console.log(`[CRM] Instancia iniciada: ID ${instance.id}`);
  console.log(`[CRM] Estado actual en el Kernel: ${instance.currentStage}`);

  await new Promise(resolve => setTimeout(resolve, 300));

  console.log("\n👤 SIMULANDO APROBACIÓN DE PROPUESTA COMERCIAL...");
  await runtime.resume(instance.id, { type: 'APPROVED', actor: salesRep }, salesRep);

  await new Promise(resolve => setTimeout(resolve, 300));

  console.log(`\n✅ WORKFLOW COMERCIAL FINALIZADO: Estado ${instance.status}, Stage ${instance.currentStage}`);

  console.log("\n🧠 VERIFICANDO APRENDIZAJE DEL KNOWLEDGE ENGINE EN CRM...");
  const insights = await insightRepo.getAll();
  console.log(`Insights acumulados: ${insights.length}`);
  insights.forEach(ins => {
    console.log(` - [${ins.type}] ${ins.summary}`);
  });
}

runCrmSlice().catch(console.error);
