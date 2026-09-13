/**
 * 📦 Hermes OS — Web Intelligence Tools Public API (F2)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/tools/web/index.ts
 */

import { HermesToolExecutor } from '../../runtime/tool-executor';
import { WebFetchTool } from './web-fetch-tool';
import { WebExtractTool } from './web-extract-tool';
import { WebSearchTool } from './web-search-provider';
import { WebCrawlTool } from './web-crawl-tool';

export * from './contracts';
export * from './web-fetch-tool';
export * from './web-extract-tool';
export * from './web-search-provider';
export * from './web-crawl-tool';

/**
 * Registers all canonical Web Intelligence tools into HermesToolExecutor.
 */
export function registerWebTools(executor: HermesToolExecutor): void {
  executor.registerHandler('web.fetch', async (params) => {
    const url = (params as any)?.url || (params as any)?.targetUrl;
    return WebFetchTool.execute({ url });
  });

  executor.registerHandler('web.extract', async (params) => {
    const url = (params as any)?.url || (params as any)?.targetUrl;
    const html = (params as any)?.html;
    return WebExtractTool.execute({ url, html });
  });

  executor.registerHandler('web.search', async (params) => {
    const query = (params as any)?.query || (params as any)?.q;
    const limit = (params as any)?.limit || (params as any)?.count;
    return WebSearchTool.execute({ query, limit });
  });

  executor.registerHandler('web.crawl', async (params) => {
    const baseUrl = (params as any)?.baseUrl || (params as any)?.url;
    const maxPages = (params as any)?.maxPages;
    const maxDepth = (params as any)?.maxDepth;
    return WebCrawlTool.execute({ baseUrl, maxPages, maxDepth });
  });
}
