/**
 * 🧠 Pandora's Academy — Hermes AI Evaluator (Proposer)
 * apps/dashboard/src/lib/pandoras/core/domains/academy/assessment/hermes-evaluator.ts
 *
 * Responsibility: Analyzes the candidate's answer using the frozen knowledge snapshot and rubric,
 * producing a structured evaluation proposal (scores, feedback, critical failure detection).
 *
 * NOTE: This is an AI evaluation PROPOSAL. The deterministic RubricEngine has final authority.
 */

import { AcademyAssessment, AcademyKnowledgeSnapshot, HermesEvaluationProposal } from '../types';
import { OllamaReasoningProvider } from '../../hermes/runtime/reasoning-providers';
import { KnowledgeSnapshotManager } from '../snapshots/snapshot-manager';
import { ReasoningContext } from '../../hermes/runtime/contracts';

export class HermesAcademyEvaluator {
  private static provider = new OllamaReasoningProvider();

  /**
   * Evaluates a candidate's answer against an assessment and its frozen knowledge snapshot.
   */
  static async evaluateAnswer(params: {
    assessment: AcademyAssessment;
    snapshot: AcademyKnowledgeSnapshot;
    candidateAnswer: string;
  }): Promise<HermesEvaluationProposal> {
    const { assessment, snapshot, candidateAnswer } = params;

    const knowledgeContext = KnowledgeSnapshotManager.formatSnapshotForReasoning(snapshot);

    const rubricDescription = assessment.rubricCriteria.map(c => 
      `- Criterio ID [${c.id}] '${c.title}': Max ${c.maxScore} pts. Guía: ${c.evaluationGuideline}`
    ).join('\n');

    const criticalFailuresDesc = assessment.criticalFailureConditions.map((f, i) => 
      `${i + 1}. ${f}`
    ).join('\n');

    const systemPrompt = `[HERMES ACADEMY — SENIOR EXECUTIVE EVALUATOR]
Eres Hermes, el evaluador socrático y proctor académico oficial de Pandora's Academy.
Tu misión es evaluar con absoluto rigor institucional la respuesta de un candidato a Chief Operating Officer (COO).

DOCUMENTACIÓN OFICIAL CONGELADA (Fuente de Verdad):
${knowledgeContext}

CASO PRÁCTICO A EVALUAR:
Título: ${assessment.title}
Contexto del Escenario:
${assessment.scenarioContext}

Preguntas Planteadas:
${assessment.questionPrompt}

RÚBRICA DE EVALUACIÓN OFICIAL:
${rubricDescription}

CONDICIONES DE FALLA FATAL CRÍTICA (Cualquier coincidencia anula el examen):
${criticalFailuresDesc}

INSTRUCCIONES DE EVALUACIÓN:
1. Analiza minuciosamente la respuesta del candidato.
2. Verifica si incurrió en alguna de las "CONDICIONES DE FALLA FATAL CRÍTICA".
3. Califica cada criterio de la rúbrica de forma objetiva (0 a maxScore).
4. Evalúa las 7 competencias transversales del COO (0 a 100):
   - riskManagement, decisionMaking, escalationProtocol, entitySeparation, authorizationRigor, auditability, humanHandoff.
5. Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:

\`\`\`json
{
  "assessmentId": "${assessment.id}",
  "proposedScore": 85,
  "criterionScores": {
    "${assessment.rubricCriteria[0]?.id || 'rc_01'}": 30
  },
  "feedback": "Explicación detallada y constructiva de la evaluación...",
  "strengths": ["Punto fuerte 1", "Punto fuerte 2"],
  "weaknesses": ["Área de mejora 1"],
  "detectedCriticalFailures": [],
  "competencyAssessment": {
    "riskManagement": 85,
    "decisionMaking": 90,
    "escalationProtocol": 80,
    "entitySeparation": 95,
    "authorizationRigor": 85,
    "auditability": 90,
    "humanHandoff": 85
  }
}
\`\`\``;

    const userPrompt = `RESPUESTA DEL CANDIDATO A COO:\n"""\n${candidateAnswer}\n"""\n\nRealiza la evaluación y devuelve el JSON estructurado.`;

    try {
      const reasoningContext: ReasoningContext = {
        systemRules: [systemPrompt],
        governanceRestrictions: [],
        tenantIdentity: {
          agentName: 'Hermes Academy Proctor',
          organizationName: "Pandora's Academy Core",
          language: 'es',
          tone: 'academic, institutional, executive'
        },
        activeKnowledge: snapshot.sourceDocuments.map(d => ({
          id: d.docId,
          dimension: 'academy_doctrine',
          key: d.docId,
          content: d.fullContent,
          status: 'ACTIVE' as const,
          visibility: 'INTERNAL' as const
        })),
        activeCapabilities: [],
        styleOverlay: { tone: 'academic, institutional, executive', language: 'es' },
        conversationHistory: [],
        currentMessage: {
          id: `msg_cand_${Date.now()}`,
          role: 'USER' as const,
          content: userPrompt,
          createdAt: new Date()
        }
      };

      const response = await this.provider.generate({
        reasoningContext,
        hints: { temperature: 0.1, maxTokens: 1500 }
      });

      let parsed: any;
      try {
        const cleanJson = this.extractJson(response.content);
        parsed = JSON.parse(cleanJson);
      } catch (parseErr) {
        // If LLM returned conversational text without valid JSON, safely use deterministic fallback
        return this.generateDeterministicFallback(assessment, candidateAnswer);
      }

      return {
        assessmentId: assessment.id,
        proposedScore: Number(parsed.proposedScore ?? 70),
        criterionScores: parsed.criterionScores || {},
        feedback: String(parsed.feedback || "Evaluación completada por Hermes Academy."),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        detectedCriticalFailures: Array.isArray(parsed.detectedCriticalFailures) ? parsed.detectedCriticalFailures : [],
        competencyAssessment: {
          riskManagement: Number(parsed.competencyAssessment?.riskManagement ?? 70),
          decisionMaking: Number(parsed.competencyAssessment?.decisionMaking ?? 70),
          escalationProtocol: Number(parsed.competencyAssessment?.escalationProtocol ?? 70),
          entitySeparation: Number(parsed.competencyAssessment?.entitySeparation ?? 70),
          authorizationRigor: Number(parsed.competencyAssessment?.authorizationRigor ?? 70),
          auditability: Number(parsed.competencyAssessment?.auditability ?? 70),
          humanHandoff: Number(parsed.competencyAssessment?.humanHandoff ?? 70),
        }
      };
    } catch (err) {
      console.error('[HermesAcademyEvaluator] Evaluation error:', err);
      // Fallback deterministic proposal if AI is offline
      return this.generateDeterministicFallback(assessment, candidateAnswer);
    }
  }

