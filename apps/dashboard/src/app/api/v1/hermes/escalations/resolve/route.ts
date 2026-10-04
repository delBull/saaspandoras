import { NextResponse } from 'next/server';
import { getCanonicalAuth } from '@saasfly/auth-sdk';
import { EscalationService } from '@saasfly/hermes-core';
import { db } from '@saasfly/db';
import { daoMembers, projects } from '@saasfly/db/schema';
import { eq, and } from "@saasfly/db-core";

export async function POST(req: Request) {
  try {
    const { tenantSlug, escalationId, resolutionSummary } = await req.json();

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

    // 2. Resolve via Service
    const operatorId = user.walletAddress;
    await EscalationService.resumeHermes({
        organizationId: tenantSlug,
        escalationId: escalationId,
        operatorId: operatorId,
        notes: resolutionSummary
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
