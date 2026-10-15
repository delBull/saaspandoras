import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { hermesMediaRequests, hermesGenerationAttempts, hermesArtifacts } from '@saasfly/db/schema';
import { eq, and } from "@saasfly/db-core";
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { TenantAuthorityService } from '@saasfly/hermes-core';
import { checkTenantRateLimit, buildRateLimitHeaders } from '@saasfly/hermes-core';
import { integrationKeyMatchesTenant } from '@/lib/integrations/a2a-tenant-match';
import { enforceA2AEnvironment } from '@/lib/integrations/a2a-env';

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

    // 2. Validate tenant authority / portal session / API key (Fail-closed)
    const canonical = await TenantAuthorityService.resolveCanonicalTenant(request.tenantId);
    if (!canonical) {
      return NextResponse.json(
        { ok: false, error: `Tenant '${request.tenantId}' not found or invalid.` },
        { status: 404 }
      );
    }

    let authorizedSlug: string;
    let clientEnvironment: 'staging' | 'production' | undefined = undefined;
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (bearer && bearer.startsWith('sk_')) {
      try {
        const { IntegrationKeyService } = await import('@/lib/integrations/auth');
        const client = await IntegrationKeyService.validateKey(bearer);
        
        // H3: Authorize the key against the requested tenant (fail-closed). Handles the
        // 'pandoras' ecosystem-root sentinel (projectId 0) WITHOUT granting cross-tenant access.
        const isProjectMatch = client
          ? await integrationKeyMatchesTenant(client.projectId, canonical)
          : false;

        if (!client || !isProjectMatch) {
          return NextResponse.json(
            { ok: false, error: `Not authorized to access media requests for tenant '${canonical.projectSlug}'.` },
            { status: 403 }
          );
        }

        // H2: Scope check (Strict fail-closed: empty permissions denies operational access)
        const permissions = Array.isArray(client.permissions) ? (client.permissions as string[]) : [];
        const hasMediaPermission = 
          permissions.includes('hermes_a2a') ||
          permissions.includes('media:generate') ||
          permissions.includes('media:read') ||
          permissions.includes('media:create') ||
          permissions.includes('*');

        if (!hasMediaPermission) {
          return NextResponse.json(
            { ok: false, error: "FORBIDDEN_CAPABILITY", message: "FORBIDDEN_CAPABILITY: Integration Key lacks required capability for media inspection." },
            { status: 403 }
          );
        }

        authorizedSlug = canonical.projectSlug.toLowerCase();
        clientEnvironment = client.environment as 'staging' | 'production';
      } catch (keyErr) {
        return NextResponse.json(
          { ok: false, error: 'Failed to validate integration key.' },
          { status: 401 }
        );
      }
    } else if (bearer && bearer.startsWith('pk_')) {
      // H1: Reject public keys for media inspection
      return NextResponse.json(
        { ok: false, error: 'Public key (pk_) cannot be used for media inspection operations. Secret key (sk_) required.' },
        { status: 403 }
      );
    } else {
      let ctx;
      try {
        ctx = await resolvePortalContext(canonical.projectSlug);
        authorizedSlug = ctx.organization.slug.toLowerCase();
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
    }

    // H5: Environment allowlist enforcement (integration-key sessions).
    const envCheck = enforceA2AEnvironment(req, clientEnvironment);
    if (!envCheck.ok) {
      return NextResponse.json({ ok: false, error: envCheck.error }, { status: envCheck.status });
    }

    // H5: Tenant-scoped rate limiting (anti-abuse).
    const rl = checkTenantRateLimit(canonical.canonicalOrgId, 60, 60_000);
    const rlHeaders = buildRateLimitHeaders(rl);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Límite de solicitudes por minuto excedido para este tenant.', retryAfter: rl.retryAfterSeconds },
        { status: 429, headers: rlHeaders }
      );
    }

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
