import { CapabilityRegistry } from '../core/domains/execution/capability-registry';
import { ExecutionOS } from '../core/domains/execution/execution-os';
import { FeedbackLoop } from '../core/domains/execution/feedback-loop';
import { CreateReferralCampaignCapability } from '../core/domains/execution/capabilities/create-referral-campaign';
import { SendTelegramNotificationCapability } from '../core/domains/execution/capabilities/send-telegram-notification';
import { ExecutionBridgeHandlers } from '../core/domains/execution/outbox-handlers';
import { registry as outboxRegistry } from '~/lib/outbox/registry';

// 1. Instanciar dependencias compartidas
const capabilityRegistry = new CapabilityRegistry();
const feedbackLoop = new FeedbackLoop();

// 2. Registrar capabilities
capabilityRegistry.register(new CreateReferralCampaignCapability());
capabilityRegistry.register(new SendTelegramNotificationCapability());

// 3. Instanciar el Execution OS
export const executionOS = new ExecutionOS(capabilityRegistry, feedbackLoop);

// 4. Instanciar Outbox Handlers (Execution Bridge)
const executionBridgeHandlers = new ExecutionBridgeHandlers(executionOS);

// 5. Registrar el puente con el Outbox global
// Utilizamos el Aggregate "operational_intent" y el tipo de evento "OPERATIONAL_INTENT_APPROVED"
outboxRegistry.register(
  'operational_intent', 
  'OPERATIONAL_INTENT_APPROVED', 
  async (event) => executionBridgeHandlers.handleOperationalIntentApproved(event)
);

console.log('[ExecutionComposition] Successfully wired Execution OS and registered outbox handlers.');
