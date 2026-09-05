import { NextResponse } from 'next/server';
import { getCanonicalAuth } from '@/lib/auth';
import { EscalationService } from '@/lib/hermes/escalation/escalation-service';
import { db } from '@/db';
import { daoMembers, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const escalationId = (await params).id;
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug');

    if (!tenantSlug || !escalationId) {
      return NextResponse.json({ error: 'tenantSlug and escalationId are required' }, { status: 400 });
    }

    // 1. Authorization
    const { user, isVerified } = await getCanonicalAuth();
    if (!user || !isVerified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, tenantSlug)
    });
    if (!project) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const membership = await db.query.daoMembers.findFirst({
      where: (member, { eq, ilike, and }) => and(
        eq(member.projectId, project.id),
        ilike(member.wallet, user.walletAddress)
      )
    });

    if (!membership && user.walletAddress !== process.env.ADMIN_WALLET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch escalation details via the Service
    const details = await EscalationService.getEscalationDetails(tenantSlug, escalationId);

    return NextResponse.json({ success: true, data: details });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
