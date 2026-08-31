/**
 * 🛰️ Hermes API Boundary — Settings & Integration Keys Service
 * /api/v1/hermes/settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, integrationClients } from '@/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import type { GetSettingsResponseDTO, ApiKeyItemDTO, TenantSettingsDataDTO } from '@/lib/dash-contracts/settings';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

const isUuid = (val?: string): boolean => 
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

function buildProjectMatchCondition(targetSlug: string, orgId?: string) {
  const canonicalTarget = targetSlug?.replace(/^org_/, '').trim();
  const canonicalOrgId = orgId?.replace(/^org_/, '').trim();
  return or(
    ...(canonicalTarget ? [eq(projects.slug, canonicalTarget)] : []),
    ...(canonicalOrgId && isUuid(canonicalOrgId) ? [eq(projects.organizationId, canonicalOrgId)] : []),
    ...(isUuid(targetSlug) ? [eq(projects.organizationId, targetSlug)] : []),
    ...(canonicalOrgId && !isUuid(canonicalOrgId) ? [eq(projects.slug, canonicalOrgId)] : [])
  );
}

async function resolveAuthorizedTenant(req: NextRequest, requestedSlug?: string | null): Promise<{
  organizationId: string;
  organizationSlug: string;
  projectId: number | null;
} | null> {
  const portalSessionCookie = req.cookies.get('pandoras_portal_session')?.value;
  if (portalSessionCookie) {
    const session = await validatePortalSession(portalSessionCookie);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        if (requestedSlug && requestedSlug !== org.slug && requestedSlug !== org.organizationId) {
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

  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (bearerToken) {
    try {
      const payload = sessionTokenService.verifyToken(bearerToken);
      const cleanTenant = payload.organizationId.toLowerCase().replace(/^org_/, '');
      if (requestedSlug && requestedSlug !== cleanTenant && requestedSlug !== payload.organizationId) {
        return null;
      }
      return {
        organizationId: payload.organizationId,
        organizationSlug: cleanTenant,
        projectId: null,
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
    const rl = checkRateLimit(`hermes-settings-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationSlug');

    const auth = await resolveAuthorizedTenant(req, requestedSlug);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const rows = await db.select().from(projects).where(buildProjectMatchCondition(auth.organizationSlug, auth.organizationId)).limit(1);
    const project = rows[0];
    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Project not found' }, { status: 404 });
    }

    const rawKeys = await db
      .select()
      .from(integrationClients)
      .where(eq(integrationClients.projectId, project.id))
      .orderBy(desc(integrationClients.createdAt));

    const apiKeys: ApiKeyItemDTO[] = rawKeys.map((k) => ({
      id: k.id,
      name: k.name,
      keyFingerprint: k.keyFingerprint,
      permissions: (k.permissions as string[]) || [],
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      createdAt: k.createdAt.toISOString(),
    }));

    const runtimeCfg = (project.tenantRuntimeConfig as Record<string, any>) || {};

    const settings: TenantSettingsDataDTO = {
      title: project.title || '',
      tagline: project.tagline || '',
      description: project.description || '',
      website: project.website || '',
      whatsappPhone: project.whatsappPhone || '',
      telegramUrl: project.telegramUrl || '',
      twitterUrl: runtimeCfg.twitterUrl || '',
      linkedinUrl: runtimeCfg.linkedinUrl || '',
      contactEmail: runtimeCfg.contactEmail || '',
    };

    const response: GetSettingsResponseDTO = { settings, apiKeys };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/settings GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-settings-put:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await resolveAuthorizedTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body = await req.json();
    const rows = await db.select().from(projects).where(buildProjectMatchCondition(auth.organizationSlug, auth.organizationId)).limit(1);
    const project = rows[0];
    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Project not found' }, { status: 404 });
    }

    const currentRuntime = (project.tenantRuntimeConfig as Record<string, any>) || {};
    const updatedRuntime = {
      ...currentRuntime,
      ...(body.twitterUrl !== undefined ? { twitterUrl: body.twitterUrl } : {}),
      ...(body.linkedinUrl !== undefined ? { linkedinUrl: body.linkedinUrl } : {}),
      ...(body.contactEmail !== undefined ? { contactEmail: body.contactEmail } : {}),
      ...(body.language !== undefined ? { language: body.language } : {}),
      ...(body.tonePreset !== undefined ? { tonePreset: body.tonePreset } : {}),
      ...(body.humanHandoffContact !== undefined ? { humanHandoffContact: body.humanHandoffContact } : {}),
      ...(body.maxResponseTokens !== undefined ? { maxResponseTokens: body.maxResponseTokens } : {}),
    };

    await db.update(projects)
      .set({
        title: body.title !== undefined ? body.title : project.title,
        tagline: body.tagline !== undefined ? body.tagline : project.tagline,
        description: body.description !== undefined ? body.description : project.description,
        website: body.website !== undefined ? body.website : project.website,
        whatsappPhone: body.whatsappPhone !== undefined ? body.whatsappPhone : project.whatsappPhone,
        telegramUrl: body.telegramUrl !== undefined ? body.telegramUrl : project.telegramUrl,
        tenantRuntimeConfig: updatedRuntime,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/settings PUT] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to update settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-settings-post:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await resolveAuthorizedTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, permissions = ['hermes.chat', 'knowledge.read'] } = body;

    const rows = await db.select().from(projects).where(buildProjectMatchCondition(auth.organizationSlug, auth.organizationId)).limit(1);
    const project = rows[0];
    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Project not found' }, { status: 404 });
    }

    const rawKeySecret = crypto.randomBytes(24).toString('hex');
    const apiKey = `pk_live_${rawKeySecret}`;
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyFingerprint = `pk_live_...${apiKey.slice(-6)}`;

    const [inserted] = await db
      .insert(integrationClients)
      .values({
        name: name || 'API Key de Integración',
        environment: 'production',
        projectId: project.id,
        apiKeyHash,
        keyFingerprint,
        permissions: permissions as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: integrationClients.id,
        name: integrationClients.name,
        keyFingerprint: integrationClients.keyFingerprint,
        createdAt: integrationClients.createdAt,
      });

    const { SecurityAuditLogger } = await import('@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger');
    await SecurityAuditLogger.logEvent({
      organizationId: auth.organizationSlug,
      eventType: 'CREDENTIAL_ISSUED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: `key_gen_${inserted?.id}`,
      metadata: {
        action: 'API_KEY_GENERATED',
        keyId: inserted?.id,
        keyFingerprint,
        name: inserted?.name,
        permissions,
      },
    }).catch((err) => console.error('[Settings] Failed to log API key creation audit:', err));

    return NextResponse.json({ success: true, apiKey, key: inserted });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/settings POST] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to generate API key' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-settings-delete:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await resolveAuthorizedTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('keyId');
    if (!keyId) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'keyId parameter required' }, { status: 400 });
    }

    const rows = await db.select().from(projects).where(buildProjectMatchCondition(auth.organizationSlug, auth.organizationId)).limit(1);
    const project = rows[0];
    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Project not found' }, { status: 404 });
    }

    const [revoked] = await db
      .update(integrationClients)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(integrationClients.id, keyId),
          eq(integrationClients.projectId, project.id)
        )
      )
      .returning({
        id: integrationClients.id,
        keyFingerprint: integrationClients.keyFingerprint,
      });

    if (!revoked) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Key not found' }, { status: 404 });
    }

    const { SecurityAuditLogger } = await import('@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger');
    await SecurityAuditLogger.logEvent({
      organizationId: auth.organizationSlug,
      eventType: 'CREDENTIAL_REVOKED',
      severity: 'WARN',
      policyDecision: 'DENY',
      correlationId: `key_rev_${revoked.id}`,
      metadata: {
        action: 'API_KEY_REVOKED',
        keyId: revoked.id,
        keyFingerprint: revoked.keyFingerprint,
      },
    }).catch((err) => console.error('[Settings] Failed to log API key revocation audit:', err));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/settings DELETE] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to revoke API key' }, { status: 500 });
  }
}
