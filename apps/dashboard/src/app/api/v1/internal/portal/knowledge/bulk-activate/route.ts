import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesKnowledge, hermesGovernanceAudit } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationSlug } = body;

    if (!organizationSlug) {
      return NextResponse.json({ error: 'organizationSlug is required' }, { status: 400 });
    }

    const context = await resolvePortalContext(organizationSlug);
    const orgId = context.tenant.organizationId;

    // 1. Fetch all items pending review or discovered
    const pendingItems = await db
      .select()
      .from(hermesKnowledge)
      .where(
        and(
          eq(hermesKnowledge.organizationId, orgId),
          inArray(hermesKnowledge.status, ['DISCOVERED', 'PENDING_REVIEW'])
        )
      );

    let activatedCount = 0;

    for (const item of pendingItems) {
      // Deactivate any existing active knowledge with the same dimension & key
      await db
        .update(hermesKnowledge)
        .set({ status: 'SUPERSEDED', updatedAt: new Date() })
        .where(
          and(
            eq(hermesKnowledge.organizationId, orgId),
            eq(hermesKnowledge.dimension, item.dimension),
            eq(hermesKnowledge.key, item.key),
            eq(hermesKnowledge.status, 'ACTIVE')
          )
        );

      // Activate current item
      await db
        .update(hermesKnowledge)
        .set({
          status: 'ACTIVE',
          authority: item.authority === 'INFERRED_UNVERIFIED' ? 'TENANT_PROVIDED' : item.authority,
          updatedAt: new Date(),
        })
        .where(eq(hermesKnowledge.id, item.id));

      // Log audit
      await db.insert(hermesGovernanceAudit).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        knowledgeId: item.id,
        version: item.version,
        eventType: 'APPROVE_BULK',
        actorId: context.tenant.actorId || 'tenant_owner',
        actorType: 'USER',
        oldStatus: item.status,
        newStatus: 'ACTIVE',
        reason: '1-Click Onboarding Knowledge Activation by Tenant Owner',
        metadata: { dimension: item.dimension, key: item.key },
      });

      activatedCount++;
    }

    return NextResponse.json({
      success: true,
      activatedCount,
      message: `Se activaron ${activatedCount} elementos de conocimiento para ${context.organization.name || organizationSlug}. Hermes ahora responderá con esta información verificada.`,
    });
  } catch (error: any) {
    console.error('[Bulk Activate Knowledge Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to bulk activate knowledge' },
      { status: 500 }
    );
  }
}
