import { NormalizedInboundMessage } from '../channels/normalized-message';
import { ConversationContext } from './conversation-context';
import { MemoryEngine } from './memory-engine';
import { KnowledgeEngine } from './knowledge-engine';
import { JourneyEngine } from './journey-engine';
import { db } from "@saasfly/db-core";
import { projects } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";

const FALLBACK_ORG_NAME = 'Pandoras';
const FALLBACK_BRAND_NAME = 'Pandoras';

export class ConversationContextBuilder {

  private memoryEngine?: MemoryEngine;
  private knowledgeEngine?: KnowledgeEngine;
  private journeyEngine?: JourneyEngine;

  constructor() {
    // Lazy initialization to prevent circular dependency resolution issues
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
    // Now fetched dynamically from the DB's identityPack and policyPack
    const identity = this.resolveIdentity();
    const soul = this.resolveSoul();
    const policy = this.resolvePolicy();

    // 2. Resolve dynamic state (Layers 3 & 4)
    // In Phase 6.6.3+ these will call their respective Engines
    if (!this.knowledgeEngine) this.knowledgeEngine = new KnowledgeEngine();
    if (!this.memoryEngine) this.memoryEngine = new MemoryEngine();
    if (!this.journeyEngine) this.journeyEngine = new JourneyEngine();

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

  private resolveIdentity() {
    const pack = this.identityPack || {};

    return {
      agentName: pack.agentName || 'Hermes',
      organizationName: this.orgName,
      brand: {
        name: this.brandName,
        tone: pack.voice || 'professional',
        language: pack.languagePolicy?.avoidAsDefault ? 'es-MX' : 'es-MX'
      }
    };
  }

  private resolveSoul() {
    const pack = this.identityPack;

    if (pack && pack.tone) {
      return {
        mission: pack.tone.dos?.slice(0, 3) || [],
        personality: [pack.voice, 'autónomo', 'patrimonial'],
        principles: pack.tone.donts?.slice(0, 3) || [],
        communication: pack.languagePolicy?.avoidAsDefault?.length 
          ? [`Evitar: ${pack.languagePolicy.avoidAsDefault.join(', ')}`]
          : ['Respuestas concisas', 'Adaptarse al usuario'],
        escalationRules: this.policyPack?.escalationPolicy 
          ? Object.entries(this.policyPack.escalationPolicy).map(([k, v]) => `${k}: ${v}`)
          : []
      };
    }

    return {
      mission: ['Representar fielmente a la organización', 'Guiar al usuario inteligentemente'],
      personality: ['inteligente', 'cálido', 'respetuoso'],
      principles: ['No inventar información', 'Proteger privacidad'],
      communication: ['Respuestas concisas', 'Adaptarse al usuario'],
      escalationRules: ['Transferir a humano cuando solicite precio no listado']
    };
  }

  private orgName = FALLBACK_ORG_NAME;
  private brandName = FALLBACK_BRAND_NAME;
  private identityPack: any = null;
  private policyPack: any = null;

  private async resolveOrganizationIdentity(organizationId: string) {
    this.orgName = FALLBACK_ORG_NAME;
    this.brandName = FALLBACK_BRAND_NAME;
    this.identityPack = null;
    this.policyPack = null;

    try {
      const project = await db.query.projects.findFirst({
        where: eq(projects.slug, organizationId),
        columns: { title: true, identityPack: true, policyPack: true }
      });
      if (project?.title) {
        this.orgName = project.title;
        this.brandName = project.title;
        this.identityPack = project.identityPack;
        this.policyPack = project.policyPack;
      } else {
        throw new Error(`Tenant context not found for slug: ${organizationId}`);
      }
    } catch (err) {
      console.error(`[ConversationContextBuilder] Tenant resolution FAIL CLOSED for ${organizationId}:`, err);
      throw new Error('UNAVAILABLE: Tenant resolution failed.');
    }
  }

  private resolvePolicy() {
    const policy = this.policyPack || {};
    
    let hardEscalation = {
      'legal_question': 'human',
      'investment_commitment': 'human'
    };
    
    if (policy.escalationPolicy) {
       hardEscalation = { ...hardEscalation, ...policy.escalationPolicy };
    }

    return {
      prohibitedActions: policy.claimsPolicy?.prohibited || ['invent_financial_returns', 'expose_private_information'],
      requiredDisclosures: policy.claimsPolicy?.requiredQualification || ['Soy un asistente virtual'],
      hardEscalationTriggers: hardEscalation
    };
  }
}
