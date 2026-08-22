import { EventSpine, ChannelMessageReceivedPayload, ChannelMessageSendPayload, PandorasEvent } from '../../../events/event-spine';
import { ConversationContextBuilder } from './conversation-context-builder';
import { PromptCompiler } from './prompt-compiler';
import { OllamaLLMProvider } from './llm-provider';
import { CognitiveResponseParser } from './cognitive-response-parser';

export class CognitiveRuntimeListener {
  private contextBuilder: ConversationContextBuilder;
  private llmProvider: any;

  constructor(llmProvider?: any) {
    this.contextBuilder = new ConversationContextBuilder();
    this.llmProvider = llmProvider || new OllamaLLMProvider();

    EventSpine.getInstance().subscribe<ChannelMessageReceivedPayload>(
      'CHANNEL_MESSAGE_RECEIVED',
      this.handleChannelMessage.bind(this)
    );
  }

  private async handleChannelMessage(event: PandorasEvent<ChannelMessageReceivedPayload>): Promise<void> {
    const normalized = event.payload.normalizedMessage;
    
    console.log(`[CognitiveRuntimeListener] Received message from ${normalized.channel.type} (Tenant: ${normalized.organizationId})`);
    
    // Phase 6.6.2: Context Hydration
    // We build the strict Layered snapshot before passing to the engine.
    const context = await this.contextBuilder.buildContext(normalized);
    console.log(`[CognitiveRuntimeListener] Context Hydrated for Actor: ${context.actor.externalId}`);
    
    // Phase 6.6.3: Compilation
    const compiledRequest = PromptCompiler.compile(context, normalized.message.content || '');
    console.log(`[CognitiveRuntimeListener] Prompt Compiled: ${compiledRequest.compilationId}`);

    // Phase 6.6.4: Execution
    const llmResponse = await this.llmProvider.execute(compiledRequest);

    // Phase 6.6.5: Output Parsing & Verification
    const decision = CognitiveResponseParser.parse(compiledRequest, llmResponse);
    console.log(`[CognitiveRuntimeListener] Decision parsed: Action=${decision.action} Confidence=${decision.confidenceScore}`);

    // Phase 6.6.6: Strategy Decision (Plan Point 5)
    EventSpine.getInstance().publish<any>({
      id: `evt_${crypto.randomUUID()}`,
      type: 'STRATEGY_DECISION_PROPOSED',
      timestamp: new Date().toISOString(),
      payload: {
        decision: decision,
        context: context
      }
    });
    console.log(`[CognitiveRuntimeListener] Published STRATEGY_DECISION_PROPOSED`);
  }
}

// Bootstrap listener so it's registered
export const cognitiveRuntimeListener = new CognitiveRuntimeListener();
