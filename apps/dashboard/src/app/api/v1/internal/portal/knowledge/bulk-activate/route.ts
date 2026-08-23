import { NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesKnowledge, hermesGovernanceAudit, projects, portalOnboardingState } from '@/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { PortalAuthorizationError } from '@/lib/portal/portal-types';
import { TenantProvisioner } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-provisioner';
import type { TenantKnowledgePackInput, TenantClaimInput } from '@/lib/pandoras/core/domains/hermes/tenants/contracts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationSlug } = body;

    if (!organizationSlug) {
      return NextResponse.json({ error: 'organizationSlug is required' }, { status: 400 });
    }

    const context = await resolvePortalContext(organizationSlug);
    const orgId = context.tenant.organizationId;
    const tenantSlug = context.tenant.organizationSlug || context.organization.slug || organizationSlug;
    const orgName = context.organization.name || organizationSlug;

    let activatedCount = 0;

    // 1. Execute within a database transaction for strict atomic consistency
    await db.transaction(async (tx) => {
      const pendingItems = await tx
        .select()
        .from(hermesKnowledge)
        .where(
          and(
            or(
              eq(hermesKnowledge.organizationId, orgId),
              eq(hermesKnowledge.organizationId, organizationSlug),
              eq(hermesKnowledge.organizationId, tenantSlug)
            ),
            inArray(hermesKnowledge.status, ['DISCOVERED', 'PENDING_REVIEW'])
          )
        );

      for (const item of pendingItems) {
        // Deactivate any existing active knowledge with the same dimension & key
        await tx
          .update(hermesKnowledge)
          .set({ status: 'SUPERSEDED', updatedAt: new Date() })
          .where(
            and(
              or(
                eq(hermesKnowledge.organizationId, orgId),
                eq(hermesKnowledge.organizationId, organizationSlug),
                eq(hermesKnowledge.organizationId, tenantSlug)
              ),
              eq(hermesKnowledge.dimension, item.dimension),
              eq(hermesKnowledge.key, item.key),
              eq(hermesKnowledge.status, 'ACTIVE')
            )
          );

        // Promote to ACTIVE with TENANT_PROVIDED authority upon 1-click tenant approval
        await tx
          .update(hermesKnowledge)
          .set({
            status: 'ACTIVE',
            authority: item.authority === 'INFERRED_UNVERIFIED' ? 'TENANT_PROVIDED' : item.authority,
            updatedAt: new Date(),
          })
          .where(eq(hermesKnowledge.id, item.id));

        // Insert immutable governance audit log
        await tx.insert(hermesGovernanceAudit).values({
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
    });

    // 2. Fetch all ACTIVE knowledge facts to compile sovereign Claim Contract & policies
    const allActiveKnowledge = await db
      .select()
      .from(hermesKnowledge)
      .where(
        and(
          or(
            eq(hermesKnowledge.organizationId, orgId),
            eq(hermesKnowledge.organizationId, organizationSlug),
            eq(hermesKnowledge.organizationId, tenantSlug)
          ),
          eq(hermesKnowledge.status, 'ACTIVE')
        )
      );

    // Fetch Project record for deterministic metadata
    const projectRecord = await db.query.projects.findFirst({
      where: or(
        eq(projects.organizationId, orgId),
        eq(projects.slug, organizationSlug),
        eq(projects.slug, tenantSlug),
        eq(projects.id, context.organization.projectId)
      ),
    });

    // Filter to facts with valid non-null content
    const validFacts = allActiveKnowledge.filter(
      (k): k is typeof k & { content: string } => typeof k.content === 'string' && k.content.trim().length > 0
    );

    const knowledgePacks: TenantKnowledgePackInput[] = validFacts.map((k) => ({
      title: k.key,
      dimension: k.dimension,
      content: k.content,
      visibility: (k.visibility as any) || 'PUBLIC',
      classification: (k.classification as any) || 'PUBLIC',
    }));

    const customClaims: TenantClaimInput[] = validFacts.map((k, idx) => ({
      claimId: `claim_${k.dimension}_${k.key}_${idx}`.replace(/[^a-zA-Z0-9_]/g, '_'),
      category: 'FACT' as const,
      canonicalAssertion: k.content,
      permittedPhrasings: [k.content],
      disclosureClearance: (k.classification as any) || 'PUBLIC',
    }));

    // 3. Provision Sovereign Intelligence Stack (Claim Contract, IPFS anchoring, Policy registration)
    try {
      await TenantProvisioner.provisionTenantIntelligence({
        tenantId: organizationSlug,
        organizationName: orgName,
        agentName: 'Hermes',
        projectMetadata: {
          tokenPriceUsd: projectRecord?.tokenPriceUsd ?? undefined,
          totalSupply: projectRecord?.totalTokens ?? undefined,
          location: projectRecord?.businessCategory ?? undefined,
          legalEntity: projectRecord?.fiduciaryEntity || projectRecord?.applicantName || undefined,
          websiteUrl: projectRecord?.website ?? undefined,
          whitepaperUrl: projectRecord?.whitepaperUrl ?? undefined,
        },
        knowledgePacks,
        customClaims,
      });
    } catch (provErr) {
      console.warn('[Bulk Activate] TenantProvisioner warning:', provErr);
    }

    // 4. Transition portalOnboardingState to ACTIVATION across all tenant identifiers
    await db
      .insert(portalOnboardingState)
      .values({
        tenantId: organizationSlug,
        stage: 'ACTIVATION',
        messages: [],
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: portalOnboardingState.tenantId,
        set: {
          stage: 'ACTIVATION',
          updatedAt: new Date(),
        },
      });

    await db
      .update(portalOnboardingState)
      .set({ stage: 'ACTIVATION', updatedAt: new Date() })
      .where(
        or(
          eq(portalOnboardingState.tenantId, organizationSlug),
          eq(portalOnboardingState.tenantId, orgId),
          eq(portalOnboardingState.tenantId, tenantSlug),
          eq(portalOnboardingState.tenantId, String(context.organization.projectId))
        )
      );

    return NextResponse.json({
      success: true,
      activatedCount,
      stage: 'ACTIVATION',
      message: `Se activaron ${activatedCount} elementos de conocimiento para ${orgName}. Hermes ahora responderá con esta información verificada.`,
    });
  } catch (error: any) {
    console.error('[Bulk Activate Knowledge Error]:', error);

    if (error instanceof PortalAuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to bulk activate knowledge' },
      { status: 500 }
    );
  }
}
