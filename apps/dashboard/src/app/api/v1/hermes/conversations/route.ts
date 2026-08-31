import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesConversationMessages } from '@/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { EscalationService } from '@/lib/hermes/escalation/escalation-service';
import type { 
  GetConversationMessagesResponseDTO, 
  ConversationMessageDTO,
  ManualTakeoverRequestDTO,
  ManualTakeoverResponseDTO 
} from '@/lib/dash-contracts/conversations';

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
    const rl = checkRateLimit(`hermes-conv-get:${ip}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationSlug');
    const conversationId = searchParams.get('conversationId');

    const auth = await resolveTenant(req, requestedSlug);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    // 1. If conversationId is provided, return its messages
    if (conversationId) {
      const rows = await db
        .select()
        .from(hermesConversationMessages)
        .where(
          and(
            or(
              eq(hermesConversationMessages.organizationId, auth.slug),
              eq(hermesConversationMessages.organizationId, auth.organizationId),
              eq(hermesConversationMessages.organizationId, `org_${auth.slug}`)
            ),
            eq(hermesConversationMessages.conversationId, conversationId)
          )
        )
        .orderBy(asc(hermesConversationMessages.sequence));

      const messages: ConversationMessageDTO[] = rows.map(msg => {
        let role: any = msg.role;
        let content = msg.content;
        if (msg.role === 'ACTIVITY' || msg.role === 'SYSTEM') {
          role = 'ACTIVITY';
          content = msg.content || 'Hermes cognitive action evaluated.';
        }
        return {
          id: msg.id,
          role,
          content,
          createdAt: msg.createdAt.toISOString(),
        };
      });

      const response: GetConversationMessagesResponseDTO = { messages };
      return NextResponse.json(response);
    }

    // 2. Otherwise return conversation overview list for tenant
    const { hermesConversations } = await import('@/db/schema');
    const { desc } = await import('drizzle-orm');
    const convRows = await db
      .select()
      .from(hermesConversations)
      .where(
        or(
          eq(hermesConversations.organizationId, auth.slug),
          eq(hermesConversations.organizationId, auth.organizationId),
          eq(hermesConversations.organizationId, `org_${auth.slug}`)
        )
      )
      .orderBy(desc(hermesConversations.updatedAt));

    const conversations = convRows.map(c => ({
      id: c.id,
      conversationId: c.conversationId,
      status: c.status || 'ACTIVE',
      escalationReason: c.escalationReason,
      escalatedAt: c.escalatedAt ? c.escalatedAt.toISOString() : undefined,
      updatedAt: c.updatedAt.toISOString(),
      messageCount: c.version,
      preview: c.status === 'PAUSED_HUMAN' ? `⚠️ Requiere atención: ${c.escalationReason || 'Escalado'}` : 'Toca para ver el historial...',
    }));

    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/conversations GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch conversation messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-conv-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await resolveTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body: ManualTakeoverRequestDTO = await req.json();
    const { conversationId, operatorId, reason } = body;

    if (!conversationId) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'conversationId required' }, { status: 400 });
    }

    const escalation = await EscalationService.triggerEscalation({
      organizationId: auth.slug,
      conversationId,
      actorId: operatorId || auth.actorId,
      reason: 'MANUAL',
      notes: reason || 'Manual takeover triggered via Dash API',
    });

    const response: ManualTakeoverResponseDTO = {
      success: true,
      escalationId: escalation?.id || 'esc_created',
    };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/conversations POST] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to trigger manual takeover' }, { status: 500 });
  }
}
