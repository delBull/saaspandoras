import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesKnowledge } from '@/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import crypto from 'crypto';
import type { 
  GetPoliciesResponseDTO, 
  PolicyDTO, 
  SavePolicyRequestDTO, 
  SavePolicyResponseDTO 
} from '@/lib/dash-contracts/policies';

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
        return { organizationId: org.organizationId, slug: org.slug };
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
      return { organizationId: payload.organizationId, slug: cleanTenant };
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-policies-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationSlug');

    const auth = await resolveTenant(req, requestedSlug);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(hermesKnowledge)
      .where(
        and(
          eq(hermesKnowledge.dimension, 'policy'),
          or(
            eq(hermesKnowledge.organizationId, auth.slug),
            eq(hermesKnowledge.organizationId, auth.organizationId),
            eq(hermesKnowledge.organizationId, `org_${auth.slug}`)
          )
        )
      )
      .orderBy(desc(hermesKnowledge.updatedAt));

    const policies: PolicyDTO[] = rows.map(r => ({
      id: r.id,
      key: r.key,
      content: r.content || '',
      dimension: r.dimension,
      status: r.status,
      authority: r.authority,
      updatedAt: r.updatedAt.toISOString(),
    }));

    const response: GetPoliciesResponseDTO = { policies };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/policies GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch policies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-policies-post:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await resolveTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body: SavePolicyRequestDTO = await req.json();
    const { key, content } = body;

    if (!key || typeof content !== 'string') {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'key and content (string) required' }, { status: 400 });
    }

    // Delete previous override for this key
    await db.delete(hermesKnowledge).where(
      and(
        or(
          eq(hermesKnowledge.organizationId, auth.slug),
          eq(hermesKnowledge.organizationId, auth.organizationId)
        ),
        eq(hermesKnowledge.dimension, 'policy'),
        eq(hermesKnowledge.key, key)
      )
    );

    // Insert new active tenant policy
    await db.insert(hermesKnowledge).values({
      id: crypto.randomUUID(),
      organizationId: auth.slug,
      dimension: 'policy',
      key,
      content,
      status: 'ACTIVE',
      visibility: 'PRIVATE',
      authority: 'TENANT',
      version: 1,
      source: 'PORTAL_UI',
      sourceReference: 'manual_override',
      createdBy: 'system',
    });

    const response: SavePolicyResponseDTO = {
      success: true,
      key,
    };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/policies POST] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to save policy' }, { status: 500 });
  }
}
