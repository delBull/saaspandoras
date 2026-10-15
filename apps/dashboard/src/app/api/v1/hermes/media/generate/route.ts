import { NextRequest, NextResponse } from 'next/server';
import { CapabilityGrantService } from '@saasfly/hermes-core';
import { TenantAuthorityService } from '@saasfly/hermes-core';
import { checkTenantRateLimit, buildRateLimitHeaders } from '@saasfly/hermes-core';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { integrationKeyMatchesTenant } from '@/lib/integrations/a2a-tenant-match';
import { enforceA2AEnvironment } from '@/lib/integrations/a2a-env';
import {
  HermesMediaOrchestratorService,
  type MediaProviderOption,
} from '@saasfly/hermes-core';

export const dynamic = 'force-dynamic';

// Reserved protocol fields that a tenant MAY NOT overwrite via `options`.
const RESERVED_PROTOCOL_FIELDS = new Set([
  'protocol',
  'version',
  'messageId',
  'correlationId',
  'from',
  'to',
  'type',
  'createdAt',
  'expiresAt',
  'nonce',
  'security',
  'requestId',
  'tenantId',
  'capability',
  'prompt',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      capability,
      prompt,
      options,
      isSandbox = false,
      provider = 'auto',
      wait = false,
      idempotencyKey,
    } = body;

    if (!tenantId || !capability || !prompt) {
      return NextResponse.json(
        { ok: false, error: 'tenantId, capability, and prompt are required' },
        { status: 400 }
      );
    }

    // Validate provider parameter (F5-10, F5-11, F5-12)
    const validProviders: MediaProviderOption[] = ['auto', 'sofia', 'runpod'];
    if (provider && !validProviders.includes(provider as MediaProviderOption)) {
      return NextResponse.json(
        { ok: false, error: `Invalid provider '${provider}'. Supported providers: 'auto', 'sofia', 'runpod'.` },
        { status: 400 }
      );
    }

    // ── Tenant Authority Boundary (server-side, fail-closed) ───────────────
    const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantId);
    if (!canonical) {
      return NextResponse.json(
        { ok: false, error: `Tenant '${tenantId}' does not exist or is not provisioned.` },
        { status: 404 }
      );
    }

    // Portal session or Developer Integration Key validation
    let authorizedSlug: string | null = null;
    let actorId: string | undefined = undefined;
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

        if (client && isProjectMatch) {
          // H2: Scope / Permission check (Strict fail-closed: empty permissions denies operational access)
          const permissions = Array.isArray(client.permissions) ? (client.permissions as string[]) : [];
          const hasMediaPermission = 
            permissions.includes('hermes_a2a') ||
            permissions.includes('media:generate') ||
            permissions.includes('media:create') ||
            permissions.includes('*');

          if (!hasMediaPermission) {
            return NextResponse.json(
              { ok: false, error: "FORBIDDEN_CAPABILITY", message: "FORBIDDEN_CAPABILITY: Integration Key lacks required capability 'media:generate'." },
              { status: 403 }
            );
          }

          authorizedSlug = canonical.projectSlug;
          actorId = `integration_client:${client.id}`;
          clientEnvironment = client.environment as 'staging' | 'production';
        } else {
          return NextResponse.json(
            { ok: false, error: `Invalid integration key or key does not match tenant '${canonical.projectSlug}'.` },
            { status: 403 }
          );
        }
      } catch (keyErr) {
        return NextResponse.json(
          { ok: false, error: 'Failed to validate integration key.' },
          { status: 401 }
        );
      }
    } else if (bearer && bearer.startsWith('pk_')) {
      // H1: Reject public keys for media generation
      return NextResponse.json(
        { ok: false, error: 'Public key (pk_) cannot be used for media generation operations. Secret key (sk_) required.' },
        { status: 403 }
      );
    } else {
      let ctx;
      try {
        ctx = await resolvePortalContext(canonical.projectSlug);
        authorizedSlug = ctx.organization.slug;
        actorId = ctx.tenant?.actorId;
      } catch (err: any) {
        if (err?.code === 'ORGANIZATION_ACCESS_DENIED' || err?.code === 'NO_SESSION' || err?.code === 'INVALID_SESSION') {
          return NextResponse.json(
            { ok: false, error: `Not authorized to generate media for tenant '${canonical.projectSlug}'.` },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { ok: false, error: `Portal session validation failed: ${err?.message || 'unknown error'}` },
          { status: 401 }
        );
      }
    }

    if (!authorizedSlug) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    // H5: Environment allowlist enforcement (integration-key sessions).
    const envCheck = enforceA2AEnvironment(req, clientEnvironment);
    if (!envCheck.ok) {
      return NextResponse.json({ ok: false, error: envCheck.error }, { status: envCheck.status });
    }

    // H5: Tenant-scoped rate limiting (anti-abuse). Media generation is cost-bearing.
    const rl = checkTenantRateLimit(canonical.canonicalOrgId, 20, 60_000);
    const rlHeaders = buildRateLimitHeaders(rl);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Límite de generación de media por minuto excedido para este tenant.', retryAfter: rl.retryAfterSeconds },
        { status: 429, headers: rlHeaders }
      );
    }

    const normalizedTenant = authorizedSlug.toLowerCase();

    // Capability check
    const isGranted = await CapabilityGrantService.isCapabilityGranted(normalizedTenant, capability);
    if (!isGranted) {
      return NextResponse.json(
        {
          ok: false,
          error: `Capability '${capability}' is not granted for tenant '${normalizedTenant}'. Request access in Hermes Tenants Governance.`,
          code: 'CAPABILITY_NOT_GRANTED',
        },
        { status: 403 }
      );
    }

    // Sanitize options
    const safeOptions = Object.fromEntries(
      Object.entries((options || {}) as Record<string, any>).filter(
        ([key]) => !RESERVED_PROTOCOL_FIELDS.has(key.toLowerCase())
      )
    );

    // 1. Create or retrieve durable MediaRequest (F5-1, F5-9)
    const { request, isNew } = await HermesMediaOrchestratorService.createOrGetMediaRequest(normalizedTenant, {
      capability,
      prompt,
      options: safeOptions,
      provider: provider as MediaProviderOption,
      idempotencyKey,
      isSandbox,
      actorId,
    });

    // 2. F5-5: Shared execution engine across wait=true and wait=false
    if (wait) {
      const result = await HermesMediaOrchestratorService.executeGeneration(normalizedTenant, request.id, {
        capability,
        prompt,
        options: safeOptions,
        provider: provider as MediaProviderOption,
        idempotencyKey,
        isSandbox,
        actorId,
      });

      return NextResponse.json(
        {
          ok: result.ok,
          requestId: request.id,
          status: result.status,
          provider: result.provider,
          attemptCount: result.attemptCount,
          artifactId: result.artifactId,
          artifact: result.artifact,
          financialBreakdown: result.financialBreakdown,
          error: result.error,
          isIdempotentReplay: result.isIdempotentReplay,
        },
        { status: result.ok ? 200 : (result.status === 'UNKNOWN' ? 504 : 500) }
      );
    }

    // Background asynchronous execution (wait=false)
    HermesMediaOrchestratorService.executeGeneration(normalizedTenant, request.id, {
      capability,
      prompt,
      options: safeOptions,
      provider: provider as MediaProviderOption,
      idempotencyKey,
      isSandbox,
      actorId,
    }).catch((err) => {
      console.error(`[MediaGenerateAPI] Async execution error for request ${request.id}:`, err);
    });

    return NextResponse.json(
      {
        ok: true,
        requestId: request.id,
        tenantId: normalizedTenant,
        status: request.status,
        capability,
        provider,
        correlationId: request.correlationId,
        message: `Media generation request '${request.id}' registered. Processing with provider '${provider}'.`,
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Internal server error processing media generation' },
      { status: 500 }
    );
  }
}