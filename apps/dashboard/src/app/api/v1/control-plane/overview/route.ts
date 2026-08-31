/**
 * 🛰️ Control Plane API Boundary — Overview Service
 * /api/v1/control-plane/overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, installedProducts } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getAuth, isAdmin } from '@/lib/auth';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import type { ControlPlaneOverviewDTO } from '@/lib/dash-contracts/control-plane';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`cp-overview-get:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const orgParam = searchParams.get('organizationId') || '';
    const cleanSlug = orgParam.replace(/^org_/, '').trim();

    const auth = await getAuth();
    if (!auth.isVerified || !auth.session?.address) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Wallet authentication required.' }, { status: 401 });
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(or(eq(projects.slug, cleanSlug), eq(projects.slug, orgParam)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Organization not found' }, { status: 404 });
    }

    const hermesInstall = await db.query.installedProducts.findFirst({
      where: and(
        eq(installedProducts.projectId, project.id),
        eq(installedProducts.productFamily, 'HERMES')
      ),
    });

    const response: ControlPlaneOverviewDTO = {
      id: `org_${project.slug}`,
      name: project.title || project.slug,
      slug: project.slug,
      hasHermes: Boolean(hermesInstall),
      stats: {
        totalInteractions: 0,
        activeJourneys: 0,
        governanceScore: 100,
        knowledgeSourcesCount: 0,
      },
      metrics: {
        activeMissionsCount: 1,
        pendingIntentsCount: 0,
        completedMissionsCount: 5,
        riskScore: 10,
      },
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[API /api/v1/control-plane/overview GET] Error:', err);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch control plane overview' }, { status: 500 });
  }
}
