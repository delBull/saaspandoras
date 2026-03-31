import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeads, projects, growthActionsLog } from '@/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/marketing/leads
 * 
 * Query params:
 * - projectId: optional filter
 * - limit: default 50
 * - offset: default 0
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const scope = searchParams.get('scope');
    const ownerContext = searchParams.get('ownerContext');
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
    const offset = Number(searchParams.get('offset') || 0);

    const conditions: any[] = [];
    if (projectId && projectId !== 'all') {
      conditions.push(eq(marketingLeads.projectId, Number(projectId)));
      // If a specific project is chosen, we show its leads regardless of ownerContext
    } else if (ownerContext === 'pandora') {
      // THE ECOSYSTEM FILTER: Only Core Pandora projects
      const { inArray } = require('drizzle-orm');
      const coreProjectIds = await db
        .select({ id: projects.id })
        .from(projects)
        .where(inArray(projects.slug, ['pandoras_access', 'pbox_governance']));
      
      const ids = coreProjectIds.map(p => p.id);
      if (ids.length > 0) {
        conditions.push(inArray(marketingLeads.projectId, ids));
      } else {
        // Fallback to ID 1 if slugs not found
        conditions.push(eq(marketingLeads.projectId, 1));
      }
    } else if (ownerContext) {
      conditions.push(eq(marketingLeads.ownerContext, ownerContext as any));
    }

    if (scope) conditions.push(eq(marketingLeads.scope, scope as any));

    // Phase 90: Hide anonymous "ghost" leads (telemetry only) from the Growth OS overview
    const { isNotNull, or } = require('drizzle-orm');
    conditions.push(or(
      isNotNull(marketingLeads.email),
      isNotNull(marketingLeads.walletAddress)
    ));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        id: marketingLeads.id,
        email: marketingLeads.email,
        name: marketingLeads.name,
        status: marketingLeads.status,
        intent: marketingLeads.intent,
        score: marketingLeads.score,
        scope: marketingLeads.scope,
        ownerContext: marketingLeads.ownerContext,
        metadata: marketingLeads.metadata,
        identityId: marketingLeads.identityId,
        quality: marketingLeads.quality,
        phoneNumber: marketingLeads.phoneNumber,
        walletAddress: marketingLeads.walletAddress,
        origin: marketingLeads.origin,
        createdAt: marketingLeads.createdAt,
        updatedAt: marketingLeads.updatedAt,
        projectName: projects.title
      })
      .from(marketingLeads)
      .leftJoin(projects, eq(marketingLeads.projectId, projects.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(marketingLeads.createdAt));

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(marketingLeads)
      .where(whereClause);

    const { calculateDecayedScore, classifyIntent } = await import("@/lib/marketing/growth-engine/engine");

    // Enhancement: Fetch latest growth action & Calculate Elite Metrics
    const dataWithActions = await Promise.all(data.map(async (l) => {
      const lastAction = await db.query.growthActionsLog.findFirst({
        where: eq(growthActionsLog.leadId, l.id),
        orderBy: (logs, { desc }) => [desc(logs.executedAt)]
      });

      const lastUpdateDate = (l.updatedAt as any) || l.createdAt;
      const baseIntent = classifyIntent(l.score || 0, l.status as any);
      
      const processedScore = calculateDecayedScore(
        l.score || 0, 
        lastUpdateDate
      );

      return {
        ...l,
        lastAction: lastAction?.actionType || null,
        decayedScore: processedScore,
        intentBucket: baseIntent
      };
    }));

    return NextResponse.json({
      success: true,
      data: dataWithActions,
      pagination: {
        total: Number(totalCount[0]?.count || 0),
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('❌ Admin Leads API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
