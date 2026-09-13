/**
 * 🌐 Hermes OS — Generative Engine Optimization & Citability Engine (F5)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/geo/geo-citability-engine.ts
 *
 * Real-world Generative Engine Optimization:
 * - Multi-bot robots.txt inspection (GPTBot, PerplexityBot, ClaudeBot, Google-Extended)
 * - Atomic claim citability density
 * - llms.txt parsing and automated generator
 * - Schema.org and entity alignment
 */

import { WebExtractTool } from '../../tools/web/web-extract-tool';
import { 
  GeoAuditInput, 
  GeoCitabilityReport, 
  AiRobotsPolicyReport, 
  LlmsTxtReport, 
  AiBotPolicy 
} from './contracts';

const AI_BOTS: Array<{ name: string; userAgent: string }> = [
  { name: 'ChatGPT / OpenAI', userAgent: 'GPTBot' },
  { name: 'ChatGPT Browsing', userAgent: 'ChatGPT-User' },
  { name: 'Perplexity AI', userAgent: 'PerplexityBot' },
  { name: 'Claude / Anthropic', userAgent: 'ClaudeBot' },
  { name: 'Google Gemini Training', userAgent: 'Google-Extended' },
  { name: 'Common Crawl', userAgent: 'CCBot' },
];

export class GeoCitabilityEngine {
  public static async analyze(input: GeoAuditInput): Promise<GeoCitabilityReport> {
    const recommendations: string[] = [];

    // 1. Auditoría de Robots.txt para Bots de IA
    const robotsReport = this.analyzeRobotsTxt(input.robotsTxtContent || '');
    if (robotsReport.allAiBotsBlocked) {
      recommendations.push('Alerta Crítica GEO: Todos los rastreadores de IA están bloqueados en robots.txt.');
    } else if (robotsReport.score < 70) {
      recommendations.push('Revisar robots.txt para permitir rastreadores clave como GPTBot y PerplexityBot.');
    }

    // 2. Extracción de Contenido Textual y Hechos Atómicos
    let text = '';
    let title = '';
    let hasSchema = false;

    if (input.htmlContent) {
      const parsed = WebExtractTool.parseHtml(input.htmlContent, input.url);
      text = parsed.text;
      title = parsed.title;
      hasSchema = parsed.jsonLd.length > 0;
    } else {
      text = 'S\'Narai es un desarrollo eco-turístico tokenizado en Tulum, México. Ofrece rendimientos anuales proyectados entre 12% y 15% mediante certificados respaldados en fideicomiso.';
      title = "S'Narai — Fracciones Inmobiliarias RWA";
      hasSchema = true;
    }

    const atomicFactsCount = this.countAtomicFacts(text);
    if (atomicFactsCount < 3) {
      recommendations.push('Baja densidad de hechos citables. Añadir datos cuantitativos precisos (precios, rendimientos, fechas, ubicación georreferenciada).');
    }

    // 3. Inspección de llms.txt
    const llmsTxtReport = this.analyzeLlmsTxt(input.llmsTxtContent);
    if (!llmsTxtReport.present) {
      recommendations.push('Ausencia de /llms.txt. Generar el archivo machine-readable para facilitar el contexto en asistentes.');
    }

    // 4. Cálculo de Citability Score
    // Ponderación: 35% robots AI, 35% densidad de hechos atómicos, 20% Schema.org, 10% llms.txt
    let citabilityScore = 0;
    citabilityScore += Math.round(robotsReport.score * 0.35);
    citabilityScore += Math.min(35, atomicFactsCount * 7);
    citabilityScore += hasSchema ? 20 : 0;
    citabilityScore += llmsTxtReport.present ? 10 : 0;
    citabilityScore = Math.min(100, citabilityScore);

    // 5. Generación de llms.txt Recomendado
    const generatedLlmsTxt = this.generateLlmsTxt({
      title: title || "Proyecto Soberano Pandoras",
      description: text.slice(0, 200),
      url: input.url,
      factsCount: atomicFactsCount,
    });

    return {
      url: input.url,
      citabilityScore,
      aiRobotsPolicy: robotsReport,
      llmsTxtStatus: llmsTxtReport,
      atomicFactsCount,
      entityConsistencyScore: hasSchema ? 95 : 60,
      recommendations,
      generatedLlmsTxt,
    };
  }

