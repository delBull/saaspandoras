import { db } from '@/db';
import { 
  projects, hermesJourneys, hermesConversationMessages, 
  hermesClaimContracts, installedProducts,
  daoMembers, operationalIntents, hermesAddonInstallations
} from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { CanonicalAuthSession } from '@/lib/hermes/auth/canonical-resolver';
import type { SystemStatus, HermesOverviewView, ActivityEventView } from '@/lib/portal/portal-types';
import { GetKnowledgeOverviewQuery } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';

export class HermesOverviewService {
  /**
   * Generates the deterministic Hermes overview from the Canonical Session context.
   */
  public static async getOverview(session: CanonicalAuthSession): Promise<{ overview: HermesOverviewView, organizationName: string }> {
    const { canonicalOrgId, projectSlug } = session;

    // 1. Fetch Project Identity (Canonical)
    const [project] = await db.select().from(projects).where(eq(projects.organizationId, canonicalOrgId)).limit(1);
    const orgName = project?.title || projectSlug;

    // 2. Fetch Active Journeys (Execution context)
    const journeyRows = await db
      .select()
      .from(hermesJourneys)
      .where(eq(hermesJourneys.organizationId, canonicalOrgId));
    
    const activeJourneysCount = journeyRows.filter(j => j.status === 'ACTIVE').length;
    const activeJourneysFirst = journeyRows.find(j => j.status === 'ACTIVE');
    const dynamicJourneysStatus: SystemStatus = activeJourneysCount > 0 ? 'READY' : (journeyRows.length > 0 ? 'DEGRADED' : 'NOT_CONFIGURED');

    // 3. Channels Status
    let dynamicChannelsStatus: SystemStatus = 'NOT_CONFIGURED';
    let connectedChannels = 0;
    if (project) {
      const config = (project.tenantRuntimeConfig as any) || {};
      const secrets = config.secrets || {};
      if (secrets.telegramBotToken) connectedChannels++;
      if (secrets.whatsappToken) connectedChannels++;
      if (secrets.discordWebhookUrl) connectedChannels++;
      if (secrets.slackWebhookUrl) connectedChannels++;
      if (connectedChannels > 0) dynamicChannelsStatus = 'READY';
    }

    // 4. Knowledge Health
    const cpCtx = new ControlPlaneContext(
      'session_default',
      'system',
      'owner' as any,
      ['view_overview'] as any,
      [{ organizationId: canonicalOrgId, role: 'owner' as any }]
    );
    let knowledgeHealth: SystemStatus = 'NOT_CONFIGURED';
    try {
      const knowledgeQuery = new GetKnowledgeOverviewQuery();
      const kOverview = await knowledgeQuery.execute(cpCtx, canonicalOrgId);
      knowledgeHealth = kOverview.knowledgeHealth === 'EMPTY' ? 'NOT_CONFIGURED' : kOverview.knowledgeHealth as SystemStatus;
    } catch {}

    // 5. Governance Health (Deterministic)
    // READY if there's an ACTIVE hermesClaimContract assigned to canonicalOrgId
    const activeContracts = await db.select().from(hermesClaimContracts).where(
      and(
        eq(hermesClaimContracts.tenantId, canonicalOrgId),
        eq(hermesClaimContracts.governanceStatus, 'ACTIVE')
      )
    ).limit(1);
    const governanceHealth: SystemStatus = activeContracts.length > 0 ? 'READY' : 'NOT_CONFIGURED';

    // 6. Execution Health (Deterministic)
    // READY if there is at least one installed product or addon active.
    const installed = await db.select().from(installedProducts).where(
      and(
        eq(installedProducts.projectId, project?.id as number),
        eq(installedProducts.status, 'ACTIVE')
      )
    ).limit(1);
    const executionHealth: SystemStatus = installed.length > 0 ? 'READY' : 'NOT_CONFIGURED';

    // 7. Identity Health (Deterministic)
    let identityHealth: SystemStatus = 'NOT_CONFIGURED';
    if (project) {
      const [membersCount] = await db.select({ val: sql<number>`count(*)` }).from(daoMembers).where(eq(daoMembers.projectId, project.id));
      identityHealth = Number(membersCount?.val || 0) > 0 ? 'READY' : 'DEGRADED';
    }

    // 8. Active Conversations Count (Deterministic)
    // "activeConversation = exists, belongs to org, lastActivity >= 30 days"
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [convCountRes] = await db.select({
      count: sql<number>`count(distinct ${hermesConversationMessages.conversationId})`
    }).from(hermesConversationMessages)
    .where(
      and(
        eq(hermesConversationMessages.organizationId, canonicalOrgId),
        sql`${hermesConversationMessages.createdAt} >= ${THIRTY_DAYS_AGO}`
      )
    );
    const realActiveConversations = Number(convCountRes?.count || 0);

    // 9. Recent Activity Feed (Scoped strictly to canonicalOrgId)
    const messages = await db
      .select()
      .from(hermesConversationMessages)
      .where(eq(hermesConversationMessages.organizationId, canonicalOrgId))
      .orderBy(desc(hermesConversationMessages.createdAt))
      .limit(5);

    const recentActivities: ActivityEventView[] = messages.map(msg => ({
      id: msg.id,
      timestamp: msg.createdAt.toISOString(),
      type: msg.role === 'USER' ? 'MESSAGE_RECEIVED' : 'MESSAGE_SENT',
      description: msg.role === 'USER' ? `Mensaje de usuario: "${msg.content.slice(0, 40)}..."` : `Respuesta de agente (${msg.role})`,
      channel: 'web',
      status: 'SUCCESS',
    }));

    let strategicProgress: number | undefined = undefined;

    // 11. Cognitive & Decisions (Deterministic)
    const [cognitiveCount] = await db.select({ val: sql<number>`count(*)` }).from(hermesAddonInstallations).where(
      and(eq(hermesAddonInstallations.organizationId, canonicalOrgId), eq(hermesAddonInstallations.status, 'ACTIVE'))
    );
    const cognitiveHealth: SystemStatus = Number(cognitiveCount?.val || 0) > 0 ? 'READY' : 'NOT_CONFIGURED';

    const [intentsCountRes] = await db.select({ val: sql<number>`count(*)` }).from(operationalIntents).where(
      and(eq(operationalIntents.organizationId, canonicalOrgId), eq(operationalIntents.status, 'proposed'))
    );
    const pendingDecisions = Number(intentsCountRes?.val || 0);

    const overview: HermesOverviewView = {
      organization: {
        id: canonicalOrgId,
        name: orgName,
      },
      systemStatus: dynamicJourneysStatus === 'READY' ? 'READY' : 'NOT_CONFIGURED',
      journeyStatus: activeJourneysCount > 0 ? 'ACTIVE' : 'NOT_STARTED',
      system: {
        identity: identityHealth,
        knowledge: knowledgeHealth,
        channels: dynamicChannelsStatus,
        journeys: dynamicJourneysStatus,
        governance: governanceHealth,
        cognitive: cognitiveHealth,
        execution: executionHealth,
      },
      strategicActivity: {
        active: activeJourneysCount > 0,
        title: activeJourneysFirst?.name,
        stage: activeJourneysFirst?.status || 'UNKNOWN',
        progress: strategicProgress, // undefined -> UI should handle gracefully
      },
      metrics: {
        activeJourneys: activeJourneysCount,
        activeConversations: realActiveConversations,
        pendingDecisions,
        connectedChannels,
      },
      activity: recentActivities,
    };

    return { overview, organizationName: orgName };
  }
}
