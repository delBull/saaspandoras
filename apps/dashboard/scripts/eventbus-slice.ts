import { DefaultExecutionRuntime } from '../src/lib/pandoras/core/execution/default-execution-runtime';
import { DefaultExecutionJournal } from '../src/lib/pandoras/core/execution/default-execution-journal';
import { DefaultPolicyEngine } from '../src/lib/pandoras/core/execution/default-policy-engine';
import { DefaultPlatformEventBus } from '../src/lib/pandoras/core/platform/events/default-event-bus';
import { EventSubscriber } from '../src/lib/pandoras/core/platform/events/event-subscriber';
import { WorkflowDefinition } from '../src/lib/pandoras/core/execution/workflow-definition';
import { ExecutionEvent } from '../src/lib/pandoras/core/execution/execution-journal';
import { EventReplayer } from '../src/lib/pandoras/core/execution/event-replayer';
import { Identity } from '../src/lib/pandoras/core/contracts';

// Dummy Analytics Engine (Subscriber)
class AnalyticsEngine implements EventSubscriber {
  subscriberId = 'analytics_engine_v1';
  subscribedEventTypes = ['EXECUTION_STARTED', 'EXECUTION_COMPLETED'];

  async handleEvent(event: ExecutionEvent): Promise<void> {
    console.log(`\n📊 [AnalyticsEngine] Received Event: ${event.type}`);
    console.log(`📊 [AnalyticsEngine] Updating dashboards for instance ${event.instanceId}... Done.\n`);
  }
}

// Dummy Knowledge Engine (Subscriber)
class KnowledgeEngine implements EventSubscriber {
  subscriberId = 'knowledge_engine_v1';
  subscribedEventTypes = ['DECISION_SUBMITTED'];

  async handleEvent(event: ExecutionEvent): Promise<void> {
    console.log(`\n🧠 [KnowledgeEngine] Learning from Decision:`, event.payload.decision.type);
    console.log(`🧠 [KnowledgeEngine] Storing patterns to improve future autonomous execution.\n`);
  }
}

async function runEventBusSlice() {
  console.log("==================================================");
  console.log("🚌 Pandora's Execution OS - Platform Event Bus Slice");
  console.log("==================================================\n");

  const eventBus = new DefaultPlatformEventBus();
  
  // Registrar Subscribers
  const analytics = new AnalyticsEngine();
  const knowledge = new KnowledgeEngine();
  eventBus.register(analytics);
  eventBus.register(knowledge);

  const journal = new DefaultExecutionJournal(eventBus);
  const policyEngine = new DefaultPolicyEngine();
  const runtime = new DefaultExecutionRuntime(policyEngine, journal);

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
  
  await new Promise(resolve => setTimeout(resolve, 500)); 

  console.log("\n👤 SIMULATING HUMAN INTERACTION (Mission Control)...");
  await runtime.resume(instance.id, { type: 'APPROVED', actor: adminIdentity }, adminIdentity);

  await new Promise(resolve => setTimeout(resolve, 500)); 

  console.log(`\n✅ EXECUTION FINISHED: Status is ${instance.status}, current stage is ${instance.currentStage}`);

  console.log("\n⏪ AUDIT & REPLAY (Time Travel)...");
  const history = await journal.getHistory(instance.id);
  
  const replayedInstance = EventReplayer.replay(campaignWorkflow, history);
  if (replayedInstance) {
    console.log(`Replayed Instance Status: ${replayedInstance.status}`);
    console.log(`Replayed Instance Stage: ${replayedInstance.currentStage}`);
    console.log(`Replayed Instance memory (last decision):`, replayedInstance.runtimeMemory['lastDecision']);
  }
}

runEventBusSlice().catch(console.error);
