import { NextResponse } from 'next/server';
import { getCanonicalAuth } from '@/lib/auth';
import { EscalationService } from '@/lib/hermes/escalation/escalation-service';
import { db } from '@/db';
import { daoMembers, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug');

    if (!tenantSlug) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 });
    }

    // 1. Authorization
    const { user, isVerified } = await getCanonicalAuth();
    if (!user || !isVerified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve tenantId from slug
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, tenantSlug)
    });
    if (!project) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if user is a daoMember with access to this tenant
    // (Assuming user.address is the wallet address)
    const membership = await db.query.daoMembers.findFirst({
      where: (member, { eq, ilike, and }) => and(
        eq(member.projectId, project.id),
        ilike(member.wallet, user.walletAddress)
      )
    });

    if (!membership && user.walletAddress !== process.env.ADMIN_WALLET) {
        // Just fail-closed if they are not part of the DAO/Tenant
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch escalations via the Service
    const escalations = await EscalationService.getEscalations(tenantSlug);

    return NextResponse.json({ success: true, data: escalations });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
