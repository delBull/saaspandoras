import { NextRequest, NextResponse } from 'next/server';
import { HermesIntelligenceEngine } from '@/lib/hermes/intelligence-engine';
import { db } from '@/db';
import { projects, marketingLeads } from '@/db/schema';
import { count } from 'drizzle-orm';

/**
 * GET /api/v1/hermes/analytics
 * Mission Control & Growth OS Telemetry Endpoint for Hermes Agent
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productionSlug = searchParams.get('productionProject') || 'sandbox';

    const sandboxSummary = HermesIntelligenceEngine.getProjectAnalyticsSummary('sandbox');
    const productionSummary = HermesIntelligenceEngine.getProjectAnalyticsSummary(productionSlug);

    // Total Projects in Growth OS
    const projectsCount = await db.select({ value: count() }).from(projects);
    const totalLeadsCount = await db.select({ value: count() }).from(marketingLeads);

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      platform: {
        totalProjects: projectsCount[0]?.value || 0,
        totalLeadsCaptured: totalLeadsCount[0]?.value || 0
      },
      hermesMetrics: {
        sandbox: {
          totalInteractions: sandboxSummary.totalEvents,
          objectionsHandled: sandboxSummary.totalEvents,
          status: 'ACTIVE_RATE_LIMITED'
        },
        production: {
          [productionSlug]: productionSummary,
          status: 'ACTIVE_OMNICHANNEL'
        }
      }
    });
  } catch (err: any) {
    console.error('[Hermes Analytics Error]:', err);
    return NextResponse.json({
      error: 'Error al recuperar métricas de Hermes',
      details: err.message
    }, { status: 500 });
  }
}
