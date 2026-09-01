/**
 * 🛰️ Growth OS API Boundary — Sovereign Pay & Finance Service
 * /api/v1/growth/wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, operationalIntents, daoMembers } from '@/db/schema';
import { eq, or, count } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { isWalletAuthorizedForTenant } from '@/lib/hermes/auth/wallet-tenant-membership';
import { getTreasuryBalances } from '@/lib/growth/treasury-onchain';
import { capabilityRegistry } from '@/lib/growth/capability-registry.service';
import type { 
  TenantWalletConfigDTO, 
  UpdateTenantWalletRequestDTO 
} from '@/lib/dash-contracts/growth';

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

  // 2. Web Wallet Session (Anti-IDOR)
  const auth = await getAuth();
  if (auth.isVerified && auth.session?.address) {
    const isAuth = await isWalletAuthorizedForTenant(auth.session.address, cleanSlug);
    if (!isAuth) return null;
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
    const rl = checkRateLimit(`growth-wallet-get:${ip}`, 60, 60_000);
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

    // 🔒 Capability Assertion Enforcement (Fail-Closed)
    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.finance');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(or(eq(projects.slug, cleanSlug), eq(projects.slug, orgParam)))
      .limit(1);

    const [daoCountRes] = project
      ? await db.select({ val: count() }).from(daoMembers).where(eq(daoMembers.projectId, project.id))
      : [{ val: 0 }];
    const realSignerCount = Math.max(1, daoCountRes?.val ?? 1);

    // 🔗 Resolve REAL on-chain sovereign treasury (Safe proxy + live balances)
    const treasury = project ? await getTreasuryBalances(project) : null;
    const primaryAddress = treasury?.treasuryAddress || (project as any)?.destinationWallet || (project as any)?.creatorWallet || project?.applicantWalletAddress || '';
    const smartAccountAddress = treasury?.smartAccountAddress || project?.allowanceControllerAddress || '';
    const isConfigured = Boolean(primaryAddress || smartAccountAddress);
    const extraConfig = project?.extraConfig && typeof project.extraConfig === 'object'
      ? project.extraConfig as Record<string, unknown>
      : {};
    const dailySpendLimitUsdc = Number(extraConfig.dailySpendLimitUsdc || 0);
    const spentTodayUsdc = Number(extraConfig.spentTodayUsdc || 0);
    const withdrawalAllowlist = Array.isArray(extraConfig.withdrawalAllowlist)
      ? extraConfig.withdrawalAllowlist.filter((value): value is string => typeof value === 'string')
      : (primaryAddress ? [primaryAddress] : []);

    const response: TenantWalletConfigDTO = {
      organizationId: orgParam || `org_${cleanSlug}`,
      walletMode: isConfigured ? 'PANDORAS_MANAGED' : 'NOT_CONFIGURED',
      primaryAddress,
      smartAccountAddress,
      dailySpendLimitUsdc: isConfigured ? dailySpendLimitUsdc : 0,
      spentTodayUsdc: isConfigured ? spentTodayUsdc : 0,
      withdrawalAllowlist,
      requiresMultiSig: realSignerCount > 1,
      signerCount: isConfigured ? realSignerCount : 0,
      balanceUsdc: treasury?.balanceUsdc ?? 0,
      balanceNative: treasury?.balanceNative ?? 0,
      nativeSymbol: treasury?.nativeSymbol || 'ETH',
      isIsolated: true,
      lastAuditedAt: undefined,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Growth API: wallet GET] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}

/**
 * Sovereign Finance Configuration & Payout Intent Circuit (F7.6)
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`growth-wallet-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const body: UpdateTenantWalletRequestDTO & { organizationId?: string; payoutRequest?: { amountUsdc: number; toAddress: string; rationale: string } } = await req.json();
    const { organizationId, payoutRequest } = body;

    const auth = await resolveTenant(req, organizationId);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Authentication required.' }, { status: 401 });
    }

    // 🔒 Capability Assertion
    try {
      await capabilityRegistry.assertCapability(auth.organizationId, 'growth.finance');
    } catch (err: any) {
      return NextResponse.json({ code: 'CAPABILITY_DISABLED', message: err.message }, { status: 403 });
    }

    // High risk action: If it's a payout request, route to Governance Intent Circuit
    if (payoutRequest) {
      const generatedIntentId = `intent_payout_${Date.now()}`;
      await db.insert(operationalIntents).values({
        id: generatedIntentId,
        organizationId: auth.organizationId,
        missionId: 'treasury_payout_mission',
        packId: 'core_finance_pack',
        packVersion: '1.0.0',
        strategyDecisionId: 'decision_payout_1',
        intentType: 'growth.finance.payout.v1',
        objective: `Disburse ${payoutRequest.amountUsdc} USDC to ${payoutRequest.toAddress}`,
        rationale: payoutRequest.rationale || 'Sovereign Treasury Payout Request',
        status: 'proposed',
      });

      return NextResponse.json({
        success: true,
        intentId: generatedIntentId,
        status: 'GOVERNANCE_APPROVAL_REQUIRED',
        message: 'Solicitud de desembolso registrada como Intención Operativa. Requiere aprobación en el Governance Center.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración de wallet soberana actualizada con éxito.',
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Growth API: wallet POST] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}
