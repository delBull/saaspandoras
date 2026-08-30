import { NextResponse } from 'next/server';
import { db } from '@/db';
import { portalOnboardingState } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { organizationSlug } = body;

    if (!organizationSlug) {
      return NextResponse.json({ error: 'organizationSlug is required' }, { status: 400 });
    }

    const context = await resolvePortalContext(organizationSlug);
    const orgId = context.tenant.organizationId;
    const tenantSlug = context.tenant.organizationSlug || context.organization.slug || organizationSlug;

    // Reset onboarding state to BUSINESS_DISCOVERY across all tenant identifiers
    await db
      .update(portalOnboardingState)
      .set({
        stage: 'BUSINESS_DISCOVERY',
        messages: [],
        updatedAt: new Date(),
      })
      .where(
        or(
          eq(portalOnboardingState.tenantId, organizationSlug),
          eq(portalOnboardingState.tenantId, orgId),
          eq(portalOnboardingState.tenantId, tenantSlug),
          eq(portalOnboardingState.tenantId, String(context.organization.projectId))
        )
      );

    return NextResponse.json({
      ok: true,
      message: `Onboarding state for ${organizationSlug} successfully reset to BUSINESS_DISCOVERY.`,
      stage: 'BUSINESS_DISCOVERY',
    });
  } catch (error: any) {
    console.error('[Onboarding Reset] Error resetting onboarding state:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