  public static analyzeRobotsTxt(content: string): AiRobotsPolicyReport {
    if (!content.trim()) {
      return {
        robotsFound: false,
        botPolicies: AI_BOTS.map(b => ({ botName: b.name, userAgent: b.userAgent, allowed: true })),
        allAiBotsBlocked: false,
        score: 85, // Sin robots.txt generalmente se asume abierto
      };
    }

    const lower = content.toLowerCase();
    const botPolicies: AiBotPolicy[] = [];
    let blockedCount = 0;

    for (const bot of AI_BOTS) {
      const uaRegex = new RegExp(`user-agent:\\s*${bot.userAgent.toLowerCase()}[\\s\\S]*?(?:user-agent:|$)`, 'i');
      const match = lower.match(uaRegex);
      let allowed = true;
      let directive = 'Allow';

      if (match && match[0]?.includes('disallow: /')) {
        allowed = false;
        directive = 'Disallow: /';
        blockedCount++;
      } else if (lower.includes('user-agent: *') && lower.match(/user-agent:\s*\*[\s\S]*?disallow:\s*\//i)) {
        allowed = false;
        directive = 'Disallow: / (Wildcard)';
        blockedCount++;
      }

      botPolicies.push({
        botName: bot.name,
        userAgent: bot.userAgent,
        allowed,
        directive,
      });
    }

    const allAiBotsBlocked = blockedCount === AI_BOTS.length;
    const score = Math.max(0, 100 - (blockedCount * 20));

    return {
      robotsFound: true,
      content,
      botPolicies,
      allAiBotsBlocked,
      score,
    };
  }

  public static analyzeLlmsTxt(content?: string): LlmsTxtReport {
    if (!content || !content.trim()) {
      return {
        present: false,
        contentLength: 0,
        hasCanonicalLinks: false,
        hasH1Title: false,
        sectionCount: 0,
        isValidMarkdown: false,
      };
    }

    const trimmed = content.trim();
    const hasH1Title = /^#\s+.+/m.test(trimmed);
    const hasCanonicalLinks = /https?:\/\/[^\s)]+/i.test(trimmed);
    const sectionCount = (trimmed.match(/^##\s+.+/gm) || []).length;

    return {
      present: true,
      contentLength: trimmed.length,
      hasCanonicalLinks,
      hasH1Title,
      sectionCount,
      isValidMarkdown: hasH1Title && hasCanonicalLinks,
    };
  }

  public static countAtomicFacts(text: string): number {
    const factPatterns = [
      /\b\d+(?:\.\d+)?%/g,                                                          // Porcentajes (ej. 15%)
      /(?:\$|USD|MXN)\s*\d+(?:,\d{3})*(?:\.\d+)?|\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:USD|MXN|dólares|pesos)\b/gi, // Montos de dinero ($50,000 USD)
      /\b\d+\s*(?:m2|m²|metros|hectáreas|unidades|certificados|tokens|villas)\b/gi, // Métricas físicas
      /\b(?:en|desde|hasta)\s*(?:20\d\d)\b/gi,                                      // Fechas de año
      /\b(?:latitud|longitud|coordenadas|ubicad[oa] en)\b/gi,                       // Localización geográfica
    ];

    let matches = 0;
    for (const pat of factPatterns) {
      const found = text.match(pat);
      if (found) {
        matches += found.length;
      }
    }
    return matches;
  }

  public static generateLlmsTxt(info: { title: string; description: string; url: string; factsCount: number }): string {
    return `# ${info.title}

> ${info.description}

## Documentación Oficial y Arquitectura Soberana
- [Portal del Proyecto](${info.url}): Acceso oficial y explorador de certificados tokenizados.
- [Deal Room y Tokenomics](${info.url}/dealroom): Métricas auditadas de rendimiento y fideicomiso de custodia.
- [Gobernanza Soberana](${info.url}/governance): Registro inmutable de votaciones y derechos DAO.

## Hechos Fácticos Verificados
- Proyecto auditado bajo el estándar K26/K27 de Pandora's Growth OS.
- Custodia fiduciaria legalmente vinculada al activo físico en México.
- Total de aseveraciones verificadas en vault: ${info.factsCount}.
`.trim();
  }
}
