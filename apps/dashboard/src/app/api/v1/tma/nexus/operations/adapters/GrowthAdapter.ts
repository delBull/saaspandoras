import { db } from '@/db';
import { eq, and, gt } from 'drizzle-orm';
import { marketingLeads, projects } from '@/db/schema';
import { DomainAdapter, NexusOperation } from './DomainAdapter';
import { NexusAuthContext, checkNexusPermission } from '@/lib/nexus/nexus-rbac';

export class GrowthAdapter implements DomainAdapter {
  async getOperations(authCtx: NexusAuthContext): Promise<NexusOperation[]> {
    if (!authCtx.canonicalOrgId) return [];

    if (!checkNexusPermission(authCtx, 'growth.manage')) {
      return [];
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Resolve canonicalOrgId (slug) to projects.id
    const [project] = await db.query.projects.findMany({
      where: eq(projects.slug, authCtx.canonicalOrgId),
      limit: 1
    });

    if (!project) return [];

    const leads = await db.query.marketingLeads.findMany({
      where: and(
        eq(marketingLeads.projectId, project.id),
        gt(marketingLeads.createdAt, twentyFourHoursAgo),
        eq(marketingLeads.status, 'active')
      ),
      orderBy: (l, { desc }) => [desc(l.createdAt)],
      limit: 50
    });

    return leads.map(lead => ({
      id: `lead_${lead.id}`,
      type: 'ALERT', 
      priority: 'NORMAL',
      domain: 'GROWTH',
      title: `New Lead: ${lead.name || lead.email || lead.phoneNumber || 'Anonymous'}`,
      description: `Intent: ${lead.intent || 'Unknown'}`,
      status: lead.status || 'active',
      requiredCapability: 'growth.manage',
      visibility: 'ORG',
      createdAt: lead.createdAt,
      actions: [
        { label: 'View CRM', action: 'VIEW_CRM', intent: 'secondary' }
      ]
    }));
  }
}
