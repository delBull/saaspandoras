import { DefaultExecutionRuntime } from '../src/lib/pandoras/core/execution/default-execution-runtime';
import { DefaultExecutionJournal } from '../src/lib/pandoras/core/execution/default-execution-journal';
import { DefaultPolicyEngine } from '../src/lib/pandoras/core/execution/default-policy-engine';
import { WorkflowDefinition } from '../src/lib/pandoras/core/execution/workflow-definition';
import { ExecutionSnapshot } from '../src/lib/pandoras/core/execution/execution-snapshot';
import { Identity } from '../src/lib/pandoras/core/contracts';

async function runVerticalSlice() {
  console.log("==================================================");
  console.log("🌌 Pandora's Execution OS - Kernel Vertical Slice");
  console.log("==================================================\n");

  const journal = new DefaultExecutionJournal();
  const policyEngine = new DefaultPolicyEngine();
  const runtime = new DefaultExecutionRuntime(policyEngine, journal);

  // 1. Definir un Workflow declarativo
  const campaignWorkflow: WorkflowDefinition<any, string> = {
    id: 'campaign.snarai.v1',
    version: '1.0.0',
    initialState: 'CONTENT_GENERATION',
    terminalStates: ['DISTRIBUTED', 'CANCELLED'],
    stages: ['CONTENT_GENERATION', 'REVIEW', 'SCHEDULED', 'DISTRIBUTED', 'CANCELLED'],
    requiredCapabilities: ['content.fulfill', 'calendar.reserve', 'commercial.submitDecision'],
    inputType: 'CampaignPayload'
  };

  runtime.registerWorkflow(campaignWorkflow);

  const adminIdentity: Identity = { id: 'usr_marco', type: 'USER' };
  const payload = { targetAudience: 'Web3 Investors', objective: 'Presale' };

  console.log("🚀 STARTING EXECUTION...");
  const instance = await runtime.start('campaign.snarai.v1', payload, adminIdentity);
  
  console.log(`\n⏸️  INSTANCE PAUSED: Status is ${instance.status}, current stage is ${instance.currentStage}`);
  console.log(`Pending actions:`, instance.pendingActions.map(p => p.type));

  console.log("\n👤 SIMULATING HUMAN INTERACTION (Mission Control)...");
  await new Promise(resolve => setTimeout(resolve, 1000)); // sleep 1 sec

  // 2. Humano inyecta decisión
  await runtime.resume(instance.id, { type: 'APPROVED', actor: adminIdentity }, adminIdentity);

  console.log(`\n✅ EXECUTION FINISHED: Status is ${instance.status}, current stage is ${instance.currentStage}`);

  console.log("\n📸 GENERATING EXECUTION SNAPSHOT...");
  
  const history = await journal.getHistory(instance.id);
  const snapshot: ExecutionSnapshot = {
    instanceId: instance.id,
    workflowId: instance.workflowDefinitionId,
    title: 'S\'Narai Presale Campaign',
    status: instance.status,
    pendingActions: instance.pendingActions,
    currentStage: instance.currentStage,
    progressPercentage: 100,
    artifacts: instance.generatedArtifacts,
    recentEvents: history,
    timeline: {
      startedAt: instance.startedAt,
      completedAt: instance.completedAt
    }
  };

  console.log(JSON.stringify(snapshot, null, 2));
  
  console.log("\n📖 VERIFYING JOURNAL ENTRIES...");
  console.log(`Total events recorded: ${history.length}`);
  history.forEach(evt => {
    console.log(`  - [${evt.timestamp}] ${evt.type} by ${evt.actor.id}`);
  });
}

runVerticalSlice().catch(console.error);
