/**
 * 📦 Hermes OS — GEO Intelligence Public API (F5)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/geo/index.ts
 */

import { HermesToolExecutor } from '../../runtime/tool-executor';
import { GeoCitabilityEngine } from './geo-citability-engine';

export * from './contracts';
export * from './geo-citability-engine';

/**
 * Registers GEO tools into HermesToolExecutor.
 */
export function registerGeoTools(executor: HermesToolExecutor): void {
  executor.registerHandler('seo.geo', async (params) => {
    const url = (params as any)?.url || (params as any)?.targetUrl || 'https://pandoras.finance';
    const robotsTxtContent = (params as any)?.robotsTxtContent;
    const llmsTxtContent = (params as any)?.llmsTxtContent;
    const htmlContent = (params as any)?.htmlContent || (params as any)?.html;

    return GeoCitabilityEngine.analyze({
      url,
      robotsTxtContent,
      llmsTxtContent,
      htmlContent,
    });
  });

  executor.registerHandler('seo.llms_txt', async (params) => {
    const title = (params as any)?.title || "Proyecto Pandoras";
    const description = (params as any)?.description || "Plataforma de activos tokenizados";
    const url = (params as any)?.url || 'https://pandoras.finance';
    const factsCount = (params as any)?.factsCount || 5;

    return {
      llmsTxt: GeoCitabilityEngine.generateLlmsTxt({ title, description, url, factsCount }),
    };
  });
}
