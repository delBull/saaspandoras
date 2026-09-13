/**
 * 📝 Hermes OS — Content Quality & Semantic Coverage Engine (F4)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/seo/seo-content-engine.ts
 */

import { WebExtractTool } from '../../tools/web/web-extract-tool';
import { SeoContentInput, SeoContentReport } from './contracts';

export class SeoContentEngine {
  public static async analyze(input: SeoContentInput): Promise<SeoContentReport> {
    let text = input.text || '';
    let targetUrl = input.url;

    if (!text && (input.url || input.html)) {
      const extracted = await WebExtractTool.execute({
        url: input.url,
        html: input.html,
      });
      text = extracted.text;
      targetUrl = extracted.url;
    }

    const words = text
      .toLowerCase()
      .replace(/[^\wáéíóúñü\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = Math.max(1, sentences.length);

    // Estimación aproximada de sílabas para Flesch-Szigriszt (español)
    let totalSyllables = 0;
    for (const word of words) {
      const vowelMatches = word.match(/[aeiouáéíóúü]/gi);
      totalSyllables += vowelMatches ? vowelMatches.length : 1;
    }

    const wordsPerSentence = wordCount / sentenceCount;
    const syllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 1;

    // Fórmula Flesch-Szigriszt adaptada a español
    let readabilityScore = Math.round(206.835 - (62.3 * syllablesPerWord) - wordsPerSentence);
    readabilityScore = Math.max(0, Math.min(100, readabilityScore));

    let readingEaseLevel: SeoContentReport['readingEaseLevel'] = 'ESTANDAR';
    if (readabilityScore >= 80) readingEaseLevel = 'MUY_FACIL';
    else if (readabilityScore >= 65) readingEaseLevel = 'FACIL';
    else if (readabilityScore >= 50) readingEaseLevel = 'ESTANDAR';
    else if (readabilityScore >= 35) readingEaseLevel = 'DIFICIL';
    else readingEaseLevel = 'MUY_DIFICIL';

    // Análisis de Palabras Clave Objetivo
    const targetKeywords = input.targetKeywords || [];
    const targetKeywordAnalysis = targetKeywords.map(kw => {
      const lowerKw = kw.toLowerCase().trim();
      const count = (text.toLowerCase().match(new RegExp(`\\b${lowerKw}\\b`, 'gi')) || []).length;
      const densityPercent = wordCount > 0 ? Number(((count / wordCount) * 100).toFixed(2)) : 0;
      return {
        keyword: kw,
        occurrences: count,
        densityPercent,
      };
    });

    // Extracción de Entidades y Conceptos Relevantes
    const discoveredEntities = this.extractEntities(text);

    // Detección de Brechas y Recomendaciones
    const contentGaps: string[] = [];
    const recommendations: string[] = [];

    if (wordCount < 300) {
      contentGaps.push('Volumen de contenido insuficiente para posicionar en búsquedas competitivas.');
      recommendations.push('Aumentar la extensión neta a un mínimo de 600-800 palabras de alto valor informativo.');
    }

    for (const kwAnalysis of targetKeywordAnalysis) {
      if (kwAnalysis.occurrences === 0) {
        contentGaps.push(`Término clave omitido: "${kwAnalysis.keyword}".`);
        recommendations.push(`Incorporar naturalmente "${kwAnalysis.keyword}" en encabezados secundarios y primer párrafo.`);
      } else if (kwAnalysis.densityPercent > 4.5) {
        recommendations.push(`Alerta de saturación: "${kwAnalysis.keyword}" tiene ${kwAnalysis.densityPercent}% de densidad. Reducir para evitar penalización por keyword stuffing.`);
      }
    }

    if (readingEaseLevel === 'MUY_DIFICIL') {
      recommendations.push('Simplificar la redacción acortando oraciones extensas para mejorar retención y legibilidad.');
    }

    return {
      url: targetUrl,
      wordCount,
      readabilityScore,
      readingEaseLevel,
      targetKeywordAnalysis,
      discoveredEntities,
      contentGaps,
      recommendations,
    };
  }

  private static extractEntities(text: string): string[] {
    const knownDomainEntities = [
      'tokenización',
      'real estate',
      'rwa',
      'tulum',
      'riviera maya',
      'certificados de participación',
      'smart contracts',
      'plusvalía',
      'rendimiento',
      'propiedad fraccional',
      'blockchain',
      'spei',
      'usdc',
    ];

    const lower = text.toLowerCase();
    const matched: string[] = [];

    for (const entity of knownDomainEntities) {
      if (lower.includes(entity) && !matched.includes(entity)) {
        matched.push(entity);
      }
    }

    return matched;
  }
}
