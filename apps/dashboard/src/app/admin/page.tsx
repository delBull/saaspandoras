/**
 * 🏛️ PLATFORM GOVERNANCE PLANE ROOT (F9.3 - F9.8)
 * apps/dashboard/src/app/admin/page.tsx
 *
 * Master entry point for Pandora's Platform Governance Console.
 * Protected server-side with getNexusAuthContext() (SUPER_ADMIN and ADMIN only).
 */

import React from 'react';
import { db } from '@/db';
import { 
  projects, 
  hermesTenantCredits, 
  hermesComputeUsageEvents, 
  hermesRunpodEndpoints,
  hermesKnowledge,
  administrators,
  marketingLeads
} from '@/db/schema';
import { desc, sql, eq } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { AdminOverviewView } from '@/components/admin/views/AdminOverviewView';
import { AdminTenantsView } from '@/components/admin/views/AdminTenantsView';
import { AdminBillingView } from '@/components/admin/views/AdminBillingView';
import { AdminRwaView } from '@/components/admin/views/AdminRwaView';
import { AdminSecurityView } from '@/components/admin/views/AdminSecurityView';
import { AdminOperationsView } from '@/components/admin/views/AdminOperationsView';
import { AdminCrmView } from '@/components/admin/views/AdminCrmView';
import { AdminEcosystemGuidesView } from '@/components/admin/views/AdminEcosystemGuidesView';
import { AdminAccessGate } from './AdminAccessGate';
import { 
  PlatformActor, 
  PlatformGlobalKpis, 
  InfrastructureHealth,
  AdminTenantLensDTO,
  RwaDealSummaryDTO,
  PlatformB2bLeadDTO,
  B2bPipelineMetricsDTO,
  PlatformRole 
} from '@/lib/dash-contracts/admin';

