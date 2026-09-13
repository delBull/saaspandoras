/**
 * 🔎 Hermes OS — Web Search Providers & Tool (F2)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/tools/web/web-search-provider.ts
 *
 * Implements decoupled web search provider interface.
 * Isolates API tokens and credentials from calling skills.
 */

import { SafeHttpClient } from '../../runtime/egress-guard';
import { WebSearchQuery, WebSearchResult, WebSearchResultItem } from './contracts';

export interface WebSearchProvider {
  readonly providerName: string;
  search(query: WebSearchQuery): Promise<WebSearchResult>;
}

/**
 * 🧪 Mock / Fallback Search Provider for Development & CI
 */
export class MockWebSearchProvider implements WebSearchProvider {
  readonly providerName = 'mock_search';

  async search(input: WebSearchQuery): Promise<WebSearchResult> {
    const q = input.query.toLowerCase();
    const mockItems: WebSearchResultItem[] = [
      {
        title: `Resultado Oficial: ${input.query} — Portal Pandoras`,
        url: `https://pandoras.finance/explore?q=${encodeURIComponent(input.query)}`,
        snippet: `Documentación soberana y métricas de mercado para "${input.query}". Análisis de activos tokenizados y RWA.`,
        engine: 'mock_search',
      },
      {
        title: `Guía Técnica: ${input.query}`,
        url: `https://docs.pandoras.finance/research/${encodeURIComponent(input.query)}`,
        snippet: `Análisis comparativo de viabilidad, citabilidad y datos estructurados sobre ${input.query}.`,
        engine: 'mock_search',
      },
      {
        title: `S'Narai Riviera Maya — Proyecto Tokenizado`,
        url: `https://snarai.com/dealroom`,
        snippet: `Desarrollo de lujo sustentable tokenizado en Quintana Roo. Certificados de participación inmobiliaria.`,
        engine: 'mock_search',
      },
    ];

    const limit = input.limit ?? 5;
    return {
      query: input.query,
      totalFound: mockItems.length,
      results: mockItems.slice(0, limit),
      provider: this.providerName,
    };
  }
}

/**
 * 🦁 Brave Search Provider
 * API: https://api.search.brave.com/res/v1/web/search
 */
export class BraveWebSearchProvider implements WebSearchProvider {
  readonly providerName = 'brave_search';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BRAVE_SEARCH_API_KEY || '';
  }

  async search(input: WebSearchQuery): Promise<WebSearchResult> {
    if (!this.apiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[BraveWebSearchProvider] BRAVE_SEARCH_API_KEY is not configured in production.');
      }
      // Degradación explícita a mock en entornos de dev/test
      return new MockWebSearchProvider().search(input);
    }

    const limit = input.limit ?? 5;
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', input.query);
    url.searchParams.set('count', String(Math.min(limit, 20)));
    if (input.country) {
      url.searchParams.set('country', input.country);
    }

    const response = await SafeHttpClient.fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.apiKey,
      },
      timeoutMs: 8000,
    });

    if (!response.ok) {
      throw new Error(`[BraveWebSearchProvider] Search request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const webResults = data?.web?.results || [];

    const results: WebSearchResultItem[] = webResults.map((item: any) => ({
      title: item.title || '',
      url: item.url || '',
      snippet: item.description || '',
      engine: 'brave',
    }));

    return {
      query: input.query,
      totalFound: results.length,
      results,
      provider: this.providerName,
    };
  }
}

/**
 * 🛠️ Primary WebSearchTool Orchestrator
 */
export class WebSearchTool {
  private static activeProvider: WebSearchProvider = new BraveWebSearchProvider();

  public static setProvider(provider: WebSearchProvider): void {
    this.activeProvider = provider;
  }

  public static getProvider(): WebSearchProvider {
    return this.activeProvider;
  }

  public static async execute(query: WebSearchQuery): Promise<WebSearchResult> {
    if (!query.query || typeof query.query !== 'string') {
      throw new Error('[WebSearchTool] query parameter is required.');
    }
    return this.activeProvider.search(query);
  }
}
