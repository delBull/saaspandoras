import { describe, it, expect, beforeEach } from '@jest/globals';
import { EventSpine, ChannelMessageReceivedPayload, ChannelMessageSendPayload } from '../../../../events/event-spine';
import { CognitiveRuntimeListener } from '../cognitive-runtime-listener';
import { StrategyGovernanceBridge } from '../strategy-governance-bridge';
import { NormalizedInboundMessage } from '../../../channels/normalized-message';

describe('Governance Pipeline Integration (Cognitive -> Strategy -> Governance -> Execution)', () => {
  let runtimeListener: CognitiveRuntimeListener;
  let governanceBridge: StrategyGovernanceBridge;

  beforeEach(() => {
    // Reset event spine handlers for test clean state
    (EventSpine as any).instance = undefined;

    const mockLLM = {
      execute: async () => ({
        rawContent: JSON.stringify({
          thoughtProcess: 'El usuario pregunta por precios de S\'Narai',
          action: 'SEND_MESSAGE',
          confidenceScore: 0.95,
          payload: {
            text: 'El precio inicial de S\'Narai en la Fase 1 es de $50 USD por participación tokenizada.'
          }
        }),
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 }
      })
    };

    runtimeListener = new CognitiveRuntimeListener(mockLLM);
    governanceBridge = new StrategyGovernanceBridge();
  });

  it('P7 & Pipeline Test - End-to-End flow from Inbound Message to Governance Approved Outbound Message', async () => {
    let outboundPublished = false;
    let outboundPayload: any = null;

    // Listen for final outbound message
    EventSpine.getInstance().subscribe<ChannelMessageSendPayload>(
      'CHANNEL_MESSAGE_SEND',
      async (event) => {
        outboundPublished = true;
        outboundPayload = event.payload;
      }
    );

    const inboundMessage: NormalizedInboundMessage = {
      organizationId: 'org_snarai',
      channel: {
        type: 'whatsapp',
        bindingId: 'wb_123',
        externalConversationId: '5213221234567'
      },
      actor: {
        identityId: 'user_456',
        externalActorId: '5213221234567'
      },
      conversation: {
        conversationId: 'conv_789'
      },
      message: {
        messageId: 'msg_001',
        externalMessageId: 'ext_001',
        content: '¿Cuál es el precio del departamento en S\'Narai?'
      },
      correlationId: 'corr_001',
      idempotencyKey: 'idem_001',
      receivedAt: new Date()
    };

    // Publish inbound message
    await EventSpine.getInstance().publish<ChannelMessageReceivedPayload>({
      id: 'evt_inbound_1',
      type: 'CHANNEL_MESSAGE_RECEIVED',
      timestamp: new Date().toISOString(),
      payload: {
        normalizedMessage: inboundMessage
      }
    });

    // Verify outbound message was produced through the Governance bridge
    expect(outboundPublished).toBe(true);
    expect(outboundPayload).toBeDefined();
    expect(outboundPayload.targetProvider).toBe('whatsapp');
    expect(outboundPayload.normalizedMessage.organizationId).toBe('org_snarai');
  });
});
