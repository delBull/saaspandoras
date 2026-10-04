import { ConversationContext } from './conversation-context';
import { assertContextScope } from './scope-validator';

export interface CompiledPromptBlock {
  blockId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelPolicy {
  temperature: number;
  maxTokens: number;
  model: string;
}

export interface CompiledCognitiveRequest {
  compilationId: string;
  organizationId: string;
  conversationId: string;
  actorId: string;

  scope: {
    global: string;
    tenant: string;
    project?: string;
    agent?: string;
    conversation: string;
  };

  systemMessages: CompiledPromptBlock[];
  knowledgeMessages: CompiledPromptBlock[];
  journeyMessages: CompiledPromptBlock[];
  memoryMessages: CompiledPromptBlock[];

  messages: LLMMessage[];
  modelPolicy: ModelPolicy;
  compilerVersion: string;
  createdAt: string;
}

/**
 * The core engine that compiles the 5-dimensional ConversationContext 
 * into an immutable LLM request, strictly ordering instructions vs knowledge vs memory.
 */
export class PromptCompiler {
  private static readonly VERSION = '1.0.0';

  public static compile(context: ConversationContext, userMessage: string): CompiledCognitiveRequest {
    // 1. Mandatory Scope Validation (Fail Closed)
    assertContextScope(context);

    // 2. Build Blocks
    const systemMessages = this.buildSystemBlocks(context);
    const knowledgeMessages = this.buildKnowledgeBlocks(context);
    const journeyMessages = this.buildJourneyBlocks(context);
    const memoryMessages = this.buildMemoryBlocks(context);

    // 3. Assemble final messages array in exact order
    const messages: LLMMessage[] = [];
    
    // Add all structured context as a massive system prompt
    // Instructions -> Facts -> State -> History
    const allContextBlocks = [
      ...systemMessages,
      ...knowledgeMessages,
      ...journeyMessages,
      ...memoryMessages
    ];

    const systemPromptContent = allContextBlocks.map(b => b.content).join('\n\n');
    messages.push({ role: 'system', content: systemPromptContent });

    // Add conversation history
    for (const msg of context.conversation.recentMessages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    // 4. Return verifable artifact
    return {
      compilationId: `cmp_${crypto.randomUUID()}`,
      organizationId: context.organization.organizationId,
      conversationId: context.conversation.conversationId,
      actorId: context.actor.externalId,
      scope: {
        global: 'pandoras-platform',
        tenant: context.organization.organizationId,
        project: context.organization.projectId,
        agent: context.identity.agentName,
        conversation: context.conversation.conversationId
      },
      systemMessages,
      knowledgeMessages,
      journeyMessages,
      memoryMessages,
      messages,
      modelPolicy: {
        temperature: 0.1, // Low temp for more deterministic business operations
        maxTokens: 1024,
        model: process.env.OLLAMA_MODEL || 'llama3' // Model specified in Vercel / env
      },
      compilerVersion: this.VERSION,
      createdAt: new Date().toISOString()
    };
  }

  private static buildSystemBlocks(context: ConversationContext): CompiledPromptBlock[] {
    return [
      {
        blockId: 'HERMES_SYSTEM_IDENTITY',
        role: 'system',
        content: `[HERMES SYSTEM IDENTITY]\nYou are ${context.identity.agentName}, representing ${context.identity.organizationName}. ${context.identity.brand ? `Your tone is ${context.identity.brand.tone} and language is ${context.identity.brand.language}.` : ''}`
      },
      {
        blockId: 'GLOBAL_OPERATING_RULES',
        role: 'system',
        content: `[GLOBAL OPERATING RULES]\nYou are an AI orchestrator operating within the Pandoras Growth OS. You must respond in valid JSON format ONLY when taking action. Always separate instructions from facts.`
      },
      {
        blockId: 'TENANT_SOUL',
        role: 'system',
        content: `[TENANT SOUL]\nMission: ${context.soul.mission.join(', ')}\nPersonality: ${context.soul.personality.join(', ')}\nPrinciples: ${context.soul.principles.join(', ')}\nCommunication: ${context.soul.communication.join(', ')}`
      },
      {
        blockId: 'GOVERNANCE_POLICY',
        role: 'system',
        content: `[GOVERNANCE / POLICY]\nProhibited Actions: ${context.policy.prohibitedActions.join(', ')}\nRequired Disclosures: ${context.policy.requiredDisclosures.join(', ')}\nEscalation Triggers: ${JSON.stringify(context.policy.hardEscalationTriggers)}`
      }
    ];
  }

  private static buildKnowledgeBlocks(context: ConversationContext): CompiledPromptBlock[] {
    if (context.knowledge.retrievedSnippets.length === 0) return [];
    
    const facts = context.knowledge.retrievedSnippets.map(s => `- ${s.content}`).join('\n');
    return [{
      blockId: 'RETRIEVED_KNOWLEDGE',
      role: 'system',
      content: `[RETRIEVED KNOWLEDGE]\n${facts}`
    }];
  }

  private static buildJourneyBlocks(context: ConversationContext): CompiledPromptBlock[] {
    return [{
      blockId: 'JOURNEY_STATE',
      role: 'system',
      content: `[JOURNEY STATE]\nCurrent Journey ID: ${context.journey.journeyId}\nCurrent Stage: ${context.journey.currentStage}\nObjectives: ${context.journey.objectives.join(', ')}\nAllowed Transitions: ${context.journey.allowedTransitions.join(', ')}`
    }];
  }

  private static buildMemoryBlocks(context: ConversationContext): CompiledPromptBlock[] {
    let memoryStr = '[RELEVANT MEMORY]\n';
    if (context.memory.userProfile) {
      memoryStr += `User Profile: ${JSON.stringify(context.memory.userProfile)}\n`;
    }
    if (context.memory.semantic.length > 0) {
      memoryStr += `Facts about User: ${context.memory.semantic.map(f => f.fact).join(', ')}\n`;
    }
    if (context.memory.conversationalSummary) {
      memoryStr += `Previous Conversation Summary: ${context.memory.conversationalSummary}`;
    }

    return [{
      blockId: 'RELEVANT_MEMORY',
      role: 'system',
      content: memoryStr
    }];
  }
}
