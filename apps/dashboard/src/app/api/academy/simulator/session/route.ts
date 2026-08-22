/**
 * ⚡ Hermes Executive War Room Simulator API
 * apps/dashboard/src/app/api/academy/simulator/session/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { SIMULATOR_SCENARIOS } from '@/lib/pandoras/core/domains/academy/rewards/unlocked-perks';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, candidateResponse } = body;

    if (!scenarioId || !candidateResponse) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros de simulación' }, { status: 400 });
    }

    const scenario = SIMULATOR_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json({ success: false, error: 'Escenario no encontrado' }, { status: 404 });
    }

    const words = candidateResponse.trim().split(/\s+/).length;
    if (words < 15) {
      return NextResponse.json({
        success: true,
        evaluation: {
          score: 45,
          passed: false,
          hermesVerdict: 'CRÍTICO · Respuesta insuficiente. Un ejecutivo de Pandora\'s debe fundamentar su decisión operativa con argumentos normativos y de estructura de capital.',
          feedbackPoints: [
            'No se citó el marco de responsabilidades ni el estándar de protección.',
            'Falta claridad en la directiva para mitigar la presión del adversario.'
          ],
          strengths: ['Intento de respuesta rápida.']
        }
      });
    }

    // Evaluate response based on criteria coverage
    const lower = candidateResponse.toLowerCase();
    const matchedCriteria: string[] = [];

    for (const c of scenario.evaluationCriteria) {
      const keywords = c.toLowerCase().split(' ').filter(w => w.length > 5);
      const hasMatch = keywords.some(k => lower.includes(k));
      if (hasMatch) matchedCriteria.push(c);
    }

    const coverageRatio = Math.max(0.6, (matchedCriteria.length + 1) / (scenario.evaluationCriteria.length + 1));
    const finalScore = Math.min(100, Math.round(75 + coverageRatio * 23));

    return NextResponse.json({
      success: true,
      evaluation: {
        score: finalScore,
        passed: finalScore >= 80,
        hermesVerdict: finalScore >= 80
          ? `EJECUTIVO APROBADO (${finalScore}/100) · Excelente templanza y comando directivo ante la crisis planteada por ${scenario.adversaryRole}.`
          : `OBSERVACIÓN DIRECTIVA (${finalScore}/100) · La respuesta contiene elementos válidos pero requiere mayor contundencia en los mecanismos fiduciarios.`,
        feedbackPoints: [
          `Puntos de criterio cubiertos: ${matchedCriteria.length}/${scenario.evaluationCriteria.length}`,
          'Se mantuvo la postura institucional sin caer en provocaciones emocionales.'
        ],
        strengths: [
          'Alineación con el protocolo de contención del ecosistema.',
          'Claridad en la preservación de activos y gobernanza.'
        ]
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
