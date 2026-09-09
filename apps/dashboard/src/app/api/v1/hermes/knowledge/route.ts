import { NextRequest, NextResponse } from 'next/server';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { KnowledgeService } from '@/lib/hermes/knowledge/service';
import { TenantAuthorityService, CanonicalTenantIdentity } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';
import type { 
  AddKnowledgeSourceRequestDTO,
  UpdateKnowledgeFactStatusRequestDTO 
} from '@/lib/dash-contracts/knowledge';

export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

interface ResolvedTenantAuth {
  canonicalTenant: CanonicalTenantIdentity;
  actorId: string;
  sessionId: string;
  role: 'owner' | 'operator';
}

async function resolveTenant(req: NextRequest, requestedSlug?: string | null): Promise<ResolvedTenantAuth | null> {
  let tenantIdentifier: string | null = null;
  let actorId = 'anonymous';
  let sessionId = '';
  let role: 'owner' | 'operator' = 'operator';

  // 1. Check portal session cookie
  const cookie = req.cookies?.get?.('pandoras_portal_session')?.value;
  if (cookie) {
    const session = await validatePortalSession(cookie);
    if (session) {
      const org = await OrganizationSDK.resolve(session.projectId, session.product as any);
      if (org) {
        tenantIdentifier = org.slug || org.organizationId;
        actorId = `session_${session.installedProductId}`;
        sessionId = cookie;
        role = 'owner';
      }
    }
  }

  // 2. Check Bearer token if no cookie session
  if (!tenantIdentifier) {
    const authHeader = req.headers.get('authorization') || '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (bearerToken) {
      try {
        const payload = sessionTokenService.verifyToken(bearerToken);
        tenantIdentifier = payload.organizationId;
        actorId = (payload as any).actorId || (payload as any).sub || 'tma_actor';
        sessionId = bearerToken;
        role = 'operator';
      } catch {
        return null;
      }
    }
  }

  if (!tenantIdentifier) {
    return null;
  }

  // Resolve Canonical Identity via TenantAuthorityService
  const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantIdentifier);
  if (!canonical) {
    return null;
  }

  // If a requestedSlug query param was provided, prevent ID tampering / cross-tenant switching
  if (requestedSlug) {
    const cleanRequested = requestedSlug.toLowerCase().replace(/^org_/, '').trim();
    if (
      cleanRequested !== canonical.projectSlug.toLowerCase() &&
      cleanRequested !== canonical.canonicalOrgId.toLowerCase()
    ) {
      console.warn(`[Knowledge API] Cross-tenant attempt rejected: session=${canonical.projectSlug}, requested=${requestedSlug}`);
      return null;
    }
  }

  return {
    canonicalTenant: canonical,
    actorId,
    sessionId,
    role,
  };
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
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes authenticated session required.' }, { status: 401 });
    }

    const snapshot = await KnowledgeService.getTenantKnowledge(auth.canonicalTenant.projectSlug);

    return NextResponse.json({
      facts: snapshot.facts,
      sources: snapshot.sources,
      overview: snapshot.overview,
    });
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
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes authenticated session required.' }, { status: 401 });
    }

    const body: AddKnowledgeSourceRequestDTO = await req.json();
    const { type, title, content } = body;

    if (!type || !title || !content) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'type, title and content required' }, { status: 400 });
    }

    const sourceId = await KnowledgeService.addKnowledgeSource(
      {
        sessionId: auth.sessionId,
        actorId: auth.actorId,
        canonicalTenant: auth.canonicalTenant,
      },
      body
    );

    return NextResponse.json({ success: true, sourceId: sourceId || 'src_created' });
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
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes authenticated session required.' }, { status: 401 });
    }

    const body: UpdateKnowledgeFactStatusRequestDTO = await req.json();
    const { factId, status } = body;

    if (!factId || !['ACTIVE', 'REJECTED'].includes(status)) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'factId and valid status required' }, { status: 400 });
    }

    const updated = await KnowledgeService.updateFactStatus(auth.canonicalTenant, factId, status);
    if (!updated) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Fact not found or does not belong to authorized tenant.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, factId, status });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/knowledge PATCH] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to update fact' }, { status: 500 });
  }
}

