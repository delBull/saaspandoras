import { db } from '@/db';
import { eq, and, gt } from 'drizzle-orm';
import { marketingLeads, projects, nexusCampaignProposals } from '@/db/schema';
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

    const leads = project ? await db.query.marketingLeads.findMany({
      where: and(
        eq(marketingLeads.projectId, project.id),
        gt(marketingLeads.createdAt, twentyFourHoursAgo),
        eq(marketingLeads.status, 'active')
      ),
      orderBy: (l, { desc }) => [desc(l.createdAt)],
      limit: 10
    }) : [];

    const leadOps: NexusOperation[] = leads.map(lead => ({
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

    // 2. Fetch Pending Campaign Proposals
    const campaigns = await db.query.nexusCampaignProposals.findMany({
      where: and(
        eq(nexusCampaignProposals.canonicalOrgId, authCtx.canonicalOrgId),
        eq(nexusCampaignProposals.status, 'PROPOSED')
      ),
      orderBy: (c, { asc }) => [asc(c.createdAt)],
      limit: 20
    });

    const campaignOps: NexusOperation[] = campaigns.map(c => ({
      id: c.id,
      type: 'DECISION',
      priority: 'HIGH',
      domain: 'GROWTH',
      title: `Autorizar: ${c.name}`,
      description: `Objetivo: ${c.objective} | Contenidos: ${c.piecesCount} | Canales: ${c.channels.join(', ')}`,
      status: c.status,
      requiredCapability: 'growth.manage',
      visibility: 'ORG',
      createdAt: c.createdAt,
      actions: [
        { label: '✓ Aprobar y Distribuir', action: 'CAMPAIGN_AUTHORIZE', intent: 'primary' },
        { label: '✗ Rechazar', action: 'CAMPAIGN_REJECT', intent: 'danger' }
      ]
    }));

    return [...campaignOps, ...leadOps];
  }
}
