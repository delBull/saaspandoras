import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { db } from '@/db';
import { eq, and, gt, inArray } from 'drizzle-orm';
import { marketingLeads, projectCollaborators, projects } from '@/db/schema';

export async function GET(req: Request) {
  try {
    const authCtx = await getNexusAuthContext();
    
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require specific read capability (fallback to growth.manage if read doesn't exist)
    if (!authCtx.permissions['growth.manage']) {
      return NextResponse.json({ error: 'Forbidden. Requires growth capability.' }, { status: 403 });
    }

    // 1. Derive scope from the collaborator's assigned projects (Zero-Trust)
    // TMA clients CANNOT pass a projectId to query arbitrary leads.
    const assignedProjects = await db.select({
      projectId: projects.id,
      slug: projects.slug
    })
    .from(projectCollaborators)
    .innerJoin(projects, eq(projects.slug, projectCollaborators.projectId))
    .where(eq(projectCollaborators.collaboratorId, authCtx.collaboratorId));

    if (assignedProjects.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const authorizedProjectIds = assignedProjects.map(p => p.projectId);

    // 2. Fetch "Recent Leads" (created in the last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentLeads = await db.query.marketingLeads.findMany({
      where: and(
        inArray(marketingLeads.projectId, authorizedProjectIds),
        gt(marketingLeads.createdAt, twentyFourHoursAgo),
        eq(marketingLeads.status, 'active')
      ),
      orderBy: (leads, { desc }) => [desc(leads.createdAt)],
      limit: 50
    });

    const items = recentLeads.map(lead => ({
      id: lead.id,
      name: lead.name || lead.email || lead.phoneNumber || 'Anonymous Lead',
      intent: lead.intent,
      status: lead.status,
      createdAt: lead.createdAt
    }));

    return NextResponse.json({ items });
    
  } catch (error) {
    console.error('[NexusGrowthLeadsAPI] Error fetching recent leads:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
