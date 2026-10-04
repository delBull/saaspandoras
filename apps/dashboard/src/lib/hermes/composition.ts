import { 
  setExecutionOSPort, 
  setDiscordWebhookPort, 
  setMarketingDomainPort, 
  setProjectDomainPort, 
  ExecutionBridgeHandlers,
  ExecutionOS,
  ExecutionCapabilityRegistry,
  FeedbackLoop,
  CreateReferralCampaignCapability,
  SendTelegramNotificationCapability,
  CrmUpdateStageCapability
} from '@saasfly/hermes-core';
import { DiscordWebhookService } from '@/lib/integrations/discord/webhook';
import { MarketingDomainService } from '@/lib/domain/marketing-domain-service';
import { ProjectDomainService } from '@/lib/domain/project-domain-service';
import { registry as outboxRegistry } from '@/lib/outbox/registry';

// 1. Instanciar Execution OS
const capabilityRegistry = new ExecutionCapabilityRegistry();
const feedbackLoop = new FeedbackLoop();

capabilityRegistry.register(new CreateReferralCampaignCapability());
capabilityRegistry.register(new SendTelegramNotificationCapability());
capabilityRegistry.register(new CrmUpdateStageCapability());

export const executionOS = new ExecutionOS(capabilityRegistry, feedbackLoop);

// 2. Setear los puertos
setExecutionOSPort(executionOS as any);
setDiscordWebhookPort(DiscordWebhookService as any);
setMarketingDomainPort(MarketingDomainService as any);
setProjectDomainPort(ProjectDomainService as any);

// 3. Configurar outbox handlers
const executionBridgeHandlers = new ExecutionBridgeHandlers(executionOS);

outboxRegistry.register(
  'operational_intent', 
  'OPERATIONAL_INTENT_APPROVED', 
  async (event) => executionBridgeHandlers.handleOperationalIntentApproved(event)
);

console.log('[HermesComposition] Dependencies successfully injected into hermes-core.');
