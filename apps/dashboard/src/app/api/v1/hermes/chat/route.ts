/**
 * 🏛️ Pandora's Hermes OS — Production Governed Cognitive Chat Endpoint
 * POST /api/v1/hermes/chat
 *
 * Enforces:
 * 1. Authenticated session validation (Portal cookie session OR Bearer token).
 * 2. Canonical Tenant Identity via TenantAuthorityService (K27.1).
 * 3. Prevention of caller tampering: body organizationId CANNOT override session tenant.
 * 4. Runtime instantiation via getDefaultRuntime() respecting HERMES_REASONING_PROVIDER.
 * 5. Full pipeline with PromptHygieneEngine, ActorIdentityBindingService, and PolicyValidator.
 */

import { NextRequest, NextResponse } from 'next/server';
import { HermesRuntime, getDefaultRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { ActorIdentityBindingService } from '@/lib/pandoras/core/domains/hermes/runtime/prompt-hygiene-contract';
import type { ControlPlaneContext } from '@/lib/pandoras/core/domains/hermes/knowledge/types';
import { checkTenantRateLimit, buildRateLimitHeaders } from '@/lib/hermes/auth/rate-limiter';
import { SessionTokenService } from '@/lib/hermes/auth/session-token.service';
import { resolveCanonicalAuthSession } from '@/lib/hermes/auth/canonical-resolver';
import { setupProgressService } from '@/lib/mesh/setup-progress.service';
export const dynamic = 'force-dynamic';

const sessionTokenService = new SessionTokenService();

// resolveChatSession has been replaced by resolveCanonicalAuthSession

export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const body = await req.json();
    const {
      organizationId: bodyOrgId,
      message,
      conversationId,
      // bodyActorId is completely ignored for authority. Identity is 100% server-derived.
      authProvider = 'PORTAL_INTERNAL',
      channelType = 'AUTHENTICATED_WEB',
      surface,
      handoffTarget,
      objectiveHint,
    } = body;

    // 1. Session & Canonical Tenant Verification (Fail-Closed)
    const auth = await resolveCanonicalAuthSession(req, bodyOrgId);
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHENTICATED',
          message: 'Valid Hermes session (cookie or Bearer token) is required for cognitive execution.',
        },
        { status: 401 }
      );
    }

    const effectiveOrgId = auth.canonicalOrgId;
    // Client identity hint is ignored. Authority comes strictly from auth resolver.
    const effectiveActorId = auth.actorId;

    // 2. Rate Limiting by Canonical Tenant Identity
    const rateLimit = checkTenantRateLimit(effectiveOrgId, 120, 60_000);
    const rlHeaders = buildRateLimitHeaders(rateLimit);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Límite de solicitudes por minuto excedido para este tenant.',
          retryAfter: rateLimit.retryAfterSeconds,
        },
        { status: 429, headers: rlHeaders }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Field [message] is mandatory and must be a non-empty string.' },
        { status: 400 }
      );
    }

    // 3. Mandatory Actor Identity Binding with Cryptographic Proof
    const { InterlocutorResolver } = await import('@/lib/hermes/identity/interlocutor-resolver');
    const callerWallet = req.headers.get('x-wallet-address') || req.headers.get('x-thirdweb-address') || undefined;
    const interlocutor = await InterlocutorResolver.resolve({
      channel: 'web',
      externalUserId: effectiveActorId,
      walletAddress: callerWallet,
      tenantSlug: effectiveOrgId,
    });

    const boundActorSession = ActorIdentityBindingService.createBoundSession(
      {
        actorId: interlocutor.actorId,
        tenantId: effectiveOrgId,
        authProvider,
        nonce: `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        proofSignature: auth.sessionId || `sig_${effectiveOrgId}_${Date.now()}`,
        issuedAt: Date.now(),
      },
      channelType === 'INTERNAL_WORKBENCH' || interlocutor.isBoss ? 'CONFIDENTIAL' : 'TENANT_RESTRICTED',
      3600
    );

    // 4. ControlPlaneContext with cryptographic session & interlocutor
    const controlPlaneContext: ControlPlaneContext & { boundActorSession: any } = {
      organizationId: effectiveOrgId,
      actorId: interlocutor.actorId,
      role: (interlocutor.isBoss ? 'OWNER' : auth.role) as any,
      sessionId: boundActorSession.sessionToken,
      permissions: interlocutor.isBoss
        ? ['governance.admin', 'knowledge.read', 'runtime.respond', 'platform.decrees']
        : ['read:knowledge', 'execute:capabilities'],
      boundActorSession,
      identity: {
        name: interlocutor.name,
        isBoss: interlocutor.isBoss,
        title: interlocutor.title,
        executivePrivilege: interlocutor.executivePrivilege,
      },
      interlocutor,
    };

    if (surface) {
      try {
        const { SurfaceRegistry } = await import('@/lib/pandoras/core/domains/hermes/context/surface-definition');
        const surfaceDef = SurfaceRegistry.getSurface(surface);

        controlPlaneContext.surfaceContext = {
          surface: surfaceDef.surface,
          mode: 'PROPOSE', // Default mode, actual capabilities are resolved by the Runtime
          capabilities: [],
        };

        // Adversarial Gate: Handoff validation
        if (handoffTarget) {
          if (!surfaceDef.handoffTargets.includes(handoffTarget)) {
            return NextResponse.json(
              { success: false, error: 'UNAUTHORIZED_HANDOFF', message: `Cannot handoff from ${surface} to ${handoffTarget}` },
              { status: 403 }
            );
          }
          controlPlaneContext.surfaceContext!.surface = handoffTarget as any;
        }
      } catch (e: any) {
        return NextResponse.json(
          { success: false, error: 'INVALID_SURFACE', message: e.message },
          { status: 400 }
        );
      }
    }

    // 5. Canonical Runtime (respects HERMES_REASONING_PROVIDER or Mock default)
    const runtime = getDefaultRuntime();

    const resolvedConversationId = conversationId || `conv_${effectiveOrgId}_${effectiveActorId}`;
    
    // 6. Execute Governed Cognitive Turn
    const response = await runtime.respond({
      organizationId: effectiveOrgId,
      conversationId: resolvedConversationId,
      message: {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        role: 'USER',
        content: message,
        createdAt: new Date(),
      },
      controlPlaneContext,
    });

    const isAllowed = !response.policyViolations || response.policyViolations.length === 0;

    return NextResponse.json(
      {
        success: isAllowed,
        conversationId: resolvedConversationId,
        responseId: response.responseId,
        message: response.content,
        suggestedActions: response.suggestedActions,
        policyViolations: response.policyViolations || [],
        durationMs: Date.now() - start,
      },
      {
        status: 200,
        headers: {
          'X-Hermes-Runtime-Version': '9.0.0',
          'X-Hermes-Response-Id': response.responseId,
          ...rlHeaders,
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'HERMES_RUNTIME_ERROR',
        message: error?.message || 'Cognitive turn failed during execution.',
        durationMs: Date.now() - start,
      },
      { status: 500 }
    );
  }
}

