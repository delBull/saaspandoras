import { db } from '@saasfly/db';
import { projects, installedProducts, marketingLeads, operationalIntents, hermesEvents } from '@saasfly/db/schema';
import { eq, and, count, desc } from "@saasfly/db-core";
import { CanonicalAuthSession } from '@saasfly/hermes-core';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import { getTreasuryBalances, isDeployedContract } from '@/lib/growth/treasury-onchain';
import type { GrowthOverviewDTO } from '@saasfly/shared';

export class GrowthOverviewService {
  public static async getOverview(session: CanonicalAuthSession): Promise<GrowthOverviewDTO> {
    const { canonicalOrgId, projectSlug } = session;

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, canonicalOrgId))
      .limit(1);

    if (!project) {
      throw new Error('Project not found for canonical identity');
    }

    const hermesInstall = await db.query.installedProducts.findFirst({
      where: and(
        eq(installedProducts.projectId, project.id),
        eq(installedProducts.productFamily, 'HERMES')
      ),
    });

    // Real DB Count: Leads
    const [leadsCountRes] = await db
      .select({ val: count() })
      .from(marketingLeads)
      .where(eq(marketingLeads.projectId, project.id));
    const realLeadsCount = leadsCountRes?.val ?? 0;

    // Real DB Count: Operational Intents
    const [intentsCountRes] = await db
      .select({ val: count() })
      .from(operationalIntents)
      .where(eq(operationalIntents.organizationId, canonicalOrgId));
    const realIntentsCount = intentsCountRes?.val ?? 0;

    const profile = await capabilityRegistry.getTenantProfile(canonicalOrgId);
    const enabledKeys = profile.capabilities.filter((c) => c.enabled).map((c) => c.key);

    const treasury = await getTreasuryBalances(project);
    const treasuryValue = treasury
      ? `\$${treasury.balanceUsdc.toLocaleString()} USDC`
      : 'Sin Tesorería Configurada';
    const treasuryStatus = treasury?.source === 'onchain'
      ? 'LIVE'
      : treasury?.source === 'fallback'
      ? 'UNAVAILABLE'
      : 'NOT_CONFIGURED';

    const chainId = project.chainId || (process.env.NODE_ENV === 'production' ? 8453 : 11155111);
    const isNftDeployed = await isDeployedContract(project.contractAddress, chainId);
    const nftValue = isNftDeployed ? 'Contrato Verificado' : 'Sin Contrato Verificado';
    const nftStatus = isNftDeployed ? 'LIVE' : project.contractAddress ? 'UNAVAILABLE' : 'NOT_CONFIGURED';

    const response: GrowthOverviewDTO = {
      organizationId: canonicalOrgId,
      organizationName: project.title || projectSlug.toUpperCase(),
      organizationSlug: projectSlug,
      planTier: profile.planTier || 'Starter',
      hasHermes: Boolean(hermesInstall),
      enabledCapabilities: enabledKeys,
      metrics: [
        {
          id: 'metric_pipeline',
          title: 'Prospectos en Pipeline',
          value: realLeadsCount > 0 ? `${realLeadsCount} Leads` : '0 Leads',
          trend: realLeadsCount > 0 ? 'UP' : 'NEUTRAL',
          status: realLeadsCount > 0 ? 'DATABASE' : 'NOT_CONFIGURED',
          capability: 'growth.crm',
        },
        {
          id: 'metric_intents',
          title: 'Intenciones Gobernadas',
          value: realIntentsCount > 0 ? `${realIntentsCount} Intenciones` : '0 Intenciones',
          trend: 'NEUTRAL',
          status: realIntentsCount > 0 ? 'DATABASE' : 'NOT_CONFIGURED',
          capability: 'growth.governance',
        },
        {
          id: 'metric_treasury',
          title: 'Tesorería On-Chain',
          value: treasuryValue,
          trend: 'NEUTRAL',
          status: treasuryStatus,
          capability: 'growth.finance',
        },
        {
          id: 'metric_nfts',
          title: 'Colección Smart Pass',
          value: nftValue,
          trend: isNftDeployed ? 'UP' : 'NEUTRAL',
          status: nftStatus,
          capability: 'growth.nft',
        },
      ],
      quickActions: [
        {
          id: 'qa_new_lead',
          label: 'Ver Pipeline',
          href: `/growth-os/organizations/${projectSlug}/pipeline`,
          capability: 'growth.crm',
          iconName: 'Users',
        },
        {
          id: 'qa_new_campaign',
          label: 'Email Templates',
          href: `/growth-os/organizations/${projectSlug}/email`,
          capability: 'growth.email',
          iconName: 'Mail',
        },
        {
          id: 'qa_governance',
          label: 'Governance Center',
          href: `/growth-os/organizations/${projectSlug}/governance`,
          capability: 'growth.governance',
          iconName: 'ShieldCheck',
        },
        {
          id: 'qa_mint_nft',
          label: 'NFT Lab & Passes',
          href: `/growth-os/organizations/${projectSlug}/nft-lab`,
          capability: 'growth.nft',
          iconName: 'Sparkles',
        },
      ],
      recentActivities: [],
    };

    // Fetch Recent Hermes & Growth Events
    const recentDbEvents = await db.query.hermesEvents.findMany({
      where: eq(hermesEvents.tenantId, project.id),
      orderBy: [desc(hermesEvents.createdAt)],
      limit: 5,
    });

    response.recentActivities = recentDbEvents.map((evt) => ({
      id: evt.id,
      title: evt.eventType,
      description: (evt.payload as any)?.description || 'Actividad registrada por el Hermes Mesh Engine',
      timestamp: evt.createdAt.toISOString(),
      actor: (evt.payload as any)?.actor || 'Hermes Core',
      capability: 'growth.agents' as const,
    }));

    return response;
  }



  /**
   * Vigilance stream for the "Hermes Omnipresente" widget.
   * Real data: payment_inbox_events (pending/processed/failed) scoped to the
   * canonical org + the last hermesEvents. Honest empty state.
   */
  static async getHermesVigilance(organizationId: string): Promise<{
    pending: number;
    processedToday: number;
    failed: number;
    lastEvents: { id: string; description: string; timestamp: string; actor: string }[];
  }> {
    try {
      const { PaymentCoreService } = await import('@saasfly/hermes-core');
      return await PaymentCoreService.vigilanceSnapshot(organizationId);
    } catch (err: any) {
      console.warn('[GrowthOverviewService] Vigilance snapshot fallback:', err?.message);
      return { pending: 0, processedToday: 0, failed: 0, lastEvents: [] };
    }
  }
}

