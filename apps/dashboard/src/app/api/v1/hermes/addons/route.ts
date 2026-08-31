import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesAddonInstallations, hermesAddonAudit } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { CANONICAL_ADDONS, activateTenantAddOn, ensureCanonicalAddOnsRegistered } from '@/lib/pandoras/core/domains/hermes/addons/catalog';
import { v4 as uuidv4 } from 'uuid';
import type { 
  GetAddonsResponseDTO, 
  AddonStatusDTO, 
  ToggleAddonRequestDTO, 
  ToggleAddonResponseDTO 
} from '@/lib/dash-contracts/addons';
import type { DashApiError } from '@/lib/dash-contracts/journeys';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

async function resolveTenant(req: NextRequest, requestedSlug?: string | null) {
  const cookie = req.cookies.get('pandoras_portal_session')?.value;
  if (cookie) {
    const session = await validatePortalSession(cookie);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        if (requestedSlug && requestedSlug !== org.slug && requestedSlug !== org.organizationId) {
          return null;
        }
        return { organizationId: org.organizationId, slug: org.slug, actorId: `session_${session.installedProductId}` };
      }
    }
  }

  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerToken) {
    try {
      const payload = sessionTokenService.verifyToken(bearerToken);
      const cleanTenant = payload.organizationId.toLowerCase().replace(/^org_/, '');
      if (requestedSlug && requestedSlug !== cleanTenant && requestedSlug !== payload.organizationId) {
        return null;
      }
      return { organizationId: payload.organizationId, slug: cleanTenant, actorId: (payload as any).actorId || 'tma_actor' };
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-addons-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationSlug');

    const auth = await resolveTenant(req, requestedSlug);
    if (!auth) {
      const error: DashApiError = { code: 'UNAUTHENTICATED', message: 'Hermes session required.' };
      return NextResponse.json(error, { status: 401 });
    }

    await ensureCanonicalAddOnsRegistered();

    // Query active installations for tenant
    const installed = await db
      .select()
      .from(hermesAddonInstallations)
      .where(
        or(
          eq(hermesAddonInstallations.organizationId, auth.slug),
          eq(hermesAddonInstallations.organizationId, auth.organizationId),
          eq(hermesAddonInstallations.organizationId, `org_${auth.slug}`)
        )
      );

    const installedMap = new Map(installed.map(i => [i.addonId, i]));

    const addons: AddonStatusDTO[] = CANONICAL_ADDONS.map(addon => {
      const inst = installedMap.get(addon.id);
      const isActive = inst && inst.status === 'ACTIVE';
      const isDeactivated = inst && inst.status === 'DEACTIVATED';

      return {
        addonId: addon.id,
        name: addon.name,
        category: (addon as any).type || 'CAPABILITY',
        description: addon.description,
        status: isActive ? 'ACTIVE' : isDeactivated ? 'DEACTIVATED' : 'AVAILABLE',
        version: addon.version,
        installedAt: inst?.activatedAt ? inst.activatedAt.toISOString() : undefined,
        configuration: (inst?.configuration as any) || undefined,
      };
    });

    const response: GetAddonsResponseDTO = { addons };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/addons GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch addons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-addons-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await resolveTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body: ToggleAddonRequestDTO = await req.json();
    const { addonId, active } = body;

    if (!addonId || typeof active !== 'boolean') {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'addonId and active (boolean) required' }, { status: 400 });
    }

    await ensureCanonicalAddOnsRegistered();

    if (active) {
      await activateTenantAddOn(auth.slug, addonId, {
        installedBy: auth.actorId,
        configuration: { enabled: true, activatedAt: new Date().toISOString() },
      });
      if (auth.organizationId && auth.organizationId !== auth.slug) {
        await activateTenantAddOn(auth.organizationId, addonId, {
          installedBy: auth.actorId,
          configuration: { enabled: true, activatedAt: new Date().toISOString() },
        });
      }
    } else {
      const existing = await db
        .select()
        .from(hermesAddonInstallations)
        .where(
          and(
            or(
              eq(hermesAddonInstallations.organizationId, auth.slug),
              eq(hermesAddonInstallations.organizationId, auth.organizationId),
              eq(hermesAddonInstallations.organizationId, `org_${auth.slug}`)
            ),
            eq(hermesAddonInstallations.addonId, addonId)
          )
        );

      const now = new Date();
      await db
        .update(hermesAddonInstallations)
        .set({ status: 'DEACTIVATED', updatedAt: now })
        .where(
          and(
            or(
              eq(hermesAddonInstallations.organizationId, auth.slug),
              eq(hermesAddonInstallations.organizationId, auth.organizationId),
              eq(hermesAddonInstallations.organizationId, `org_${auth.slug}`)
            ),
            eq(hermesAddonInstallations.addonId, addonId)
          )
        );

      for (const inst of existing) {
        await db.insert(hermesAddonAudit).values({
          id: `evt_${uuidv4()}`,
          organizationId: auth.organizationId,
          addonId,
          installationId: inst.id,
          eventType: 'DEACTIVATED',
          actorId: auth.actorId,
          actorType: 'USER',
          oldStatus: inst.status as any,
          newStatus: 'DEACTIVATED',
          version: inst.version,
          reason: 'Deactivated via Hermes Service Boundary',
          createdAt: now,
        });
      }
    }

    const response: ToggleAddonResponseDTO = {
      success: true,
      addonId,
      active,
    };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/addons POST] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to toggle addon' }, { status: 500 });
  }
}
