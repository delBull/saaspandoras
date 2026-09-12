import { NextRequest, NextResponse } from 'next/server';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { TenantAuthorityService } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import {
  HermesMediaOrchestratorService,
  type MediaProviderOption,
} from '@/lib/hermes/media/hermes-media-orchestrator.service';

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

    // Portal session validation
    let ctx;
    try {
      ctx = await resolvePortalContext(canonical.projectSlug);
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

    const authorizedSlug = ctx.organization.slug;
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
      actorId: ctx.tenant.actorId,
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
        actorId: ctx.tenant.actorId,
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
      actorId: ctx.tenant.actorId,
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