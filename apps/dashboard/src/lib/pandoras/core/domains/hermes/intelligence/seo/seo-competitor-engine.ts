/**
 * ⚔️ Hermes OS — Competitor Benchmark & SERP Gap Engine (F4)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/seo/seo-competitor-engine.ts
 */

import { WebExtractTool } from '../../tools/web/web-extract-tool';
import { 
  SeoCompetitorInput, 
  SeoCompetitorReport, 
  CompetitorComparisonItem 
} from './contracts';

export class SeoCompetitorEngine {
  public static async analyze(input: SeoCompetitorInput): Promise<SeoCompetitorReport> {
    if (!input.tenantUrl) {
      throw new Error('[SeoCompetitorEngine] tenantUrl is required.');
    }

    // 1. Analizar URL del Tenant
    const tenantExtracted = await WebExtractTool.execute({ url: input.tenantUrl });
    const tenantAnalysis: CompetitorComparisonItem = {
      url: input.tenantUrl,
      title: tenantExtracted.title,
      wordCount: tenantExtracted.text.split(/\s+/).filter(Boolean).length,
      headingsCount: tenantExtracted.headings.h1.length + tenantExtracted.headings.h2.length + tenantExtracted.headings.h3.length,
      hasSchema: tenantExtracted.jsonLd.length > 0,
    };

    // 2. Analizar URLs Competidoras
    const competitors: CompetitorComparisonItem[] = [];
    for (const compUrl of input.competitorUrls) {
      try {
        const compExtracted = await WebExtractTool.execute({ url: compUrl });
        competitors.push({
          url: compUrl,
          title: compExtracted.title,
          wordCount: compExtracted.text.split(/\s+/).filter(Boolean).length,
          headingsCount: compExtracted.headings.h1.length + compExtracted.headings.h2.length + compExtracted.headings.h3.length,
          hasSchema: compExtracted.jsonLd.length > 0,
        });
      } catch (err: any) {
        competitors.push({
          url: compUrl,
          title: `Error al acceder (${err.message})`,
          wordCount: 0,
          headingsCount: 0,
          hasSchema: false,
        });
      }
    }

    // 3. Generar Oportunidades y Directivas de Growth OS
    const captureOpportunities: string[] = [];
    const growthOsDirectives: string[] = [];

    for (const comp of competitors) {
      if (comp.wordCount > tenantAnalysis.wordCount) {
        captureOpportunities.push(`El competidor ${comp.url} supera a tu página en volumen de contenido (${comp.wordCount} vs ${tenantAnalysis.wordCount} palabras).`);
      }
      if (!comp.hasSchema && tenantAnalysis.hasSchema) {
        growthOsDirectives.push(`Ventaja competitiva detectada: El competidor ${comp.url} no usa Schema.org. Destacar entidad y enriquecer snippets en Google.`);
      } else if (comp.hasSchema && !tenantAnalysis.hasSchema) {
        captureOpportunities.push(`El competidor ${comp.url} cuenta con datos estructurados Schema.org y tú no. Es prioritario implementar JSON-LD.`);
      }
    }

    if (input.targetTopics.length > 0) {
      growthOsDirectives.push(`Crear landings temáticas dedicadas para los tópicos prioritarios: ${input.targetTopics.join(', ')}.`);
    }

    return {
      tenantUrl: input.tenantUrl,
      tenantAnalysis,
      competitors,
      captureOpportunities,
      growthOsDirectives,
    };
  }
}
