import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeads, projects } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';

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

    const conditions = [];
    if (projectId && projectId !== 'all') conditions.push(eq(marketingLeads.projectId, Number(projectId)));
    if (scope) conditions.push(eq(marketingLeads.scope, scope as any));
    if (ownerContext) conditions.push(eq(marketingLeads.ownerContext, ownerContext as any));

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
        createdAt: marketingLeads.createdAt,
        projectName: projects.title
      })
      .from(marketingLeads)
      .leftJoin(projects, eq(marketingLeads.projectId, projects.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(marketingLeads.createdAt));

    const totalCount = await db
      .select({ count: marketingLeads.id })
      .from(marketingLeads)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: totalCount.length,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('❌ Admin Leads API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
