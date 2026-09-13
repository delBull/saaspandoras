/**
 * 📦 Hermes OS — SEO Intelligence Public API (F4)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/seo/index.ts
 */

import { HermesToolExecutor } from '../../runtime/tool-executor';
import { SeoAuditEngine } from './seo-audit-engine';
import { SeoContentEngine } from './seo-content-engine';
import { SeoSchemaEngine } from './seo-schema-engine';
import { SeoCompetitorEngine } from './seo-competitor-engine';

export * from './contracts';
export * from './seo-audit-engine';
export * from './seo-content-engine';
export * from './seo-schema-engine';
export * from './seo-competitor-engine';

/**
 * Registers all SEO Intelligence tools into HermesToolExecutor.
 */
export function registerSeoTools(executor: HermesToolExecutor): void {
  executor.registerHandler('seo.audit', async (params) => {
    const url = (params as any)?.url || (params as any)?.targetUrl;
    const html = (params as any)?.html;
    return SeoAuditEngine.analyze({ url, html });
  });

  executor.registerHandler('seo.content', async (params) => {
    const url = (params as any)?.url || (params as any)?.targetUrl;
    const text = (params as any)?.text;
    const html = (params as any)?.html;
    const targetKeywords = (params as any)?.targetKeywords || (params as any)?.keywords;
    return SeoContentEngine.analyze({ url, text, html, targetKeywords });
  });

  executor.registerHandler('seo.schema', async (params) => {
    const url = (params as any)?.url || (params as any)?.targetUrl;
    const html = (params as any)?.html;
    return SeoSchemaEngine.analyze({ url, html });
  });

  executor.registerHandler('seo.competitor', async (params) => {
    const tenantUrl = (params as any)?.tenantUrl || (params as any)?.url;
    const competitorUrls = (params as any)?.competitorUrls || [];
    const targetTopics = (params as any)?.targetTopics || [];
    return SeoCompetitorEngine.analyze({ tenantUrl, competitorUrls, targetTopics });
  });
}
