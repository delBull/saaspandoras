/**
 * 🛰️ Growth OS API Boundary — Overview Service
 * /api/v1/growth/overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, installedProducts, marketingLeads, operationalIntents } from '@/db/schema';
import { eq, or, and, count } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { isWalletAuthorizedForTenant } from '@/lib/hermes/auth/wallet-tenant-membership';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import { getTreasuryBalances, isDeployedContract } from '@/lib/growth/treasury-onchain';
import type { GrowthOverviewDTO } from '@/lib/dash-contracts/growth';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

async function resolveTenant(req: NextRequest, requestedOrg?: string | null): Promise<{
  organizationId: string;
  organizationSlug: string;
  projectId?: number;
} | null> {
  const cleanSlug = requestedOrg ? requestedOrg.replace(/^org_/, '').trim() : '';
  if (!cleanSlug) return null;

  // 1. Portal Session Cookie
  const portalCookie = req.cookies.get('pandoras_portal_session')?.value;
  if (portalCookie) {
    const session = await validatePortalSession(portalCookie);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        if (cleanSlug !== org.slug && cleanSlug !== org.organizationId) {
          return null;
        }
        return {
          organizationId: org.organizationId,
          organizationSlug: org.slug,
          projectId: session.projectId,
        };
      }
    }
  }

  // 2. Web Wallet Session — Validated against Tenant Membership (Anti-IDOR)
  const incomingWallet = req.headers.get('x-wallet-address')?.toLowerCase() ||
    req.cookies.get('wallet-address')?.value?.toLowerCase() ||
    req.cookies.get('thirdweb:wallet-address')?.value?.toLowerCase();

  if (incomingWallet) {
    const isAuth = await isWalletAuthorizedForTenant(incomingWallet, cleanSlug);
    if (isAuth) {
      return {
        organizationId: requestedOrg || `org_${cleanSlug}`,
        organizationSlug: cleanSlug,
      };
    }
  }

  const auth = await getAuth();
  if (auth.isVerified && auth.session?.address) {
    const isAuth = await isWalletAuthorizedForTenant(auth.session.address, cleanSlug);
    if (!isAuth) {
      return null; // IDOR blocked
    }
    return {
      organizationId: requestedOrg || `org_${cleanSlug}`,
      organizationSlug: cleanSlug,
    };
  }

  // 3. Bearer Token
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerToken) {
    try {
      const payload = sessionTokenService.verifyToken(bearerToken);
      const tenant = payload.organizationId.toLowerCase().replace(/^org_/, '');
      if (cleanSlug !== tenant && cleanSlug !== payload.organizationId) {
        return null;
      }
      return {
        organizationId: payload.organizationId,
        organizationSlug: tenant,
      };
    } catch {
      return null;
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`growth-overview-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const orgParam = searchParams.get('organizationId') || '';
    const cleanSlug = orgParam.replace(/^org_/, '').trim();

    const auth = await resolveTenant(req, orgParam);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Authentication required.' }, { status: 401 });
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(or(eq(projects.slug, cleanSlug), eq(projects.slug, orgParam)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Organization not found' }, { status: 404 });
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
      .where(
        or(
          eq(operationalIntents.organizationId, orgParam),
          eq(operationalIntents.organizationId, `org_${cleanSlug}`),
          eq(operationalIntents.organizationId, cleanSlug)
        )
      );
    const realIntentsCount = intentsCountRes?.val ?? 0;

    const profile = await capabilityRegistry.getTenantProfile(orgParam || `org_${cleanSlug}`);
    const enabledKeys = profile.capabilities.filter((c) => c.enabled).map((c) => c.key);

    const treasury = await getTreasuryBalances(project);
    const treasuryValue = treasury
      ? `$${treasury.balanceUsdc.toLocaleString()} USDC`
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
      organizationId: auth.organizationId,
      organizationName: project.title || cleanSlug.toUpperCase(),
      organizationSlug: cleanSlug,
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
          href: `/growth-os/organizations/${cleanSlug}/pipeline`,
          capability: 'growth.crm',
          iconName: 'Users',
        },
        {
          id: 'qa_new_campaign',
          label: 'Email Templates',
          href: `/growth-os/organizations/${cleanSlug}/email`,
          capability: 'growth.email',
          iconName: 'Mail',
        },
        {
          id: 'qa_governance',
          label: 'Governance Center',
          href: `/growth-os/organizations/${cleanSlug}/governance`,
          capability: 'growth.governance',
          iconName: 'ShieldCheck',
        },
        {
          id: 'qa_mint_nft',
          label: 'NFT Lab & Passes',
          href: `/growth-os/organizations/${cleanSlug}/nft-lab`,
          capability: 'growth.nft',
          iconName: 'Sparkles',
        },
      ],
      // No synthetic activity: the feed remains empty until a real event source
      // is connected for this tenant.
      recentActivities: [],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Growth API: overview GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
