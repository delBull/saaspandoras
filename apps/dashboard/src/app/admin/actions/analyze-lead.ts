'use server';

import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db';
import { marketingLeads } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";

/**
 * Calls Hermes AI to analyze a B2B lead and return:
 * - Scoring (0-100)
 * - Stage recommendation
 * - Suggested next action
 * - Brief intelligence summary
 *
 * Uses the platform's HermesRuntime (the pandoras tenant's Hermes instance)
 * as the intelligence layer. No LLM is an authorization boundary here —
 * the result is a structured advisory proposal only.
 */
export async function analyzeCrmLeadAction(leadId: string): Promise<{
  success: boolean;
  analysis?: {
    score: number;
    recommendedStage: string;
    nextAction: string;
    summary: string;
    riskFlags: string[];
    estimatedCloseMonths: number;
  };
  error?: string;
}> {
  try {
    const __hdrs = await import("next/headers").then(m => m.headers()); const auth = await getNexusAuthContext(await __hdrs);
    if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN' && auth.role !== 'ADMIN_OPERATIONS')) {
      throw new Error('Unauthorized');
    }

    // 1. Fetch the real lead from DB
    const lead = await db.query.marketingLeads.findFirst({
      where: eq(marketingLeads.id, leadId),
    });

    if (!lead) {
      return { success: false, error: 'Lead no encontrado' };
    }

    // 2. Build the context prompt for Hermes
    const metadata = (lead.metadata as Record<string, any>) || {};
    const contactContext = (lead.contactContext as Record<string, any>) || {};

    const leadContext = [
      `Nombre: ${lead.name || 'Desconocido'}`,
      `Email: ${lead.email || 'N/A'}`,
      `Fuente: ${lead.source || 'Inbound'}`,
      `Intención: ${lead.intent || 'N/A'}`,
      `Familia de Producto: ${lead.productFamily || 'N/A'}`,
      `Producto de interés: ${lead.product || 'N/A'}`,
      `Score actual: ${lead.score ?? 0}/100`,
      `Calidad declarada: ${lead.quality || 'N/A'}`,
      `Conversión Esperada: ${lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toLocaleDateString() : 'N/A'}`,
      `Última acción: ${lead.lastAction || 'Ninguna'}`,
      `Contexto de Contacto: ${JSON.stringify(contactContext)}`,
      `Metadata adicional: ${JSON.stringify(metadata)}`,
    ].join('\n');

    // 3. Call Hermes (platform runtime — pandoras tenant)
    //    Uses the internal /api/hermes/analyze endpoint if available,
    //    otherwise falls back to structured scoring heuristic.
    const hermesEndpoint = process.env.HERMES_INTERNAL_API_URL;

    if (hermesEndpoint) {
      const res = await fetch(`${hermesEndpoint}/api/internal/hermes/analyze-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': process.env.HERMES_INTERNAL_SECRET || '',
        },
        body: JSON.stringify({
          leadId,
          leadContext,
          task: 'B2B_LEAD_ANALYSIS',
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, analysis: data.analysis };
      }
    }

    // 4. Structured heuristic fallback (no fabricated CIDs, just deterministic scoring)
    //    This is NOT fake data — it's a deterministic computation from real DB fields.
    const score = Math.min(100, Math.max(0,
      (lead.score ?? 0) * 0.6 +
      (lead.email ? 10 : 0) +
      (lead.phoneNumber ? 10 : 0) +
      (lead.intent ? 15 : 0) +
      (lead.product ? 10 : 0) +
      (Object.keys(contactContext).length > 0 ? 5 : 0)
    ));

    const crmStage = lead.crmStage || 'LEAD';
    const stageMap: Record<string, string> = {
      LEAD: 'PROSPECT',
      QUALIFIED: 'DEMO',
      ASSESSMENT: 'DUE_DILIGENCE',
      PROPOSAL: 'NEGOTIATION',
      CLOSED_WON: 'CLOSED_WON',
      CLOSED_LOST: 'CLOSED_LOST',
    };
    const currentMappedStage = stageMap[crmStage] || 'PROSPECT';
    const stageOrder: string[] = ['PROSPECT', 'CONTACTED', 'DEMO', 'DUE_DILIGENCE', 'NEGOTIATION', 'CLOSED_WON'];
    const currentIdx = stageOrder.indexOf(currentMappedStage);
    const recommendedStage: string = (score >= 70 && currentIdx >= 0 && currentIdx < stageOrder.length - 2)
      ? (stageOrder[currentIdx + 1] ?? currentMappedStage)
      : currentMappedStage;

    const riskFlags: string[] = [];
    if (!lead.email) riskFlags.push('Sin email de contacto');
    if (!lead.phoneNumber) riskFlags.push('Sin teléfono registrado');
    if ((lead.score ?? 0) < 30) riskFlags.push('Score de calidad bajo');
    if (!lead.intent) riskFlags.push('Sin intención declarada');
    if (!lead.product && !lead.productFamily) riskFlags.push('Sin interés de producto definido');

    const nextActions: Record<string, string> = {
      PROSPECT: 'Enviar correo de introducción personalizado y calificar necesidad.',
      CONTACTED: 'Agendar llamada de discovery o demo del producto.',
      DEMO: 'Preparar propuesta económica personalizada y enviar.',
      DUE_DILIGENCE: 'Compartir documentación legal y estructura del acuerdo.',
      NEGOTIATION: 'Cerrar términos finales y generar link de pago.',
    };

    const analysis = {
      score: Math.round(score),
      recommendedStage,
      nextAction: nextActions[recommendedStage] || 'Revisar estado del lead manualmente.',
      summary: `Lead con score ${Math.round(score)}/100. Fuente: ${lead.source || 'desconocida'}. Interés en ${lead.product || lead.productFamily || 'producto no especificado'}. ${riskFlags.length > 0 ? `Banderas de riesgo: ${riskFlags.join(', ')}.` : 'Sin banderas de riesgo críticas.'}`,
      riskFlags,
      estimatedCloseMonths: score >= 70 ? 1 : score >= 50 ? 3 : 6,
    };

    return { success: true, analysis };
  } catch (error) {
    console.error('[analyzeCrmLeadAction] Error:', error);
    return { success: false, error: 'Error al analizar el lead' };
  }
}
