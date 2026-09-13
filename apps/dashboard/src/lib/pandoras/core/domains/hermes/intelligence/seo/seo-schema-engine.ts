/**
 * 🏛️ Hermes OS — Structured Data & Schema.org Engine (F4)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/seo/seo-schema-engine.ts
 */

import { WebExtractTool } from '../../tools/web/web-extract-tool';
import { SeoSchemaInput, SeoSchemaReport } from './contracts';

export class SeoSchemaEngine {
  public static async analyze(input: SeoSchemaInput): Promise<SeoSchemaReport> {
    const extracted = await WebExtractTool.execute({
      url: input.url,
      html: input.html,
    });

    const schemasFound: string[] = [];
    const validationErrors: string[] = [];
    let hasRealEstateSchema = false;
    let hasOrganizationSchema = false;
    let hasFaqSchema = false;

    for (const block of extracted.jsonLd) {
      if (typeof block !== 'object' || block === null) {
        validationErrors.push('Bloque JSON-LD no es un objeto válido.');
        continue;
      }

      const raw = block as Record<string, unknown>;
      const ctx = String(raw['@context'] || '');
      if (!ctx.includes('schema.org')) {
        validationErrors.push(`@context debe ser "https://schema.org", recibido: "${ctx}"`);
      }

      const type = String(raw['@type'] || '');
      if (!type) {
        validationErrors.push('Bloque JSON-LD carece de propiedad "@type".');
      } else {
        schemasFound.push(type);
        if (type === 'RealEstateListing' || type === 'SingleFamilyResidence' || type === 'Accommodation' || type === 'Place') {
          hasRealEstateSchema = true;
        }
        if (type === 'Organization' || type === 'Corporation') {
          hasOrganizationSchema = true;
        }
        if (type === 'FAQPage') {
          hasFaqSchema = true;
        }
      }
    }

    // Generar bloque Schema.org recomendado si faltan esquemas clave
    let recommendedJsonLd: Record<string, unknown> | undefined;
    if (!hasRealEstateSchema && !hasOrganizationSchema) {
      recommendedJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        'name': extracted.title || "Oportunidad de Inversión Inmobiliaria",
        'description': extracted.metaDescription || "Certificados de participación inmobiliaria tokenizada.",
        'url': extracted.url,
        'offers': {
          '@type': 'Offer',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock',
        },
      };
    }

    return {
      schemasFound,
      jsonLdBlocks: extracted.jsonLd,
      hasRealEstateSchema,
      hasOrganizationSchema,
      hasFaqSchema,
      validationErrors,
      recommendedJsonLd,
    };
  }
}
