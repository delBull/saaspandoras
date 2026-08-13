import { NormalizedInboundMessage } from '../../channels/normalized-message';
import { MemorySnapshot, MemoryProvenance } from './conversation-context';

export interface MemoryEnginePort {
  retrieveContext(normalized: NormalizedInboundMessage): Promise<MemorySnapshot>;
  // In Phase 6.6.8 we will add:
  // commitContext(context: ConversationContext): Promise<void>;
}

export class MemoryEngine implements MemoryEnginePort {
  
  /**
   * Orchestrates the retrieval of Episodic (recent chat history) 
   * and Semantic (facts, user profile) memory for the given user/conversation.
   */
  async retrieveContext(normalized: NormalizedInboundMessage): Promise<MemorySnapshot> {
    
    // 1. Retrieve Episodic Memory (Recent Messages)
    const episodic = await this.retrieveEpisodic(normalized.conversation.conversationId);
    
    // 2. Retrieve Semantic Memory (User Profile / Facts)
    const semantic = await this.retrieveSemantic(normalized.actor.externalActorId);
    
    // 3. Retrieve Conversational Summary (if any)
    const summary = await this.retrieveSummary(normalized.conversation.conversationId);

    return {
      episodic,
      semantic,
      userProfile: semantic.reduce((acc, fact) => {
        // Mock semantic reduction into user profile
        const parts = fact.fact.split(':');
        if (parts.length === 2 && parts[0]) {
          acc[parts[0]] = parts[1];
        }
        return acc;
      }, {} as Record<string, any>),
      conversationalSummary: summary
    };
  }

  private async retrieveEpisodic(conversationId: string) {
    console.log(`[MemoryEngine] Retrieving episodic memory for conversation: ${conversationId}`);
    
    // TODO (Phase 6.6.x): Query `hermes_messages` or unified event store.
    // For now, we mock the last interactions to satisfy the architecture snapshot.
    return [
      { event: 'USER: Hola, me interesa el proyecto', timestamp: new Date(Date.now() - 60000).toISOString() },
      { event: 'ASSISTANT: ¡Hola! Claro, ¿buscas para inversión o para vivir?', timestamp: new Date(Date.now() - 30000).toISOString() }
    ];
  }

  private async retrieveSemantic(externalActorId: string) {
    console.log(`[MemoryEngine] Retrieving semantic memory for actor: ${externalActorId}`);
    
    // TODO: Query `semantic_facts` table.
    // Example provenance injection as per Cognitive Layering Spec
    return [
      { fact: 'intent:investment', provenance: 'SYSTEM_INFERRED' as MemoryProvenance },
      { fact: 'budget:unknown', provenance: 'SYSTEM_KNOWN' as MemoryProvenance }
    ];
  }

  private async retrieveSummary(conversationId: string) {
    // Optional rolling summary for long contexts
    return 'El usuario mostró interés inicial pero no ha dado su presupuesto.';
  }
}
