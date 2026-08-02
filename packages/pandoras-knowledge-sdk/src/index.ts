/**
 * 📚 PANDORAS KNOWLEDGE SDK — Business Contract & Repository Standard
 * Desacopla el conocimiento del negocio de la plataforma Pandora's.
 */

export interface CompanyProfile {
  name: string;
  tagline: string;
  description: string;
  foundedYear?: number;
  location?: string;
  brandVoice: string;
}

export interface ProductCatalogItem {
  id: string;
  title: string;
  category: string;
  description: string;
  priceUsd?: number;
  availableUnits?: number;
  detailsUrl?: string;
}

export interface ObjectionHandler {
  triggerKeywords: string[];
  category: 'legal' | 'financial' | 'security' | 'timing' | 'product';
  officialResponse: string;
  suggestedResourceId?: string;
}

export interface KnowledgeRepository {
  tenantId: string;
  companyProfile: CompanyProfile;
  products: ProductCatalogItem[];
  faqs: Array<{ question: string; answer: string; category?: string }>;
  objections: ObjectionHandler[];
  policies: Array<{ id: string; description: string; ruleType: 'ALLOW' | 'DENY' }>;
  resources: Array<{ id: string; name: string; type: string; url: string }>;
}

export function defineKnowledge(repo: KnowledgeRepository): KnowledgeRepository {
  return repo;
}
