import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesMediaRequests, hermesGenerationAttempts, hermesArtifacts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { TenantAuthorityService } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // 1. Fetch media request
    const [request] = await db
      .select()
      .from(hermesMediaRequests)
      .where(eq(hermesMediaRequests.id, id))
      .limit(1);

    if (!request) {
      return NextResponse.json(
        { ok: false, error: `Media request '${id}' not found` },
        { status: 404 }
      );
    }

    // 2. Validate tenant authority / portal session (Fail-closed)
    const canonical = await TenantAuthorityService.resolveCanonicalTenant(request.tenantId);
    if (!canonical) {
      return NextResponse.json(
        { ok: false, error: `Tenant '${request.tenantId}' not found or invalid.` },
        { status: 404 }
      );
    }

    let ctx;
    try {
      ctx = await resolvePortalContext(canonical.projectSlug);
    } catch (err: any) {
      if (err?.code === 'ORGANIZATION_ACCESS_DENIED' || err?.code === 'NO_SESSION' || err?.code === 'INVALID_SESSION') {
        return NextResponse.json(
          { ok: false, error: `Not authorized to access media requests for tenant '${canonical.projectSlug}'.` },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { ok: false, error: `Portal session validation failed: ${err?.message || 'unknown error'}` },
        { status: 401 }
      );
    }

    const authorizedSlug = ctx.organization.slug.toLowerCase();
    if (authorizedSlug !== request.tenantId.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Cross-tenant request inspection is forbidden.' },
        { status: 403 }
      );
    }

    // 3. Fetch generation attempts
    const attempts = await db
      .select()
      .from(hermesGenerationAttempts)
      .where(eq(hermesGenerationAttempts.requestId, id))
      .orderBy(hermesGenerationAttempts.attemptNumber);

    // 4. Fetch artifact if completed
    let artifact = null;
    if (request.artifactId) {
      const [art] = await db
        .select()
        .from(hermesArtifacts)
        .where(
          and(
            eq(hermesArtifacts.id, request.artifactId),
            eq(hermesArtifacts.tenantId, request.tenantId)
          )
        )
        .limit(1);

      if (art) {
        artifact = {
          id: art.id,
          cid: art.cid,
          mimeType: art.mimeType,
          sizeBytes: art.sizeBytes,
          sha256: art.sha256,
          createdAt: art.createdAt,
        };
      }
    }

    // 5. Aggregate financial breakdown
    const totalRawCostUsd = attempts.reduce((acc, att) => acc + Number(att.rawCostUsd || 0), 0);
    const totalMarkupCostUsd = attempts.reduce((acc, att) => acc + Number(att.markupCostUsd || 0), 0);
    const totalChargedUsd = attempts.reduce((acc, att) => acc + Number(att.totalChargedUsd || 0), 0);
    const totalComputeSeconds = attempts.reduce((acc, att) => acc + Number(att.computeSeconds || 0), 0);

    return NextResponse.json({
      ok: true,
      request: {
        id: request.id,
        tenantId: request.tenantId,
        capability: request.capability,
        prompt: request.prompt,
        status: request.status,
        provider: request.provider,
        idempotencyKey: request.idempotencyKey,
        correlationId: request.correlationId,
        artifactId: request.artifactId,
        failureCode: request.failureCode,
        failureMessage: request.failureMessage,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
      },
      attempts: attempts.map((att) => ({
        attemptNumber: att.attemptNumber,
        provider: att.provider,
        status: att.status,
        executionId: att.executionId,
        computeSeconds: att.computeSeconds,
        rawCostUsd: att.rawCostUsd,
        markupCostUsd: att.markupCostUsd,
        totalChargedUsd: att.totalChargedUsd,
        errorCode: att.errorCode,
        errorMessage: att.errorMessage,
        createdAt: att.createdAt,
        updatedAt: att.updatedAt,
      })),
      artifact,
      financialBreakdown: {
        totalComputeSeconds,
        totalRawCostUsd: Number(totalRawCostUsd.toFixed(6)),
        totalMarkupCostUsd: Number(totalMarkupCostUsd.toFixed(6)),
        totalChargedUsd: Number(totalChargedUsd.toFixed(6)),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Internal server error retrieving media request' },
      { status: 500 }
    );
  }
}
