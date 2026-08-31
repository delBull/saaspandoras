/**
 * 🛰️ Hermes API Boundary — Overview Service
 * /api/v1/hermes/overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, hermesJourneys, hermesConversationMessages } from '@/db/schema';
import { eq, desc, or } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import type { HermesOverviewView, SystemStatus, ActivityEventView } from '@/lib/portal/portal-types';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';
import { getOverviewQuery } from '@/lib/pandoras/composition/control-plane-composition';
import { GetKnowledgeOverviewQuery } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

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
    const rl = checkRateLimit(`hermes-overview-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationSlug');

    const auth = await resolveAuthorizedTenant(req, requestedSlug);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const cpCtx = new ControlPlaneContext(
      'session_default',
      'system',
      'owner' as any,
      ['view_overview'] as any,
      [{ organizationId: auth.organizationId, role: 'owner' as any }]
    );

    let knowledgeHealth: SystemStatus = 'NOT_CONFIGURED';
    try {
      const knowledgeQuery = new GetKnowledgeOverviewQuery();
      const kOverview = await knowledgeQuery.execute(cpCtx, auth.organizationId);
      knowledgeHealth = kOverview.knowledgeHealth === 'EMPTY' ? 'NOT_CONFIGURED' : kOverview.knowledgeHealth as SystemStatus;
    } catch {}

    const isUuid = (val?: string): boolean => 
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    const [project] = await db.select().from(projects).where(
      or(
        eq(projects.slug, auth.organizationSlug.replace(/^org_/, '')),
        eq(projects.slug, auth.organizationSlug),
        ...(isUuid(auth.organizationId) ? [eq(projects.organizationId, auth.organizationId)] : [])
      )
    ).limit(1);

    let dynamicChannelsStatus: SystemStatus = 'NOT_CONFIGURED';
    let dynamicJourneysStatus: SystemStatus = 'NOT_CONFIGURED';
    let journeyRows: any[] = [];
    let connectedChannels = 0;

    if (project) {
      const config = (project.tenantRuntimeConfig as any) || {};
      const secrets = config.secrets || {};
      if (secrets.telegramBotToken) connectedChannels++;
      if (secrets.whatsappToken) connectedChannels++;
      if (secrets.discordWebhookUrl) connectedChannels++;
      if (secrets.slackWebhookUrl) connectedChannels++;

      if (connectedChannels > 0) {
        dynamicChannelsStatus = 'READY';
      }

      journeyRows = await db
        .select()
        .from(hermesJourneys)
        .where(
          or(
            eq(hermesJourneys.organizationId, auth.organizationSlug),
            eq(hermesJourneys.organizationId, auth.organizationSlug.replace(/^org_/, '')),
            eq(hermesJourneys.organizationId, auth.organizationId)
          )
        );

      const hasActive = journeyRows.some(j => j.status === 'ACTIVE');
      dynamicJourneysStatus = hasActive ? 'READY' : (journeyRows.length > 0 ? 'DEGRADED' : 'NOT_CONFIGURED');
    }

    const messages = await db
      .select()
      .from(hermesConversationMessages)
      .where(
        or(
          eq(hermesConversationMessages.organizationId, auth.organizationSlug),
          eq(hermesConversationMessages.organizationId, auth.organizationSlug.replace(/^org_/, '')),
          eq(hermesConversationMessages.organizationId, auth.organizationId)
        )
      )
      .orderBy(desc(hermesConversationMessages.createdAt))
      .limit(5);

    const recentActivities: ActivityEventView[] = messages.map(msg => ({
      id: msg.id,
      timestamp: msg.createdAt.toISOString(),
      type: msg.role === 'USER' ? 'MESSAGE_RECEIVED' : 'MESSAGE_SENT',
      description: msg.role === 'USER' ? `Mensaje de usuario: "${msg.content.slice(0, 40)}..."` : `Respuesta de agente (${msg.role})`,
      channel: 'web',
      status: 'SUCCESS',
    }));

    const activeJourneysCount = journeyRows.filter(j => j.status === 'ACTIVE').length;
    const activeJourneysFirst = journeyRows.find(j => j.status === 'ACTIVE');

    const overview: HermesOverviewView = {
      organization: {
        id: auth.organizationId,
        name: project?.title || auth.organizationSlug,
      },
      systemStatus: dynamicJourneysStatus === 'READY' ? 'READY' : 'NOT_CONFIGURED',
      journeyStatus: activeJourneysCount > 0 ? 'ACTIVE' : 'NOT_STARTED',
      system: {
        identity: 'READY',
        knowledge: knowledgeHealth,
        channels: dynamicChannelsStatus,
        journeys: dynamicJourneysStatus,
        governance: 'READY',
        cognitive: 'READY',
        execution: 'READY',
      },
      strategicActivity: {
        active: activeJourneysCount > 0,
        title: activeJourneysFirst?.name,
        stage: 'In progress',
        progress: 50,
      },
      metrics: {
        activeJourneys: activeJourneysCount,
        activeConversations: messages.length,
        pendingDecisions: 0,
        connectedChannels,
      },
      activity: recentActivities,
    };

    return NextResponse.json({ overview, organizationName: project?.title || auth.organizationSlug });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/overview GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch overview' }, { status: 500 });
  }
}
