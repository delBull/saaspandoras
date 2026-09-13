/**
 * 🌐 Hermes OS — Web Intelligence & Tool Contracts (F2)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/tools/web/contracts.ts
 */

export interface WebFetchInput {
  url: string;
  timeoutMs?: number;
  maxSizeBytes?: number;
}

export interface WebFetchResult {
  url: string;
  status: number;
  contentType: string;
  body: string;
  headers: Record<string, string>;
}

export interface WebExtractInput {
  url?: string;
  html?: string;
  mode?: 'markdown' | 'text' | 'html';
}

export interface WebExtractResult {
  url: string;
  title: string;
  metaDescription?: string;
  canonicalUrl?: string;
  metaRobots?: string;
  text: string;
  markdown: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  jsonLd: unknown[];
  links: string[];
}

export interface WebSearchQuery {
  query: string;
  limit?: number;
  country?: string;
}

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
  engine?: string;
}

export interface WebSearchResult {
  query: string;
  totalFound: number;
  results: WebSearchResultItem[];
  provider: string;
}

export interface WebCrawlInput {
  baseUrl: string;
  maxPages?: number;
  maxDepth?: number;
}

export interface WebCrawlPageSummary {
  url: string;
  title: string;
  depth: number;
  linksFound: number;
}

export interface WebCrawlResult {
  baseUrl: string;
  pagesCrawled: number;
  pages: WebCrawlPageSummary[];
  brokenLinksFound: string[];
}
