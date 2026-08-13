import { NormalizedInboundMessage } from '../../channels/normalized-message';
import { ConversationContext } from './conversation-context';
import { MemoryEngine } from './memory-engine';
import { KnowledgeEngine } from './knowledge-engine';
import { JourneyEngine } from './journey-engine';

export class ConversationContextBuilder {
  private memoryEngine: MemoryEngine;
  private knowledgeEngine: KnowledgeEngine;
  private journeyEngine: JourneyEngine;

  constructor() {
    this.memoryEngine = new MemoryEngine();
    this.knowledgeEngine = new KnowledgeEngine();
    this.journeyEngine = new JourneyEngine();
  }

  /**
   * Constructs the ConversationContext snapshot strictly adhering to the
   * Layering Model (Layer 0 -> Layer 4) defined in HERMES_COGNITIVE_CONTEXT_SPEC_v1.0.md
   */
  async buildContext(normalized: NormalizedInboundMessage): Promise<ConversationContext> {
    
    // 1. Resolve Identity, Soul, Policy (Layers 0 to 3)
    // In later phases (6.6.7, etc), this will hit the DB or Redis config store
    // based on normalized.organizationId and normalized.projectId.
    const identity = this.resolveIdentity(normalized);
    const soul = this.resolveSoul(normalized);
    const policy = this.resolvePolicy(normalized);

    // 2. Resolve dynamic state (Layers 3 & 4)
    // In Phase 6.6.3+ these will call their respective Engines
    const knowledge = await this.knowledgeEngine.retrieveContext(normalized);
    const memory = await this.memoryEngine.retrieveContext(normalized);
    const journey = await this.journeyEngine.retrieveContext(normalized);

    // 3. Assemble and return snapshot
    return {
      identity,
      soul,
      policy,
      knowledge,
      memory,
      journey,
      channel: {
        type: normalized.channel.type,
        bindingId: normalized.channel.bindingId,
      },
      actor: {
        externalId: normalized.actor.externalActorId,
      },
      organization: {
        organizationId: normalized.organizationId,
        projectId: undefined // Will be derived from tenant config
      },
      conversation: {
        conversationId: normalized.conversation.conversationId,
        // Minimal recent messages mock. Will be populated by Memory Engine in 6.6.3
        recentMessages: [
          { role: 'user', content: normalized.message.content, timestamp: normalized.receivedAt.toISOString() }
        ]
      }
    };
  }

  private resolveIdentity(normalized: NormalizedInboundMessage) {
    // Basic mock for 6.6.2
    return {
      agentName: 'Hermes',
      organizationName: normalized.organizationId === 'snarai' ? "S'Narai" : 'Pandoras Default',
      brand: {
        name: normalized.organizationId === 'snarai' ? "S'Narai" : 'Pandoras',
        tone: 'professional',
        language: 'es-MX'
      }
    };
  }

  private resolveSoul(normalized: NormalizedInboundMessage) {
    return {
      mission: ['Representar fielmente a la organización', 'Guiar al usuario inteligentemente'],
      personality: ['inteligente', 'cálido', 'respetuoso'],
      principles: ['No inventar información', 'Proteger privacidad'],
      communication: ['Respuestas concisas', 'Adaptarse al usuario'],
      escalationRules: ['Transferir a humano cuando solicite precio no listado']
    };
  }

  private resolvePolicy(normalized: NormalizedInboundMessage) {
    return {
      prohibitedActions: ['invent_financial_returns', 'expose_private_information'],
      requiredDisclosures: ['Soy un asistente virtual'],
      hardEscalationTriggers: {
        'legal_question': 'human',
        'investment_commitment': 'human'
      }
    };
  }
}
