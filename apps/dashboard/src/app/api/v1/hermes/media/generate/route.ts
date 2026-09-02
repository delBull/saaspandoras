import { NextRequest, NextResponse } from 'next/server';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { A2AOutboundDispatcher } from '@/lib/pandoras/core/domains/hermes/a2a/a2a-outbound-dispatcher';
import { TenantAuthorityService } from '@/lib/pandoras/core/domains/hermes/tenants/tenant-authority';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { db } from '@/db';
import { hermesMediaRequests } from '@/db/schema';
import { TenantCreditLedgerService } from '@/lib/hermes/compute/tenant-credit-ledger.service';

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
    const { tenantId, capability, prompt, options, isSandbox = false } = body;

    if (!tenantId || !capability || !prompt) {
      return NextResponse.json(
        { ok: false, error: 'tenantId, capability, and prompt are required' },
        { status: 400 }
      );
    }

    // ── Tenant Authority Boundary (server-side, fail-closed) ───────────────
    // 1. Resolve the requested tenant to a canonical project server-side.
    const canonical = await TenantAuthorityService.resolveCanonicalTenant(tenantId);
    if (!canonical) {
      return NextResponse.json(
        { ok: false, error: `Tenant '${tenantId}' does not exist or is not provisioned.` },
        { status: 404 }
      );
    }

    // 2. Validate the caller's portal session is authorized for this tenant.
    //    The portal session cookie is the source of truth — never the client body.
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

    // Reconcile canonical slug form with the portal-authorized org.
    const authorizedSlug = ctx.organization.slug;
    const normalizedTenant = authorizedSlug.toLowerCase();

    // 3. Fail-closed CapabilityGrant check for this tenant.
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

    // 3b. Verify Credit Balance (Serverless Pay-per-event with Markup)
    const estimatedRawCost = 0.02; // ~$0.02 base RunPod compute cost per image
    const creditCheck = await TenantCreditLedgerService.hasSufficientBalance(
      normalizedTenant,
      estimatedRawCost,
      isSandbox
    );

    if (!creditCheck.sufficient) {
      return NextResponse.json(
        {
          ok: false,
          error: `Saldo insuficiente en créditos ${isSandbox ? 'de prueba (Sandbox)' : 'de producción'}. Saldo disponible: $${creditCheck.balance.toFixed(4)} USD, requerido: $${creditCheck.estimatedCharge.toFixed(4)} USD.`,
          code: 'INSUFFICIENT_CREDITS',
          requiresTopup: true,
          balance: creditCheck.balance,
          estimatedCharge: creditCheck.estimatedCharge,
          isSandbox,
        },
        { status: 402 }
      );
    }

    // 4. Create Asynchronous Media Request Record.
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const correlationId = `corr_${requestId}`;

    // Settle usage atomically from active credit balance
    await TenantCreditLedgerService.settleUsage(normalizedTenant, {
      requestId,
      capability,
      provider: 'runpod',
      executionSeconds: 10.0,
      rawCostUsd: estimatedRawCost,
      isSandbox,
      metadata: { prompt },
    });

    try {
      if (db) {
        await db.insert(hermesMediaRequests).values({
          id: requestId,
          requestId,
          correlationId,
          tenantId: normalizedTenant,
          capability,
          requestedBy: ctx.tenant.actorId,
          provider: 'runpod',
          status: 'REQUESTED',
          prompt,
          briefJson: { ...(options || {}), isSandbox },
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.warn('[MediaGenerateAPI] DB insert warning:', err);
    }

    // 5. Sanitize options to prevent protocol parameter injection.
    //    Any key in RESERVED_PROTOCOL_FIELDS is hard-dropped from what reaches Sofía.
    const safeOptions = Object.fromEntries(
      Object.entries((options || {}) as Record<string, any>).filter(
        ([key]) => !RESERVED_PROTOCOL_FIELDS.has(key.toLowerCase())
      )
    );

    const dispatchPayload = {
      capability,
      prompt,
      ...safeOptions,
      requestId,
      tenantId: normalizedTenant,
      isSandbox,
    };

    const actorRef = ctx.tenant.actorId;

    // Fire A2A dispatch in background / non-blocking
    A2AOutboundDispatcher.sendToSofia('capability.request', dispatchPayload, {
      tenantId: normalizedTenant,
      correlationId,
    }).catch(err => {
      console.error(`[MediaGenerateAPI] Async dispatch error for actor ${actorRef}:`, err);
    });

    // 6. Return Immediate 202 Accepted Response with Tracking IDs.
    return NextResponse.json(
      {
        ok: true,
        requestId,
        tenantId: normalizedTenant,
        status: 'REQUESTED',
        capability,
        correlationId,
        message: `Media generation request '${requestId}' dispatched to Media Co (Sofía). Processing in background.`,
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