/**
 * 🛰️ Hermes OS — Scheduled Autonomous Research Cron Worker
 * apps/dashboard/src/app/api/cron/hermes-research/route.ts
 *
 * Runs scheduled competitive intelligence and market change detection missions (F7).
 * Dispatches via HermesRuntime.executeTool('research.run_mission').
 */

import { NextResponse } from 'next/server';
import { getDefaultRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runtime = getDefaultRuntime();
    
    // Buscar proyectos activos elegibles para research programado
    const activeProjects = await db
      .select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
      })
      .from(projects)
      .limit(5);

    const executedMissions: any[] = [];

    for (const project of activeProjects) {
      const tenantSlug = project.slug;
      const missionResult = await runtime.executeTool!(
        {
          organizationId: tenantSlug,
          actorId: 'cron_worker',
          capabilityId: 'research.run_mission',
          toolName: 'research.run_mission',
          parameters: {
            missionId: `cron_${tenantSlug}_${Date.now()}`,
            tenantId: tenantSlug,
            title: `Scheduled Research for ${project.title}`,
            tenantUrl: `https://${tenantSlug}.com`,
            competitorUrls: [`https://market-leader.com`],
            targetKeywords: ['tokenization', 'real estate', 'liquidity'],
            trigger: 'SCHEDULED_CRON',
          },
        },
        [{ id: 'research.run_mission', description: 'Autonomous research mission capability' }]
      );

      executedMissions.push({
        tenantSlug,
        success: missionResult.success,
        deltas: (missionResult.data as any)?.deltasFound?.length ?? 0,
        candidateKey: (missionResult.data as any)?.vaultCandidateKey,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      missionsExecuted: executedMissions.length,
      details: executedMissions,
    });
  } catch (error) {
    console.error('[Hermes Research Cron] Execution failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown cron error' },
      { status: 500 }
    );
  }
}
