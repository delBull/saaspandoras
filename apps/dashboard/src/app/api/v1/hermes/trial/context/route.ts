import { NextRequest, NextResponse } from 'next/server';
import { resolvePortalContext, tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { HermesTrialPolicyService, TRIAL_QUOTAS } from '@/lib/hermes/trial/hermes-trial-policy.service';
import { TenantCreditLedgerService } from '@/lib/hermes/compute/tenant-credit-ledger.service';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { db } from '@/db';
import { knowledgeSources, campaigns } from '@/db/schema';
import { DemandDistributionService } from '@/lib/hermes/demand/demand-distribution.service';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedSlug =
      searchParams.get('organizationSlug') ||
      searchParams.get('slug') ||
      searchParams.get('tenantId');

    let orgSlug = requestedSlug;

    // 1. Resolve session if slug not provided
    if (!orgSlug) {
      const cookie = req.cookies.get('pandoras_portal_session')?.value;
      const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
      const token = cookie || authHeader;

      if (token) {
        const session = await validatePortalSession(token);
        if (session) {
          const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
          orgSlug = org.slug;
        }
      }
    }

    if (!orgSlug) {
      return NextResponse.json(
        { ok: false, errorCode: 'UNAUTHENTICATED', message: 'Se requiere sesión de portal o slug de organización.' },
        { status: 401 }
      );
    }

    // 2. Validate tenant access via resolvePortalContext
    const portalCtx = await tryResolvePortalContext(orgSlug);
    if (!portalCtx) {
      return NextResponse.json(
        { ok: false, errorCode: 'UNAUTHORIZED', message: `Acceso no autorizado para el tenant '${orgSlug}'.` },
        { status: 403 }
      );
    }

    const tenantSlug = portalCtx.organization.slug;

    // 3. Resolve trial state
    const trialState = await HermesTrialPolicyService.getTenantTrialState(tenantSlug);

    if (!trialState.isTrial) {
      return NextResponse.json({
        ok: true,
        isTrial: false,
        tenantType: 'PRODUCTION',
        organizationSlug: tenantSlug,
      });
    }

    // 4. Resolve media credits balance
    const credits = await TenantCreditLedgerService.getOrCreateTrialCredits(tenantSlug);
    const remainingCredits = Math.max(0, credits.grantedCredits - credits.consumedCredits - credits.reservedCredits);

    // 5. Resolve side-effect distribution count
    const confirmedPubs = HermesTrialPolicyService.getConfirmedDistributionCount(tenantSlug);

    // 6. Resolve actual knowledge & campaign counts
    let knowledgeCount = 0;
    if (db?.select) {
      try {
        const sources = await db
          .select({ id: knowledgeSources.id })
          .from(knowledgeSources)
          .where(eq(knowledgeSources.tenantId, tenantSlug));
        knowledgeCount = sources.length;
      } catch {}
    }

    let campaignsCount = 0;
    try {
      const active = DemandDistributionService.getActiveCampaign(tenantSlug);
      if (active && active.status !== 'COMPLETED' && active.status !== 'FAILED') {
        campaignsCount = 1;
      }
    } catch {}

    if (campaignsCount === 0 && db?.select && portalCtx.organization.id) {
      try {
        const orgIdNum = typeof portalCtx.organization.id === 'number'
          ? portalCtx.organization.id
          : parseInt(portalCtx.organization.id as string, 10);
        if (!isNaN(orgIdNum)) {
          const activeDb = await db
            .select({ id: campaigns.id })
            .from(campaigns)
            .where(and(eq(campaigns.projectId, orgIdNum), eq(campaigns.status, 'active')));
          campaignsCount = activeDb.length;
        }
      } catch {}
    }

    const now = Date.now();
    const endsAtMs = trialState.trialEndsAt ? new Date(trialState.trialEndsAt).getTime() : now;
    const remainingMs = Math.max(0, endsAtMs - now);

    return NextResponse.json({
      ok: true,
      isTrial: true,
      tenantType: 'TRIAL',
      organizationSlug: tenantSlug,
      organizationId: portalCtx.organization.id,
      trialTier: trialState.trialTier,
      trialStartedAt: trialState.trialStartedAt,
      trialEndsAt: trialState.trialEndsAt,
      trialStatus: trialState.isExpired ? 'PRESERVED' : trialState.trialStatus,
      isExpired: trialState.isExpired,
      remainingMs,
      mediaCredits: {
        granted: credits.grantedCredits,
        reserved: credits.reservedCredits,
        consumed: credits.consumedCredits,
        remaining: remainingCredits,
      },
      quotas: {
        knowledge: { limit: TRIAL_QUOTAS.MAX_KNOWLEDGE_SOURCES, current: knowledgeCount },
        campaigns: { limit: TRIAL_QUOTAS.MAX_ACTIVE_CAMPAIGNS, current: campaignsCount },
        knowledgeSources: { limit: TRIAL_QUOTAS.MAX_KNOWLEDGE_SOURCES, current: knowledgeCount },
        storageMb: { limit: TRIAL_QUOTAS.MAX_KNOWLEDGE_STORAGE_MB },
        campaignsActive: { limit: TRIAL_QUOTAS.MAX_ACTIVE_CAMPAIGNS, current: campaignsCount },
        strategyRunsPerHour: { limit: TRIAL_QUOTAS.MAX_STRATEGY_RUNS_PER_HOUR },
        channelPublications: { limit: TRIAL_QUOTAS.MAX_EXTERNAL_PUBLICATIONS, current: confirmedPubs },
      },
    });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/trial/context] Error:', err);
    return NextResponse.json(
      { ok: false, errorCode: 'INTERNAL_ERROR', message: err?.message || 'Error al obtener contexto de trial.' },
      { status: 500 }
    );
  }
}
