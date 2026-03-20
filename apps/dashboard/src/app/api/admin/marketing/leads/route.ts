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
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
    const offset = Number(searchParams.get('offset') || 0);

    const whereClause = projectId ? eq(marketingLeads.projectId, Number(projectId)) : undefined;

    const data = await db
      .select({
        id: marketingLeads.id,
        email: marketingLeads.email,
        name: marketingLeads.name,
        status: marketingLeads.status,
        intent: marketingLeads.intent,
        score: marketingLeads.score,
        metadata: marketingLeads.metadata,
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
