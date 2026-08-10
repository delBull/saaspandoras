import { PackKnowledgeDefinition } from '../../core/contracts';

export const SNARAI_KNOWLEDGE: PackKnowledgeDefinition = {
  sources: [
    {
      type: 'document_repository',
      id: 'snarai-legal'
    },
    {
      type: 'vector_store',
      id: 'snarai-faq'
    }
  ]
};
