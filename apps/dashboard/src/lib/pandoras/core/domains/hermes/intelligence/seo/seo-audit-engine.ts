/**
 * 🛠️ Hermes OS — Technical & On-Page SEO Engine (F4)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/seo/seo-audit-engine.ts
 */

import { WebExtractTool } from '../../tools/web/web-extract-tool';
import { SeoAuditInput, SeoAuditReport, SeoIssue } from './contracts';

export class SeoAuditEngine {
  public static async analyze(input: SeoAuditInput): Promise<SeoAuditReport> {
    const extracted = await WebExtractTool.execute({
      url: input.url,
      html: input.html,
    });

    const issues: SeoIssue[] = [];
    const recommendations: string[] = [];
    let penalties = 0;

    // 1. Auditoría de Title Tag
    const titleLen = extracted.title.length;
    if (titleLen === 0) {
      issues.push({
        severity: 'CRITICAL',
        code: 'MISSING_TITLE',
        message: 'La página no cuenta con etiqueta <title>. Es invisible para motores de búsqueda.',
        field: 'title',
      });
      recommendations.push('Añadir una etiqueta <title> descriptiva de 45 a 65 caracteres.');
      penalties += 30;
    } else if (titleLen < 30) {
      issues.push({
        severity: 'WARNING',
        code: 'SHORT_TITLE',
        message: `El título es demasiado corto (${titleLen} caracteres). Pierde potencial semántico.`,
        field: 'title',
      });
      recommendations.push('Expandir el título incorporando la propuesta de valor y ubicación del activo.');
      penalties += 10;
    } else if (titleLen > 70) {
      issues.push({
        severity: 'WARNING',
        code: 'LONG_TITLE',
        message: `El título es demasiado largo (${titleLen} caracteres) y será truncado en los SERP.`,
        field: 'title',
      });
      recommendations.push('Reducir el título a un máximo de 65 caracteres para evitar truncamiento.');
      penalties += 10;
    }

    // 2. Auditoría de Meta Description
    const descLen = extracted.metaDescription ? extracted.metaDescription.length : 0;
    if (descLen === 0) {
      issues.push({
        severity: 'WARNING',
        code: 'MISSING_META_DESCRIPTION',
        message: 'Falta la meta descripción. Los motores generarán un extracto automático impredecible.',
        field: 'metaDescription',
      });
      recommendations.push('Redactar una meta description persuasiva de entre 120 y 160 caracteres.');
      penalties += 15;
    } else if (descLen < 70 || descLen > 165) {
      issues.push({
        severity: 'INFO',
        code: 'SUBOPTIMAL_META_DESCRIPTION_LENGTH',
        message: `Longitud de meta description subóptima (${descLen} caracteres). Rango recomendado: 120-160.`,
        field: 'metaDescription',
      });
      penalties += 5;
    }

    // 3. Auditoría de Canonical
    if (!extracted.canonicalUrl) {
      issues.push({
        severity: 'INFO',
        code: 'MISSING_CANONICAL',
        message: 'No se detectó etiqueta <link rel="canonical">. Riesgo de contenido duplicado con parámetros URL.',
        field: 'canonicalUrl',
      });
      recommendations.push('Declarar la URL canónica explícita en el head.');
      penalties += 5;
    }

    // 4. Auditoría de Meta Robots
    if (extracted.metaRobots && extracted.metaRobots.toLowerCase().includes('noindex')) {
      issues.push({
        severity: 'CRITICAL',
        code: 'NOINDEX_DETECTED',
        message: 'Directiva "noindex" detectada. La página está bloqueada para indexación pública.',
        field: 'metaRobots',
      });
      recommendations.push('Remover la directiva noindex si esta página debe capturar tráfico orgánico.');
      penalties += 40;
    }

    // 5. Auditoría de Encabezados (H1-H3)
    const h1Count = extracted.headings.h1.length;
    const h2Count = extracted.headings.h2.length;
    const h3Count = extracted.headings.h3.length;

    if (h1Count === 0) {
      issues.push({
        severity: 'CRITICAL',
        code: 'MISSING_H1',
        message: 'No existe encabezado principal <h1> en el documento.',
        field: 'headings.h1',
      });
      recommendations.push('Incorporar exactamente un encabezado <h1> que resuma el tema central.');
      penalties += 20;
    } else if (h1Count > 1) {
      issues.push({
        severity: 'WARNING',
        code: 'MULTIPLE_H1',
        message: `Se detectaron ${h1Count} etiquetas <h1>. Se recomienda una sola para claridad jerárquica.`,
        field: 'headings.h1',
      });
      recommendations.push('Consolidar a un solo <h1> y convertir los secundarios en <h2>.');
      penalties += 10;
    }

    if (h2Count === 0) {
      issues.push({
        severity: 'WARNING',
        code: 'MISSING_H2',
        message: 'No existen encabezados <h2> para estructurar las secciones de la página.',
        field: 'headings.h2',
      });
      penalties += 5;
    }

    // 6. Auditoría de Schema.org JSON-LD
    const jsonLdBlocksCount = extracted.jsonLd.length;
    if (jsonLdBlocksCount === 0) {
      issues.push({
        severity: 'INFO',
        code: 'MISSING_STRUCTURED_DATA',
        message: 'No se encontraron bloques JSON-LD Schema.org.',
        field: 'jsonLd',
      });
      recommendations.push('Implementar Schema.org JSON-LD (ej. RealEstateListing o Organization) para visibilidad en motores generativos.');
      penalties += 5;
    }

    const healthScore = Math.max(0, 100 - penalties);

    return {
      url: extracted.url,
      healthScore,
      title: extracted.title,
      metaDescription: extracted.metaDescription,
      canonicalUrl: extracted.canonicalUrl,
      metaRobots: extracted.metaRobots,
      issues,
      recommendations,
      metrics: {
        titleLength: titleLen,
        descriptionLength: descLen,
        h1Count,
        h2Count,
        h3Count,
        linksCount: extracted.links.length,
        jsonLdBlocksCount,
      },
    };
  }
}
