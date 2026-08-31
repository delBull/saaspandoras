/**
 * 🛰️ Hermes API Boundary — Identity & Team Service
 * /api/v1/hermes/identity
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, marketingLeads } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import type { GetIdentityResponseDTO, TeamMemberDTO } from '@/lib/dash-contracts/identity';

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
    const rl = checkRateLimit(`hermes-identity-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get('organizationSlug');

    const auth = await resolveAuthorizedTenant(req, requestedSlug);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const rows = await db.select({
      id: projects.id,
      title: projects.title,
      applicantName: projects.applicantName,
      applicantEmail: projects.applicantEmail,
      applicantPosition: projects.applicantPosition,
    }).from(projects).where(buildProjectMatchCondition(auth.organizationSlug, auth.organizationId)).limit(1);

    const project = rows[0];
    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Project not found' }, { status: 404 });
    }

    const explicitMembers = await db
      .select()
      .from(marketingLeads)
      .where(
        and(
          eq(marketingLeads.projectId, project.id),
          or(
            eq(marketingLeads.leadType, 'team_member'),
            eq(marketingLeads.origin, 'portal_invite')
          )
        )
      );

    const members: TeamMemberDTO[] = explicitMembers.map((m) => ({
      id: m.id.toString(),
      name: m.name || m.email || 'Member',
      email: m.email || '',
      role: 'Team Member',
      status: (m.origin === 'portal_invite' ? 'INVITED' : 'ACTIVE') as any,
    }));

    if (project.applicantEmail && !members.some((m) => m.email.toLowerCase() === project.applicantEmail?.toLowerCase())) {
      members.unshift({
        id: 'owner-principal',
        name: project.applicantName || 'Principal Owner',
        email: project.applicantEmail,
        role: project.applicantPosition || 'Founder / Admin',
        status: 'ACTIVE',
      });
    }

    const response: GetIdentityResponseDTO = {
      projectTitle: project.title || auth.organizationSlug,
      applicantName: project.applicantName || undefined,
      applicantEmail: project.applicantEmail || undefined,
      applicantPosition: project.applicantPosition || undefined,
      members,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/hermes/identity GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch identity data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`hermes-identity-post:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const auth = await resolveAuthorizedTenant(req);
    if (!auth) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Hermes session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'email is required' }, { status: 400 });
    }

    const rows = await db.select().from(projects).where(buildProjectMatchCondition(auth.organizationSlug, auth.organizationId)).limit(1);
    const project = rows[0];
    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Project not found' }, { status: 404 });
    }

    const [lead] = await db
      .insert(marketingLeads)
      .values({
        projectId: project.id,
        name: email.split('@')[0],
        email: email.trim().toLowerCase(),
        leadType: 'team_member',
        origin: 'portal_invite',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, member: lead });
  } catch (err: any) {
    console.error('[API /api/v1/hermes/identity POST] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to invite team member' }, { status: 500 });
  }
}
