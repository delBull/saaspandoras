import { EventSpine, PandorasEvent, StrategyDecisionProposedPayload, ChannelMessageSendPayload } from '../../../events/event-spine';
import { StrategyDecision } from '../events/contracts';
import { IntentManager } from '../../governance/intent-manager';
import { PolicyEvaluator } from '../../governance/policy-evaluator';
import { MemoryOperationalIntentRepository } from '../../../../infrastructure/repositories/memory-operational-intent-repository';
import { CognitiveDecision } from './cognitive-response-parser';
import { ConversationContext } from './conversation-context';

export class StrategyGovernanceBridge {
  private intentManager: IntentManager;

  constructor(intentManager?: IntentManager) {
    this.intentManager = intentManager || new IntentManager(
      new MemoryOperationalIntentRepository(),
      new PolicyEvaluator()
    );

    EventSpine.getInstance().subscribe<StrategyDecisionProposedPayload>(
      'STRATEGY_DECISION_PROPOSED',
      this.handleStrategyDecisionProposed.bind(this)
    );
  }

  private async handleStrategyDecisionProposed(event: PandorasEvent<StrategyDecisionProposedPayload>): Promise<void> {
    const { decision, context } = event.payload as { decision: CognitiveDecision; context: ConversationContext };
    
    console.log(`[StrategyGovernanceBridge] Received decision proposal: Action=${decision.action}`);

    // 1. Map CognitiveDecision to StrategyDecision (WHY)
    const strategyDecision: StrategyDecision = {
      id: `strat_${crypto.randomUUID()}`,
      decisionType: 'propose_action',
      decision: `Execute cognitive decision: ${decision.action}`,
      reason: {
        summary: decision.thoughtProcess || 'Cognitive reasoning executed',
        factors: [
          { type: 'confidence', source: 'llm', value: decision.confidenceScore }
        ]
      },
      confidence: decision.confidenceScore,
      workflow: decision.action === 'SEND_MESSAGE' ? 'channel.message_send.v1' : 'system.noop.v1',
      metadata: decision.payload
    };

    // 2. Propose Intent to Governance (WHAT + AUTHORITY)
    const intent = await this.intentManager.proposeIntent(
      context.organization.organizationId,
      context.journey?.journeyId || 'mission_default',
      'hermes_core',
      '1.0.0',
      strategyDecision.id!,
      strategyDecision
    );

    console.log(`[StrategyGovernanceBridge] Intent proposed: ID=${intent.id}, Status=${intent.status}`);

    // 3. Execution Routing if approved by Governance (HOW)
    if (intent.status === 'approved' && decision.action === 'SEND_MESSAGE') {
      const textResponse = (decision.payload as any)?.text || 'Blank response';

      EventSpine.getInstance().publish<ChannelMessageSendPayload>({
        id: `evt_${crypto.randomUUID()}`,
        type: 'CHANNEL_MESSAGE_SEND',
        timestamp: new Date().toISOString(),
        payload: {
          normalizedMessage: {
            messageId: `out_${crypto.randomUUID()}`,
            channel: context.channel,
            actor: {
              identityId: context.actor.externalId,
              externalActorId: context.actor.externalId
            },
            organizationId: context.organization.organizationId,
            conversation: {
              conversationId: context.conversation.conversationId
            },
            message: {
              messageId: `msg_${crypto.randomUUID()}`,
              externalMessageId: `ext_${crypto.randomUUID()}`,
              content: textResponse
            },
            correlationId: `corr_${crypto.randomUUID()}`,
            idempotencyKey: `idempotent_${crypto.randomUUID()}`,
            receivedAt: new Date()
          },
          targetProvider: context.channel.type
        }
      });

      console.log(`[StrategyGovernanceBridge] Intent auto-approved by Governance. Outbound message dispatched to ${context.channel.type}`);
    } else if (intent.status === 'pending_approval') {
      console.log(`[StrategyGovernanceBridge] Intent requires human approval before execution.`);
    }
  }
}

// Instantiate singleton to subscribe to EventSpine
export const strategyGovernanceBridge = new StrategyGovernanceBridge();
