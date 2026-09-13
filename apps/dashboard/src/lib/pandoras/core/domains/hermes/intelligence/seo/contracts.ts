/**
 * 🎯 Hermes OS — SEO Intelligence Contracts (F4)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/seo/contracts.ts
 */

export interface SeoIssue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  field: string;
}

export interface SeoAuditInput {
  url?: string;
  html?: string;
}

export interface SeoAuditReport {
  url: string;
  healthScore: number;
  title: string;
  metaDescription?: string;
  canonicalUrl?: string;
  metaRobots?: string;
  issues: SeoIssue[];
  recommendations: string[];
  metrics: {
    titleLength: number;
    descriptionLength: number;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    linksCount: number;
    jsonLdBlocksCount: number;
  };
}

export interface SeoContentInput {
  url?: string;
  html?: string;
  text?: string;
  targetKeywords?: string[];
}

export interface SeoContentReport {
  url?: string;
  wordCount: number;
  readabilityScore: number;
  readingEaseLevel: 'MUY_DIFICIL' | 'DIFICIL' | 'ESTANDAR' | 'FACIL' | 'MUY_FACIL';
  targetKeywordAnalysis: Array<{
    keyword: string;
    occurrences: number;
    densityPercent: number;
  }>;
  discoveredEntities: string[];
  contentGaps: string[];
  recommendations: string[];
}

export interface SeoSchemaInput {
  url?: string;
  html?: string;
}

export interface SeoSchemaReport {
  schemasFound: string[];
  jsonLdBlocks: unknown[];
  hasRealEstateSchema: boolean;
  hasOrganizationSchema: boolean;
  hasFaqSchema: boolean;
  validationErrors: string[];
  recommendedJsonLd?: Record<string, unknown>;
}

export interface SeoCompetitorInput {
  tenantUrl: string;
  competitorUrls: string[];
  targetTopics: string[];
}

export interface CompetitorComparisonItem {
  url: string;
  title: string;
  wordCount: number;
  headingsCount: number;
  hasSchema: boolean;
}

export interface SeoCompetitorReport {
  tenantUrl: string;
  tenantAnalysis: CompetitorComparisonItem;
  competitors: CompetitorComparisonItem[];
  captureOpportunities: string[];
  growthOsDirectives: string[];
}
