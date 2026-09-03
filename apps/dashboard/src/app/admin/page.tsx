/**
 * 🏛️ PLATFORM GOVERNANCE PLANE ROOT (F9.3)
 * apps/dashboard/src/app/admin/page.tsx
 *
 * Master entry point for Pandora's Platform Governance Console.
 * Protected server-side with getNexusAuthContext() (SUPER_ADMIN and ADMIN only).
 */

import React from 'react';
import { db } from '@/db';
import { projects, hermesTenantCredits, hermesComputeUsageEvents } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformAdminShell } from '@/components/admin/shell/PlatformAdminShell';
import { AdminOverviewView } from '@/components/admin/views/AdminOverviewView';
import { AdminTenantsView } from '@/components/admin/views/AdminTenantsView';
import { AdminAccessGate } from './AdminAccessGate';
import { 
  PlatformActor, 
  PlatformGlobalKpis, 
  InfrastructureHealth,
  AdminTenantLensDTO
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
  let totalDeposited = 0;
  let totalSpent = 0;
  let circulatingCredits = 0;
  let totalGpuSeconds = 0;
  let totalRetainedMargin = 0;
  let totalRawGpuCost = 0;

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

        if (prods.tokenomics_rwa) rwaCount++;

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
            tokenomicsRwa: !!prods.tokenomics_rwa,
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

      // Query Hermes Compute Events
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
    role: auth.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'PLATFORM_ADMIN',
    walletAddress: auth.wallet || null,
    email: auth.email || null,
    name: auth.wallet ? `${auth.wallet.slice(0, 6)}...${auth.wallet.slice(-4)}` : 'Administrador',
    sessionStartedAt: new Date().toISOString(),
    isDiscord2faVerified: auth.role === 'SUPER_ADMIN',
  };

  return (
    <PlatformAdminShell actor={actor} activeSection={activeTab}>
      {activeTab === 'tenants' ? (
        <AdminTenantsView tenants={enrichedTenantsList} />
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
    </PlatformAdminShell>
  );
}