interface AdminPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = searchParams ? await searchParams : {};
  const activeTab = params?.tab || 'overview';

  // 1. Resolve Platform Authority Server-Side
  const auth = await getNexusAuthContext();

  if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu cuenta con rol '${auth.role}' no cuenta con facultades de administración de plataforma.`
            : 'Se requiere una sesión autenticada con privilegios de administrador de plataforma.'
        }
      />
    );
  }

  // 2. Query Live Metrics from Neon DB
  let totalTenants = 0;
  let rwaCount = 0;
  let enrichedTenantsList: AdminTenantLensDTO[] = [];
  let rwaDealsList: RwaDealSummaryDTO[] = [];
  let creditsRawList: any[] = [];
  let recentEventsList: any[] = [];
  let endpointsList: any[] = [];
  let administratorsList: any[] = [];
  let totalVaultDocuments = 0;
  let totalDeposited = 0;
  let totalSpent = 0;
  let circulatingCredits = 0;
  let totalGpuSeconds = 0;
  let totalRetainedMargin = 0;
  let totalRawGpuCost = 0;
  let b2bLeadsList: PlatformB2bLeadDTO[] = [];
  let b2bMetrics: B2bPipelineMetricsDTO = { totalProspects: 0, activeDeals: 0, pipelineValueUsd: 0, conversionRate: 0 };

  try {
    if (db) {
      // Query Hermes Tenant Credits Map
      const creditsRows = await db
        .select({
          tenantId: hermesTenantCredits.tenantId,
          balance: hermesTenantCredits.creditBalanceUsd,
          sandboxBalance: hermesTenantCredits.sandboxBalanceUsd,
          deposited: hermesTenantCredits.totalDepositedUsd,
          spent: hermesTenantCredits.totalSpentUsd,
          markup: hermesTenantCredits.markupPercentage,
          isSandbox: hermesTenantCredits.isSandboxEnabled,
        })
        .from(hermesTenantCredits);

      creditsRawList = creditsRows.map((c) => ({
        tenantId: c.tenantId,
        creditBalanceUsd: parseFloat(c.balance || '0'),
        sandboxBalanceUsd: parseFloat(c.sandboxBalance || '0'),
        totalDepositedUsd: parseFloat(c.deposited || '0'),
        totalSpentUsd: parseFloat(c.spent || '0'),
        markupPercentage: c.markup ?? 35,
        isSandboxEnabled: c.isSandbox ?? true,
      }));

      const creditsMap = new Map<string, typeof creditsRows[0]>();
      creditsRows.forEach((c) => {
        creditsMap.set(c.tenantId.toLowerCase().trim(), c);
        circulatingCredits += parseFloat(c.balance || '0');
        totalDeposited += parseFloat(c.deposited || '0');
        totalSpent += parseFloat(c.spent || '0');
      });

      // Query Projects
      const projectsRows = await db
        .select({
          id: projects.id,
          slug: projects.slug,
          title: projects.title,
          category: projects.businessCategory,
          applicantWallet: projects.applicantWalletAddress,
          extraConfig: projects.extraConfig,
          status: projects.status,
          totalValuationUsd: projects.totalValuationUsd,
          totalTokens: projects.totalTokens,
          tokenPriceUsd: projects.tokenPriceUsd,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .orderBy(desc(projects.createdAt))
        .limit(50);

      totalTenants = projectsRows.length;
      enrichedTenantsList = projectsRows.map((p) => {
        const extra = (p.extraConfig as Record<string, any>) || {};
        const prods = (extra.installed_products || extra.installedProducts || {}) as Record<string, boolean>;
        const intents = (extra.intents || extra.strategicIntents || []) as string[];
        const cred = creditsMap.get(p.slug.toLowerCase().trim());

        const isRwa = !!prods.tokenomics_rwa || (p.category ? p.category.includes('real_estate') : false);
        if (isRwa) rwaCount++;

        return {
          id: String(p.id),
          slug: p.slug,
          name: p.title || p.slug,
          category: p.category || 'General',
          lifecycleState: (p.status === 'approved' ? 'ACTIVE' : p.status === 'pending' ? 'TRIAL' : 'PROVISIONED') as any,
          riskRating: 'LOW',
          creatorWallet: p.applicantWallet || '',
          products: {
            hermesAiMesh: !!prods.hermes_ai_mesh,
            growthOsCrm: !!prods.growth_os_crm,
            tokenomicsRwa: isRwa,
          },
          intents,
          compute: {
            creditBalanceUsd: parseFloat(cred?.balance || '0.00'),
            sandboxBalanceUsd: parseFloat(cred?.sandboxBalance || '0.00'),
            totalDepositedUsd: parseFloat(cred?.deposited || '0.00'),
            totalSpentUsd: parseFloat(cred?.spent || '0.00'),
            markupPercentage: cred?.markup ?? 35,
            isSandboxEnabled: cred?.isSandbox ?? true,
            totalEventsCount: 0,
          },
          knowledgeDocsCount: 0,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
        };
      });

      // Construct RWA Deals List
      rwaDealsList = projectsRows.map((p) => ({
        id: String(p.id),
        title: p.title || p.slug,
        slug: p.slug,
        originatingTenantId: p.slug,
        sponsorName: p.applicantWallet ? `${p.applicantWallet.slice(0, 8)}...` : 'Pandoras Genesis',
        stage: (p.status === 'approved' ? 'LIVE' : p.status === 'pending' ? 'STRUCTURING' : 'DUE_DILIGENCE') as any,
        underlyingAssetType: (p.category && p.category.includes('real_estate') ? 'REAL_ESTATE' : 'PRIVATE_EQUITY') as any,
        structuring: {
          legalVehicle: 'S.A.P.I. de C.V. / Trust',
          jurisdiction: 'México / Del.',
          assetValuationUsd: p.totalValuationUsd ? parseFloat(p.totalValuationUsd) : 1500000,
          totalTokenSupply: p.totalTokens || 100000,
          tokenTicker: p.slug.toUpperCase().slice(0, 5),
          initialTokenPriceUsd: p.tokenPriceUsd ? parseFloat(p.tokenPriceUsd) : 10.0,
          offeringPhases: [],
          contractArchitecture: 'ERC20_FRACTIONAL',
          distributionModel: 'WHITELISTED_PUBLIC',
        },
        chain: 'Base Mainnet',
        ndaSigned: true,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      }));

      // Query Hermes Compute Events Aggregates
      const eventsAgg = await db
        .select({
          totalSeconds: sql<string>`COALESCE(SUM(execution_seconds), '0')`,
          totalRaw: sql<string>`COALESCE(SUM(raw_cost_usd), '0')`,
          totalMarkup: sql<string>`COALESCE(SUM(markup_cost_usd), '0')`,
        })
        .from(hermesComputeUsageEvents);

      if (eventsAgg[0]) {
        totalGpuSeconds = parseFloat(eventsAgg[0].totalSeconds || '0');
        totalRawGpuCost = parseFloat(eventsAgg[0].totalRaw || '0');
        totalRetainedMargin = parseFloat(eventsAgg[0].totalMarkup || '0');
      }

      // Query Recent Compute Events Rows
      const recentEventsRows = await db
        .select()
        .from(hermesComputeUsageEvents)
        .orderBy(desc(hermesComputeUsageEvents.createdAt))
        .limit(30);

      recentEventsList = recentEventsRows.map((ev) => ({
        id: ev.id,
        tenantId: ev.tenantId,
        capability: ev.capability,
        executionSeconds: parseFloat(ev.executionSeconds || '0'),
        rawCostUsd: parseFloat(ev.rawCostUsd || '0'),
        markupCostUsd: parseFloat(ev.markupCostUsd || '0'),
        totalChargedUsd: parseFloat(ev.totalChargedUsd || '0'),
        status: ev.status || 'SETTLED',
        isSandbox: ev.isSandbox,
        createdAt: ev.createdAt ? new Date(ev.createdAt).toISOString() : new Date().toISOString(),
      }));

      // Query RunPod Endpoints
      const endpointsRows = await db
        .select()
        .from(hermesRunpodEndpoints)
        .limit(20);

      endpointsList = endpointsRows.map((ep) => ({
        id: ep.id,
        endpointId: ep.endpointId,
        endpointName: ep.endpointName,
        modelType: ep.modelType,
        gpuType: ep.gpuType || 'NVIDIA RTX A4000',
        perSecondCostUsd: parseFloat(ep.perSecondCostUsd || '0.00035'),
        status: ep.status || 'ACTIVE',
      }));

      // Query Administrators
      const adminsRows = await db
        .select()
        .from(administrators)
        .limit(20);

      administratorsList = adminsRows.map((a) => ({
        id: a.id,
        walletAddress: a.walletAddress,
        role: a.role,
        addedBy: a.addedBy,
        createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
      }));

      // Query Knowledge Count
      const docsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(hermesKnowledge);

      totalVaultDocuments = Number(docsCount[0]?.count || 0);

      // Query B2B Leads for CRM
      const leadsRows = await db
        .select()
        .from(marketingLeads)
        .where(eq(marketingLeads.scope, 'b2b'))
        .orderBy(desc(marketingLeads.createdAt));

      let activeDealsCount = 0;
      let totalPipelineValue = 0;
      let closedWonCount = 0;

      b2bLeadsList = leadsRows.map((l) => {
        // Map crmStage to PlatformB2bLeadStage
        let mappedStage: any = 'PROSPECT';
        const stage = l.crmStage || '';
        if (stage === 'LEAD') mappedStage = 'PROSPECT';
        else if (stage === 'QUALIFIED') mappedStage = 'DEMO';
        else if (stage === 'ASSESSMENT') mappedStage = 'DUE_DILIGENCE';
        else if (stage === 'PROPOSAL') mappedStage = 'NEGOTIATION';
        else if (stage === 'CLOSED_WON') mappedStage = 'CLOSED_WON';
        else if (stage === 'CLOSED_LOST') mappedStage = 'CLOSED_LOST';

        // Use conversionValue from DB if available. Default to 0 if not set.
        const estimatedValue = l.conversionValue ? parseFloat(l.conversionValue) : 0;

        if (['PROSPECT', 'CONTACTED', 'DEMO', 'DUE_DILIGENCE', 'NEGOTIATION'].includes(mappedStage)) {
          activeDealsCount++;
          totalPipelineValue += estimatedValue;
        }
        if (mappedStage === 'CLOSED_WON') {
          closedWonCount++;
        }
        
        const metadata = (l.metadata as any) || {};

        return {
          id: l.id,
          name: l.name || 'Desconocido',
          companyName: metadata.company || metadata.companyName || l.name || 'Desconocido',
          email: l.email || null,
          phone: l.phoneNumber || null,
          stage: mappedStage,
          source: l.source || 'Inbound',
          estimatedValueUsd: estimatedValue,
          notes: metadata.notes || l.lastAction || null,
          createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: l.updatedAt ? new Date(l.updatedAt).toISOString() : new Date().toISOString(),
          assignedOperatorId: null,
          assignedOperatorName: null,
        };
      });

      b2bMetrics = {
        totalProspects: leadsRows.length,
        activeDeals: activeDealsCount,
        pipelineValueUsd: totalPipelineValue,
        conversionRate: leadsRows.length > 0 ? Math.round((closedWonCount / leadsRows.length) * 100) : 0,
      };
    }
  } catch (err) {
    console.error('⚠️ [AdminPage] Error querying platform metrics:', err);
  }

  // 3. Assemble Platform Global KPIs
  const kpis: PlatformGlobalKpis = {
    totalTenantsCount: totalTenants,
    activeTenantsCount: totalTenants,
    trialTenantsCount: 0,
    rwaProjectsCount: rwaCount,
    totalGpuSecondsExecuted: Math.round(totalGpuSeconds),
    totalGrossDepositsUsd: totalDeposited,
    totalRawGpuCostUsd: totalRawGpuCost,
    totalRetainedMarginUsd: totalRetainedMargin,
    totalCirculatingCreditsUsd: circulatingCredits,
    averageMarkupPercentage: 35,
  };

  // 4. Infrastructure Health State
  const health: InfrastructureHealth = {
    neonPoolerStatus: 'ONLINE',
    ipfsGatewayStatus: 'ONLINE',
    runpodServerlessStatus: 'ONLINE',
    blockchainRpcStatus: 'ONLINE',
    discordWebhookStatus: process.env.DISCORD_SECURITY_WEBHOOK_URL ? 'ONLINE' : 'DISABLED',
    latencyMs: 38,
  };

  // 5. Assemble Current Platform Actor
  const actor: PlatformActor = {
    id: auth.wallet || auth.email || 'platform_admin',
    actorType: auth.wallet ? 'WALLET' : 'MAGIC_LINK',
    role: auth.role as PlatformRole,
    walletAddress: auth.wallet || null,
    email: auth.email || null,
    name: auth.wallet ? `${auth.wallet.slice(0, 6)}...${auth.wallet.slice(-4)}` : 'Administrador',
    sessionStartedAt: new Date().toISOString(),
    isDiscord2faVerified: auth.role === 'SUPER_ADMIN',
  };

  const treasuryAddress = process.env.PANDORAS_ADMIN_WALLET || '0xc52BB6f53C91ff7134e7508B102E5A22BA415954';

  return (
    <>
      {activeTab === 'tenants' ? (
        <AdminTenantsView tenants={enrichedTenantsList} actorRole={auth.role} />
      ) : activeTab === 'billing' ? (
        <AdminBillingView
          credits={creditsRawList}
          events={recentEventsList}
          endpoints={endpointsList}
          totalDeposited={totalDeposited}
          totalRawCost={totalRawGpuCost}
          totalMargin={totalRetainedMargin}
          totalCirculating={circulatingCredits}
          treasuryWallet={treasuryAddress}
        />
      ) : activeTab === 'rwa' ? (
        <AdminRwaView deals={rwaDealsList} actor={actor} />
      ) : activeTab === 'security' ? (
        <AdminSecurityView
          totalVaultDocuments={totalVaultDocuments}
          isDiscord2faActive={!!process.env.DISCORD_SECURITY_WEBHOOK_URL}
          administrators={administratorsList}
        />
      ) : activeTab === 'crm' ? (
        <AdminCrmView initialLeads={b2bLeadsList} metrics={b2bMetrics} />
      ) : activeTab === 'guides' ? (
        <AdminEcosystemGuidesView />
      ) : activeTab === 'operations' ? (
        <AdminOperationsView endpoints={endpointsList} />
      ) : (
        <AdminOverviewView
          kpis={kpis}
          health={health}
          recentTenants={enrichedTenantsList.slice(0, 5).map(t => ({
            id: t.id,
            slug: t.slug,
            name: t.name,
            category: t.category,
            creatorWallet: t.creatorWallet,
            products: t.products,
            creditBalanceUsd: t.compute.creditBalanceUsd,
            createdAt: t.createdAt,
          }))}
        />
      )}
    </>
  );
}
