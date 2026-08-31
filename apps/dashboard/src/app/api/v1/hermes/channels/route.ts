/**
 * 🛰️ Hermes API Boundary — Channels Configuration Service
 * /api/v1/hermes/channels
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import type { MaskedChannelsConfigDTO, SaveChannelConfigRequestDTO } from '@/lib/dash-contracts/channels';

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
    const rl = checkRateLimit(`hermes-channels-get:${ip}`, 60, 60_000);
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

    const config = (project.tenantRuntimeConfig as any) || {};
    const secrets = config.secrets || {};

    const response: MaskedChannelsConfigDTO = {
      telegramConfigured: Boolean(secrets.telegramBotToken),
      telegramBotTokenMasked: secrets.telegramBotToken ? '••••••••••••••••' : '',
      whatsappConfigured: Boolean(secrets.whatsappToken),
      whatsappTokenMasked: secrets.whatsappToken ? '••••••••••••••••' : '',
      whatsappPhoneId: secrets.whatsappPhoneId || '',
      discordConfigured: Boolean(secrets.discordWebhookUrl),
      discordWebhookUrlMasked: secrets.discordWebhookUrl ? '••••••••••••••••' : '',
      slackConfigured: Boolean(secrets.slackWebhookUrl),
      slackWebhookUrlMasked: secrets.slackWebhookUrl ? '••••••••••••••••' : '',
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/channels GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch channels config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-channels-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await resolveAuthorizedTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body: SaveChannelConfigRequestDTO = await req.json();
    const rows = await db.select().from(projects).where(buildProjectMatchCondition(auth.organizationSlug, auth.organizationId)).limit(1);
    const project = rows[0];
    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Project not found' }, { status: 404 });
    }

    const currentConfig = (project.tenantRuntimeConfig as any) || {};
    const currentSecrets = currentConfig.secrets || {};

    let updatedSecrets = { ...currentSecrets };

    if (body.channel === 'telegram') {
      if (body.config.botToken !== undefined) {
        if (body.config.botToken.trim() === '') {
          delete updatedSecrets.telegramBotToken;
        } else {
          updatedSecrets.telegramBotToken = body.config.botToken.trim();
        }
      }
    } else if (body.channel === 'whatsapp') {
      if (body.config.token !== undefined) {
        if (body.config.token.trim() === '') {
          delete updatedSecrets.whatsappToken;
        } else {
          updatedSecrets.whatsappToken = body.config.token.trim();
        }
      }
      if (body.config.phoneNumberId !== undefined) {
        if (body.config.phoneNumberId.trim() === '') {
          delete updatedSecrets.whatsappPhoneId;
        } else {
          updatedSecrets.whatsappPhoneId = body.config.phoneNumberId.trim();
        }
      }
    } else if (body.channel === 'discord') {
      if (body.config.webhookUrl !== undefined) {
        if (body.config.webhookUrl.trim() === '') {
          delete updatedSecrets.discordWebhookUrl;
        } else {
          updatedSecrets.discordWebhookUrl = body.config.webhookUrl.trim();
        }
      }
    } else if (body.channel === 'slack') {
      if (body.config.webhookUrl !== undefined) {
        if (body.config.webhookUrl.trim() === '') {
          delete updatedSecrets.slackWebhookUrl;
        } else {
          updatedSecrets.slackWebhookUrl = body.config.webhookUrl.trim();
        }
      }
    }

    await db.update(projects)
      .set({
        tenantRuntimeConfig: {
          ...currentConfig,
          secrets: updatedSecrets,
        },
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/channels POST] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to update channels config' }, { status: 500 });
  }
}
