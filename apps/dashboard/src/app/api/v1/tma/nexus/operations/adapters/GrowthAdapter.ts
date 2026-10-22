import { db } from '@saasfly/db';
import { eq, and, gt } from "@saasfly/db-core";
import { marketingLeads, projects, nexusCampaignProposals, nexusActionRequests } from '@saasfly/db/schema';
import type { DomainAdapter, NexusOperation } from './DomainAdapter';
import type { NexusAuthContext } from '@saasfly/shared';
import { checkNexusPermission } from '@saasfly/shared';

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
      title: `New Lead: ${lead.name ?? lead.email ?? lead.phoneNumber ?? 'Anonymous'}`,
      description: `Intent: ${lead.intent ?? 'Unknown'}`,
      status: lead.status ?? 'active',
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

    // 3. Fetch Pending Trial Activation Requests
    const isHqAdmin = authCtx.role === 'SUPER_ADMIN' || authCtx.role === 'ADMIN' || authCtx.canonicalOrgId === 'pandoras';
    const trialWhere = and(
      eq(nexusActionRequests.status, 'PENDING'),
      eq(nexusActionRequests.actionType, 'TENANT_TRIAL_READY_APPROVE'),
      gt(nexusActionRequests.expiresAt, new Date()),
      isHqAdmin
        ? undefined
        : eq(nexusActionRequests.canonicalOrgId, authCtx.canonicalOrgId)
    );

    const trialRequests = await db.query.nexusActionRequests.findMany({
      where: trialWhere,
      limit: 10,
    });

    const trialOps: NexusOperation[] = trialRequests.map((r) => {
      const p = (r.payload as Record<string, unknown>) ?? {};
      const orgName = typeof p.organizationName === 'string' ? p.organizationName : (r.targetResource ?? 'Organization');
      const readiness = typeof p.readinessPercent === 'number' ? p.readinessPercent : 25;
      return {
        id: r.actionToken,
        type: 'DECISION',
        priority: 'CRITICAL',
        domain: 'GROWTH',
        title: `Activar Prueba 3 Días: ${orgName}`,
        description: `Readiness al ${readiness}%. Inicia prueba gratuita de 72 horas para ${r.canonicalOrgId ?? 'tenant'}.`,
        status: r.status,
        requiredCapability: 'growth.manage',
        visibility: r.actorIdentityId ? 'ASSIGNED' : 'TEAM',
        assigneeId: r.actorIdentityId,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        actions: [
          { label: '🚀 Iniciar Prueba (72h)', action: 'ACTIVATE_TRIAL', intent: 'primary' },
          { label: 'Posponer', action: 'DISMISS', intent: 'secondary' },
        ],
        payload: { ...p, organizationSlug: r.targetResource },
      };
    });

    return [...trialOps, ...campaignOps, ...leadOps];
  }
}
