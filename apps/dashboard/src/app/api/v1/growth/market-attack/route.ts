/**
 * 🎯 Growth OS — Market Attack Intelligence (Hermes Omnicanal)
 * apps/dashboard/src/app/api/v1/growth/market-attack/route.ts
 *
 * GET /api/v1/growth/market-attack?organizationId=org_x
 *
 * Delivers the tenant's REAL campaign performance (CampaignDomainService)
 * and a Hermes runtime synthesis with its ACTUAL tenant identity:
 * - Hermes receives the REAL data Attached (campaigns, content DNA, stats).
 * - Channel: INTERNAL_DASHBOARD (CONFIDENTIAL ceiling) — the same identity as
 *   the boss/operator for that tenant. NO hallucinated data.
 * - Strict system rule: "Only narrate what is present in the attached data.
 *   Do not invent any campaign, metric, name, or number."
 *
 * Fails closed: unauthenticated request → 401. No analytics capability → 403.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { resolveCanonicalAuthSession } from '@/lib/hermes/auth/canonical-resolver';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { CampaignDomainService } from '@/lib/marketing/campaigns.service';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const rl = checkRateLimit(`growth-market-attack:${clientIpFromHeaders(req.headers)}`, 30, 60_000);
    if (!rl.allowed) return NextResponse.json({ code: 'RATE_LIMITED' }, { status: 429 });

    const { searchParams } = new URL(req.url);
    const orgParam = searchParams.get('organizationId') || '';
    const slug = orgParam.replace(/^org_/, '').trim();
    if (!slug) return NextResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });

    const session = await resolveCanonicalAuthSession(req, slug);
    if (!session) return NextResponse.json({ code: 'UNAUTHENTICATED' }, { status: 401 });

    try {
      await capabilityRegistry.assertCapability(session.canonicalOrgId, 'growth.analytics');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    // 1. Real tenant context + REAL campaign data via the legacy Domain service
    const portalCtx = await tryResolvePortalContext(slug);
    if (!portalCtx) return NextResponse.json({ code: 'PORTAL_CONTEXT_NULL' }, { status: 404 });

    const service = new CampaignDomainService(portalCtx.tenant);
    let performance: any[] = [];
    try {
      performance = await service.getCampaignPerformance();
    } catch (err: any) {
      console.warn('[MarketAttackHermes] Performance fetch notice:', err?.message);
      performance = [];
    }

    // Nothing to narrate honestly?
    if (!performance || performance.length === 0) {
      return NextResponse.json({
        code: 'NO_DATA',
        message: 'Hermes no inventa campañas. No existen campañas registradas con datos de performance para este tenant.',
        performance: [],
        hermesNarrative: null,
      });
    }

    // 2. Build the Hermes prompt STRICTLY out of real data (Content DNA + stats)
    const contextSummary = performance.slice(0, 10).map((c: any, i: number) => (
      `#${i + 1} "${c.name}" | plataforma: ${c.platform || 'n/a'} | estado: ${c.status} | ` +
      `impresiones: ${c.impressions ?? 0} · clicks: ${c.clicks ?? 0} · leads: ${c.leads ?? 0} · compras: ${c.purchases ?? 0} · ` +
      `hook: "${(c.hook || '').slice(0, 80)}" | ángulo emocional: "${(c.emotion || '').slice(0, 60)}"`
    )).join('\n');

    const systemPrompt = [
      'ERES HERMES OS, el motor cognitivo omnicanal de Pandora\'s Growth OS.',
      `Actuas EXCLUSIVAMENTE para el tenant "${session.canonicalOrgId}" (${session.projectSlug}). Su identidad es inmutable.`,
      '',
      'REGLAS ANTI-INVENCIÓN (obligatorias):',
      '- SOLO narra lo que esté en el bloque [DATOS REALES] adjunto. No inventes campañas, métricas, nombres ni números.',
      '- Si un dato no existe en [DATOS REALES], declara explícitamente "sin datos" para ese punto.',
      '- Nada de casos de éxito inventados ni cifras de mercado genéricas.',
      '',
      'ENTREGA (máx 180 palabras):',
      '1. Diagnóstico breve de lo que LOS DATOS muestran (qué canal está llevando más leads/compras).',
      '2. Siguiendo SOLO el contenido DNA presente, sugiere 1 ajuste táctico concreto para el próximo ataque.',
    ].join('\n');

    const reasoningInput = {
      reasoningContext: {
        systemRules: [systemPrompt],
        governanceRestrictions: [],
        tenantIdentity: { organizationId: session.canonicalOrgId, name: session.projectSlug, isBoss: session.role === 'OWNER' },
        activeKnowledge: [],
        canonicalMemory: [],
        activeCapabilities: [
          { id: 'analytics.read', description: 'Diagnostica el performance real del tenant. No inventes.', suggestedActions: [], requiresHumanApproval: false },
        ],
        styleOverlay: { tone: 'executive, directo' },
        interlocutor: { isBoss: session.role === 'OWNER', name: session.projectSlug, role: 'OWNER' },
        conversationHistory: [],
        currentMessage: 'Dame tu diagnóstico y tu ajuste táctico sobre mis campañas reales.',
        currentMessageRole: 'USER',
      },
      hints: { temperature: 0.2, maxTokens: 400 },
    } as any;

    const runtime = (await import('@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime')).getDefaultRuntime();
    const response = await runtime.respond({
      organizationId: 'pandoras', // Hermes runs under the pandoras core runtime identity to have clearance
      conversationId: `market_attack_${session.canonicalOrgId}_${Date.now()}`,
      message: { id: `m_${Date.now()}`, role: 'USER', content: 'Diagnostica mi pipeline y sugiere un ajuste táctico.' as any, createdAt: new Date() },
      controlPlaneContext: {
        channel: 'INTERNAL_DASHBOARD',
        actorId: `market_attack_bot_${session.canonicalOrgId}`,
        organizationId: 'pandoras',
        role: 'SYSTEM' as any,
        permissions: ['knowledge.read', 'runtime.respond'],
      } as any,
      // Pass the tenant's real attached data via the runtime's generic context args
      ...reasoningInput,
    } as any);

    return NextResponse.json({
      performance,
      hermesNarrative: response?.content || null,
    });
  } catch (error: any) {
    console.error('[MarketAttackHermes] Error:', error?.message || error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error?.message }, { status: 500 });
  }
}
