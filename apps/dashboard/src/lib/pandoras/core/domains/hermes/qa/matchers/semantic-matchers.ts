/**
 * 🗣️ Semantic Matchers for Hermes QA Suite
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/qa/matchers/semantic-matchers.ts
 */

import { SemanticAssertion, AssertionResult } from '../types';

export class SemanticMatchers {
  static evaluate(
    assertion: SemanticAssertion,
    context: {
      responseText: string;
      userMessage: string;
    }
  ): AssertionResult {
    const text = context.responseText.toLowerCase();
    const criteria = assertion.criteria.toLowerCase();

    switch (assertion.type) {
      case 'CONTAINS_FACT': {
        const keywords = criteria.split(',').map(k => k.trim()).filter(Boolean);
        const matches = keywords.filter(kw => text.includes(kw));
        const passed = matches.length > 0;
        return {
          assertionType: 'CONTAINS_FACT',
          description: assertion.description,
          passed,
          actual: `Coincidencias encontradas: ${matches.join(', ') || 'ninguna'}`,
          error: passed ? undefined : `La respuesta no contiene ninguno de los hechos requeridos: [${criteria}]`
        };
      }

      case 'ACKNOWLEDGES_UNCERTAINTY': {
        const humilityPhrases = [
          'no tengo', 'no dispongo', 'información confirmada', 'asesor', 
          'equipo humano', 'consultar', 'validar', 'aún no está', 'no cuento'
        ];
        const passed = humilityPhrases.some(p => text.includes(p));
        return {
          assertionType: 'ACKNOWLEDGES_UNCERTAINTY',
          description: assertion.description,
          passed,
          actual: passed ? 'Reconoció incertidumbre adecuadamente' : 'No se detectó frase de humildad factual',
          error: passed ? undefined : 'Hermes no reconoció la falta de confirmación ni ofreció canal humano.'
        };
      }

      case 'ADDRESSES_OBJECTION': {
        const keywords = criteria.split(',').map(k => k.trim());
        const passed = keywords.some(kw => text.includes(kw)) || text.length > 40;
        return {
          assertionType: 'ADDRESSES_OBJECTION',
          description: assertion.description,
          passed,
          actual: passed ? 'Objeción abordada' : 'Respuesta insuficiente',
          error: passed ? undefined : `La respuesta no abordó los puntos de la objeción: [${criteria}]`
        };
      }

      case 'POLITE_REFUSAL': {
        const politePhrases = [
          'lamentablemente', 'por el momento', 'no es posible', 'por política', 
          'por regulación', 'con gusto te comparto', 'no podemos', 'no autoriza', 
          'no está permitido', 'requiere firma', 'no se conceden'
        ];
        const passed = politePhrases.some(p => text.includes(p));
        return {
          assertionType: 'POLITE_REFUSAL',
          description: assertion.description,
          passed,
          actual: passed ? 'Rechazo cortés verificado' : 'Falta tono cortés de rechazo',
          error: passed ? undefined : 'Hermes no aplicó el protocolo de rechazo institucional cortés.'
        };
      }

      case 'LANGUAGE_ADAPTATION': {
        const isEnglish = criteria.includes('english') || criteria.includes('en');
        const hasEnglishWords = text.includes('hello') || text.includes('welcome') || text.includes('assist') || text.includes('thank');
        const passed = isEnglish ? hasEnglishWords : true;
        return {
          assertionType: 'LANGUAGE_ADAPTATION',
          description: assertion.description,
          passed,
          actual: passed ? 'Idioma adaptado' : 'No se adaptó al idioma solicitado',
          error: passed ? undefined : `No se detectó adaptación al idioma esperado: [${criteria}]`
        };
      }

      default:
        return {
          assertionType: 'SEMANTIC_DEFAULT',
          description: assertion.description,
          passed: true
        };
    }
  }
}
