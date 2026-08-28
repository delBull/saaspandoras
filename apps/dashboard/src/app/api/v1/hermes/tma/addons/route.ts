import { NextRequest, NextResponse } from 'next/server';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { HermesAuthError } from '@/lib/hermes/auth/hermes-session.types';
import { db } from '@/db';
import { hermesAddonInstallations } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { CANONICAL_ADDONS, ensureCanonicalAddOnsRegistered } from '@/lib/pandoras/core/domains/hermes/addons/catalog';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';

export const dynamic = 'force-dynamic';
const tokenService = new SessionTokenService();

export async function GET(req: NextRequest) {
  try {
    const rl = checkRateLimit(`tma-addons:${clientIpFromHeaders(req.headers)}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token', code: 'MISSING_TOKEN' }, { status: 401 });
    }

    const payload = tokenService.verifyToken(token);
    const orgId = payload.organizationId;
    const cleanTenant = orgId.toLowerCase().replace(/^org_/, '');

    await ensureCanonicalAddOnsRegistered();

    // 1. Fetch live installations for this tenant
    const installations = await db
      .select()
      .from(hermesAddonInstallations)
      .where(
        or(
          eq(hermesAddonInstallations.organizationId, orgId),
          eq(hermesAddonInstallations.organizationId, cleanTenant),
          eq(hermesAddonInstallations.organizationId, `org_${cleanTenant}`)
        )
      );

    const installationMap = new Map<string, string>();
    for (const inst of installations) {
      installationMap.set(inst.addonId, inst.status);
    }

    // 2. Map canonical addons with live status
    const addons = CANONICAL_ADDONS.map((addon) => {
      const liveStatus = installationMap.get(addon.id) || 'AVAILABLE';
      return {
        id: addon.id,
        name: addon.name,
        version: addon.version,
        type: addon.type,
        description: addon.description,
        status: liveStatus === 'ACTIVE' ? 'ACTIVE' : 'AVAILABLE',
        capabilities: (addon.capabilities || []).map((c) => ({
          id: c.id,
          category: c.category,
          description: c.description,
        })),
        channels: addon.governanceRequirements?.allowedChannels || ['web', 'whatsapp', 'telegram'],
        requiresHumanApproval: Boolean(addon.governanceRequirements?.requiresHumanApproval),
      };
    });

    return NextResponse.json({ addons });
  } catch (err: any) {
    if (err instanceof HermesAuthError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 401 });
    }
    console.error('[API /api/v1/hermes/tma/addons GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token', code: 'MISSING_TOKEN' }, { status: 401 });
    }

    const payload = tokenService.verifyToken(token);
    const orgId = payload.organizationId;
    const cleanTenant = orgId.toLowerCase().replace(/^org_/, '');

    const body = await req.json();
    const { addonId, enable } = body;

    if (!addonId || typeof enable !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const canonical = CANONICAL_ADDONS.find((a) => a.id === addonId);
    if (!canonical) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    const newStatus = enable ? 'ACTIVE' : 'DEACTIVATED';

    const existing = await db
      .select()
      .from(hermesAddonInstallations)
      .where(
        and(
          eq(hermesAddonInstallations.addonId, addonId),
          or(
            eq(hermesAddonInstallations.organizationId, orgId),
            eq(hermesAddonInstallations.organizationId, cleanTenant)
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(hermesAddonInstallations)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          ...(enable ? { activatedAt: new Date() } : {}),
        })
        .where(eq(hermesAddonInstallations.id, existing[0]!.id));
    } else if (enable) {
      await db.insert(hermesAddonInstallations).values({
        id: crypto.randomUUID(),
        organizationId: cleanTenant,
        addonId,
        version: canonical.version,
        status: 'ACTIVE',
        configuration: {},
        manifestSnapshot: canonical as any,
        installedBy: payload.telegramUserId || 'tma_operator',
        activatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, addonId, status: newStatus });
  } catch (err: any) {
    if (err instanceof HermesAuthError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 401 });
    }
    console.error('[API /api/v1/hermes/tma/addons POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
