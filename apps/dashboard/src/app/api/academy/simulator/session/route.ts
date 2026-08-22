/**
 * ⚡ Hermes Executive War Room Simulator API
 * apps/dashboard/src/app/api/academy/simulator/session/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { AcademyStore } from '@/lib/pandoras/core/domains/academy/candidates/candidate-store';
import { SIMULATOR_SCENARIOS } from '@/lib/pandoras/core/domains/academy/rewards/unlocked-perks';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { certId, scenarioId, candidateResponse } = body;

    if (!certId || !scenarioId || !candidateResponse) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros de simulación (certId, scenarioId o candidateResponse).' },
        { status: 400 }
      );
    }

    // 🛡️ SECURITY GUARD: Gating Tier 2 Simulator behind verified certification
    const cert = await AcademyStore.getCertificationAsync(certId);
    if (!cert || cert.status !== 'CERTIFIED') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Se requiere una credencial ejecutiva aprobada para acceder al War Room.' },
        { status: 403 }
      );
    }

    const scenario = SIMULATOR_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json({ success: false, error: 'Escenario no encontrado.' }, { status: 404 });
    }

    const words = candidateResponse.trim().split(/\s+/).length;
    if (words < 20) {
      return NextResponse.json({
        success: true,
        evaluation: {
          score: 35,
          passed: false,
          hermesVerdict: 'CRÍTICO (35/100) · Respuesta insuficiente. Una postura directiva de Pandora\'s requiere argumentación jurídica, financiera o técnica detallada para neutralizar la contingencia.',
          feedbackPoints: [
            'No se fundamentó en la separación institucional ni en los protocolos fiduciarios.',
            'Falta claridad en el plan de acción contingente.'
          ],
          strengths: []
        }
      });
    }

    // Evaluate response with realistic scoring against all scenario criteria
    const lower = candidateResponse.toLowerCase();
    const matchedCriteria: string[] = [];
    const missingCriteria: string[] = [];

    for (const c of scenario.evaluationCriteria) {
      const keywords = c.toLowerCase().split(' ').filter(w => w.length > 4);
      const matches = keywords.filter(k => lower.includes(k)).length;
      if (matches >= 2) {
        matchedCriteria.push(c);
      } else {
        missingCriteria.push(c);
      }
    }

    const totalCriteria = scenario.evaluationCriteria.length;
    const pointsPerCriterion = 100 / totalCriteria;
    const baseScore = Math.round(matchedCriteria.length * pointsPerCriterion);
    const finalScore = Math.min(100, Math.max(30, baseScore));
    const passed = finalScore >= 80;

    return NextResponse.json({
      success: true,
      evaluation: {
        score: finalScore,
        passed,
        hermesVerdict: passed
          ? `EJECUTIVO APROBADO (${finalScore}/100) · Excelente comando y templanza ante la presión de ${scenario.adversaryRole}. Se protegieron los activos y la gobernanza institucional.`
          : `OBSERVACIÓN DIRECTIVA (${finalScore}/100) · La postura directiva no cubre los requerimientos fiduciarios necesarios ante ${scenario.adversaryRole}. Revisa los criterios pendientes.`,
        feedbackPoints: [
          `Criterios institucionales cubiertos: ${matchedCriteria.length} de ${totalCriteria}.`,
          ...(missingCriteria.length > 0 ? [`Pendientes por reforzar: ${missingCriteria[0]}`] : [])
        ],
        strengths: matchedCriteria
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
