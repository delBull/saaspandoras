import { NormalizedInboundMessage } from '../../channels/normalized-message';
import { KnowledgeSnapshot } from './conversation-context';

export interface KnowledgeEnginePort {
  retrieveContext(normalized: NormalizedInboundMessage): Promise<KnowledgeSnapshot>;
}

export class KnowledgeEngine implements KnowledgeEnginePort {
  
  /**
   * Orchestrates the retrieval of knowledge snippets (RAG) based on the
   * user's current message and active context.
   */
  async retrieveContext(normalized: NormalizedInboundMessage): Promise<KnowledgeSnapshot> {
    const query = normalized.message.content;
    const organizationId = normalized.organizationId;
    
    // 1. Perform Vector Search (RAG) on Knowledge Base
    const snippets = await this.searchKnowledgeBase(query, organizationId);
    
    return {
      retrievedSnippets: snippets
    };
  }

  private async searchKnowledgeBase(query: string, organizationId: string) {
    console.log(`[KnowledgeEngine] Searching knowledge base for org ${organizationId} with query: "${query}"`);
    
    // TODO (Phase 6.6.x): Query `knowledge_chunks` or unified vector store via pgvector.
    // For now, we mock a retrieval response to satisfy the architecture snapshot.
    
    // If the user says something related to "proyecto", "inversión", return a mock snippet.
    const lowerQuery = query.toLowerCase();
    const mockSnippets = [];

    if (organizationId === 'snarai') {
      if (lowerQuery.includes('proyecto') || lowerQuery.includes('narai') || lowerQuery.includes('cenote')) {
        mockSnippets.push({
          content: "S'Narai es un proyecto eco-residencial ubicado en Tulum. Cuenta con cenotes privados y amenidades de lujo enfocado en sostenibilidad.",
          sourceDocument: "brochure_tulum.pdf",
          relevanceScore: 0.95,
          scope: 'PROJECT' as const
        });
      }

      if (lowerQuery.includes('precio') || lowerQuery.includes('inversión')) {
        mockSnippets.push({
          content: "Los lotes en S'Narai empiezan desde $50,000 USD con planes de financiamiento hasta a 36 meses sin intereses.",
          sourceDocument: "pricing_q3.pdf",
          relevanceScore: 0.88,
          scope: 'PROJECT' as const
        });
      }
    } else {
      // Mocking for generic tenants or other specific tenants
      if (lowerQuery.includes('proyecto') || lowerQuery.includes('información')) {
        mockSnippets.push({
          content: `Este es un documento genérico para el tenant ${organizationId}. Describe los términos generales de servicio.`,
          sourceDocument: "company_overview.pdf",
          relevanceScore: 0.90,
          scope: 'ORGANIZATION' as const
        });
      }
    }

    // Default fallback if no keywords hit
    if (mockSnippets.length === 0) {
      mockSnippets.push({
        content: `Pandoras Growth OS provee asistencia para la organización ${organizationId}. Todos los pagos se procesan de forma segura.`,
        sourceDocument: "general_faq.md",
        relevanceScore: 0.60,
        scope: 'PLATFORM' as const
      });
    }

    return mockSnippets;
  }
}
