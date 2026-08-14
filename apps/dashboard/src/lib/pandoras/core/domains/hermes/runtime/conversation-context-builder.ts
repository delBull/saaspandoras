import { NormalizedInboundMessage } from '../../channels/normalized-message';
import { ConversationContext } from './conversation-context';
import { MemoryEngine } from './memory-engine';
import { KnowledgeEngine } from './knowledge-engine';
import { JourneyEngine } from './journey-engine';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

const FALLBACK_ORG_NAME = 'Pandoras';
const FALLBACK_BRAND_NAME = 'Pandoras';

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
    
    // 0. Resolve tenant identity from the DB (slug -> projects.title). Falls
    // back to a generic brand so the runtime stays tenant-agnostic and never
    // fails the pipeline when the project is unknown or DB is unavailable.
    await this.resolveOrganizationIdentity(normalized.organizationId);

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
    // Basic mock for 6.6.2. The org name is resolved lazily from the DB by
    // buildContext so no tenant identity is hardcoded.
    return {
      agentName: 'Hermes',
      organizationName: this.orgName,
      brand: {
        name: this.brandName,
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

  private async resolveOrganizationIdentity(organizationId: string) {
    this.orgName = FALLBACK_ORG_NAME;
    this.brandName = FALLBACK_BRAND_NAME;
    try {
      const project = await db.query.projects.findFirst({
        where: eq(projects.slug, organizationId),
        columns: { title: true }
      });
      if (project?.title) {
        this.orgName = project.title;
        this.brandName = project.title;
      }
    } catch (err) {
      // Never break the cognitive pipeline on DB unavailability (K12-A45 fail-safe).
      console.warn(`[ConversationContextBuilder] Fallback org identity for ${organizationId}:`, err);
    }
  }

  private orgName = FALLBACK_ORG_NAME;
  private brandName = FALLBACK_BRAND_NAME;

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
