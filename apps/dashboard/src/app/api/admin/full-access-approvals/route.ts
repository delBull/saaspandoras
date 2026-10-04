/**
 * 🛡️ Admin — Full-Access Approvals queue (GET)
 * Lists intents of type admin.full_access.v1 in status='proposed'. Both ADMIN
 * and SUPER_ADMIN may view; only SUPER_ADMIN may approve (PATCH endpoint).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { operationalIntents, projects } from '@saasfly/db/schema';
import { eq, and } from "@saasfly/db-core";
import { getNexusAuthContext } from '@saasfly/shared';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const nexus = await getNexusAuthContext();
    if (!nexus.isAuthenticated || (nexus.role !== 'SUPER_ADMIN' && nexus.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const rows = await db
      .select({
        intentId: operationalIntents.id,
        organizationId: operationalIntents.organizationId,
        rationale: operationalIntents.rationale,
        createdAt: operationalIntents.createdAt,
      })
      .from(operationalIntents)
      .where(and(
        eq(operationalIntents.intentType, 'admin.full_access.v1'),
        eq(operationalIntents.status, 'proposed')
      ))
      .limit(50);

    const pending = await Promise.all(rows.map(async (r) => {
      const [proj] = await db.select({ slug: projects.slug }).from(projects).where(eq(projects.organizationId, r.organizationId)).limit(1);
      return {
        intentId: r.intentId,
        slug: proj?.slug || 'unknown',
        requestedBy: r.rationale.match(/Requested by ([^.\s]+)/)?.[1] || r.rationale.slice(0, 60),
        createdAt: r.createdAt?.toISOString?.() || new Date().toISOString(),
      };
    }));

    return NextResponse.json({ pending, role: nexus.role });
  } catch (error: any) {
    console.error('[FullAccessApprovals GET]', error?.message);
    return NextResponse.json({ success: false, message: error?.message }, { status: 500 });
  }
}