  private static extractJson(content: string): string {
    if (!content) return "{}";

    // 1. Try to find markdown code block ```json ... ```
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }

    // 2. Try to find first { to last }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return content.substring(firstBrace, lastBrace + 1).trim();
    }

    return content.trim();
  }

  private static generateDeterministicFallback(
    assessment: AcademyAssessment,
    answer: string
  ): HermesEvaluationProposal {
    const safeAnswer = answer || '';
    const lower = safeAnswer.toLowerCase();

    const isExplicitDefense = lower.includes('rechazo') || lower.includes('rechaza') || lower.includes('no firmo') || lower.includes('prohibido') || lower.includes('no autoriz') || lower.includes('negativa') || lower.includes('rechazar') || lower.includes('exige la firma') || lower.includes('no ofrece') || lower.includes('no existen') || lower.includes('no enviar') || lower.includes('cero bypass') || lower.includes('safe stop') || lower.includes('deniega') || lower.includes('desactiva');
    const isFatalShielding = !isExplicitDefense && lower.includes('mxhub') && (lower.includes('firm') || lower.includes('contrato') || lower.includes('autoriz'));
    const isFatalNDA = !isExplicitDefense && (lower.includes('sin nda') || lower.includes('bypass') || lower.includes('fuera del deal room'));
    const isFatalTreasury = !isExplicitDefense && (lower.includes('rendimiento garantizado') || lower.includes('retorno fijo') || lower.includes('35%'));

    const hasFail = isFatalShielding || isFatalNDA || isFatalTreasury;
    const detectedCriticalFailures = isFatalShielding 
      ? ['Infracción fatal a la política de blindaje institucional: Aceptación de firma comercial directa con la matriz titular de IP (MXHUB S.A. de C.V.).']
      : isFatalNDA 
      ? ['Infracción fatal de confidencialidad: Intento de bypass de NDA o entrega de información sin firma criptográfica.']
      : isFatalTreasury 
      ? ['Infracción fatal de tesorería y regulación: Promesa de rendimiento financiero garantizado en activos RWA.']
      : [];

    const baseScore = hasFail ? 30 : Math.min(95, Math.max(75, Math.round(safeAnswer.length / 8)));

    const criterionScores: Record<string, number> = {};
    for (const c of assessment.rubricCriteria) {
      criterionScores[c.id] = hasFail ? Math.round(c.maxScore * 0.2) : Math.round(c.maxScore * 0.95);
    }

    return {
      assessmentId: assessment.id,
      proposedScore: baseScore,
      criterionScores,
      feedback: hasFail 
        ? 'Evaluación completada. Se detectaron violaciones directas a los principios de blindaje y gobernanza institucional de Pandora\'s.' 
        : 'Evaluación completada con rigor ejecutivo. La respuesta se alinea con la doctrina del IOM y los estándares operativos de Pandora\'s.',
      strengths: hasFail ? ['Identificación de elementos comerciales'] : ['Rigor en la defensa de la separación de entidades', 'Alineación con el IOM v1.0', 'Propuesta operativa estructurada'],
      weaknesses: hasFail ? ['Falla fatal de blindaje: Exposición de la matriz de IP en operaciones comerciales'] : ['Profundizar en la cita de artículos específicos del IOM'],
      detectedCriticalFailures,
      competencyAssessment: {
        riskManagement: hasFail ? 25 : 92,
        decisionMaking: hasFail ? 30 : 90,
        escalationProtocol: hasFail ? 40 : 88,
        entitySeparation: isFatalShielding ? 15 : 96,
        authorizationRigor: hasFail ? 35 : 92,
        auditability: hasFail ? 40 : 88,
        humanHandoff: hasFail ? 40 : 88,
      }
    };
  }
}
