import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesKnowledge, knowledgeSources } from '@/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { CreateKnowledgeSourceCommand } from '@/lib/pandoras/core/domains/control-plane/application/commands/knowledge/create-knowledge-source';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';
import type { 
  GetKnowledgeResponseDTO, 
  KnowledgeFactDTO, 
  KnowledgeSourceDTO,
  AddKnowledgeSourceRequestDTO,
  UpdateKnowledgeFactStatusRequestDTO 
} from '@/lib/dash-contracts/knowledge';

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
        return { 
          organizationId: org.organizationId, 
          slug: org.slug, 
          actorId: `session_${session.installedProductId}`,
          sessionId: cookie,
          role: 'owner' as const
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
        slug: cleanTenant, 
        actorId: (payload as any).actorId || 'tma_actor',
        sessionId: bearerToken,
        role: 'operator' as const
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
    const rl = checkRateLimit(`hermes-knowledge-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationSlug');

    const auth = await resolveTenant(req, requestedSlug);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    // 1. Fetch facts
    const factsDb = await db
      .select()
      .from(hermesKnowledge)
      .where(
        or(
          eq(hermesKnowledge.organizationId, auth.slug),
          eq(hermesKnowledge.organizationId, auth.organizationId),
          eq(hermesKnowledge.organizationId, `org_${auth.slug}`)
        )
      )
      .orderBy(desc(hermesKnowledge.updatedAt));

    // 2. Fetch sources
    const sourcesDb = await db
      .select()
      .from(knowledgeSources)
      .where(
        or(
          eq(knowledgeSources.tenantId, auth.slug),
          eq(knowledgeSources.tenantId, auth.organizationId),
          eq(knowledgeSources.tenantId, `org_${auth.slug}`)
        )
      )
      .orderBy(desc(knowledgeSources.createdAt));

    const facts: KnowledgeFactDTO[] = factsDb.map(f => ({
      id: f.id,
      dimension: f.dimension,
      key: f.key,
      content: f.content || '',
      status: f.status as any,
      authority: f.authority,
      updatedAt: f.updatedAt.toISOString(),
    }));

    const sources: KnowledgeSourceDTO[] = sourcesDb.map(s => ({
      id: s.id,
      title: s.title,
      type: s.type,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    }));

    const readySources = sources.filter(s => s.status === 'READY').length;
    const processingSources = sources.filter(s => s.status === 'PROCESSING').length;
    const failedSources = sources.filter(s => s.status === 'FAILED').length;

    const overview = {
      totalSources: sources.length,
      readySources,
      processingSources,
      failedSources,
      knowledgeHealth: (sources.length === 0 ? 'EMPTY' : failedSources > 0 ? 'ATTENTION_REQUIRED' : processingSources > 0 ? 'PROCESSING' : 'READY') as any,
      sources: sourcesDb.map(s => ({
        id: s.id,
        tenantId: s.tenantId,
        title: s.title,
        type: s.type as any,
        status: s.status as any,
        activeVersionId: s.activeVersionId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastProcessedAt: s.lastProcessedAt,
        errorCode: s.errorCode,
        errorMessage: s.errorMessage,
      })),
      facts: factsDb.map(f => ({
        id: f.id,
        dimension: f.dimension,
        key: f.key,
        content: f.content || '',
        status: (f.status === 'ACTIVE' ? 'ACTIVE' : f.status === 'REJECTED' ? 'REJECTED' : 'PENDING_REVIEW') as any,
        source: f.source,
      })),
    };

    const response = { facts, sources, overview };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/knowledge GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch knowledge' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-knowledge-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await resolveTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body: AddKnowledgeSourceRequestDTO = await req.json();
    const { type, title, content } = body;

    if (!type || !title || !content) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'type, title and content required' }, { status: 400 });
    }

    const cpCtx = new ControlPlaneContext(
      auth.sessionId,
      auth.actorId,
      'admin',
      ['view_overview', 'change_policy'],
      [{ organizationId: auth.organizationId, role: 'admin' }]
    );

    const cmd = new CreateKnowledgeSourceCommand();
    const normalizedType: any = type === 'TEXT' ? 'DOCUMENT' : type;
    const result = await cmd.execute(cpCtx, auth.organizationId, { type: normalizedType, content, title });

    return NextResponse.json({ success: true, sourceId: result || 'src_created' });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/knowledge POST] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to add knowledge source' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-knowledge-patch:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await resolveTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body: UpdateKnowledgeFactStatusRequestDTO = await req.json();
    const { factId, status } = body;

    if (!factId || !['ACTIVE', 'REJECTED'].includes(status)) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'factId and valid status required' }, { status: 400 });
    }

    await db
      .update(hermesKnowledge)
      .set({ status, updatedAt: new Date() })
      .where(
        and(
          eq(hermesKnowledge.id, factId),
          or(
            eq(hermesKnowledge.organizationId, auth.slug),
            eq(hermesKnowledge.organizationId, auth.organizationId)
          )
        )
      );

    return NextResponse.json({ success: true, factId, status });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/knowledge PATCH] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to update fact' }, { status: 500 });
  }
}
