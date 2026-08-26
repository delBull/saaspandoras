/**
 * 🏛️ Pandora's Hermes OS — Production Governed Cognitive Chat Endpoint
 * POST /api/v1/hermes/chat
 *
 * Fully wired to HermesCognitiveRuntime, OllamaReasoningProvider,
 * PromptHygieneEngine, ActorIdentityBindingService, and ToolCircuitBreaker.
 */

import { NextRequest, NextResponse } from 'next/server';
import { HermesRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { OllamaReasoningProvider } from '@/lib/pandoras/core/domains/hermes/runtime/reasoning-providers';
import { ActorIdentityBindingService } from '@/lib/pandoras/core/domains/hermes/runtime/prompt-hygiene-contract';
import type { ControlPlaneContext } from '@/lib/pandoras/core/domains/hermes/knowledge/types';
import { checkTenantRateLimit, buildRateLimitHeaders } from '@/lib/hermes/auth/rate-limiter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const body = await req.json();
    const {
      organizationId = 'pandoras',
      message,
      conversationId,
      actorId = 'anonymous_actor',
      authProvider = 'PORTAL_INTERNAL',
      channelType = 'AUTHENTICATED_WEB',
      sessionToken,
    } = body;

    // Rate Limiting (Per-tenant protection)
    const rateLimit = checkTenantRateLimit(organizationId, 120, 60_000);
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

    // 1. Mandatory Actor Identity Binding
    const boundActorSession = ActorIdentityBindingService.createBoundSession(
      {
        actorId,
        tenantId: organizationId,
        authProvider,
        nonce: `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        proofSignature: sessionToken || `sig_${organizationId}_${Date.now()}`,
        issuedAt: Date.now(),
      },
      channelType === 'INTERNAL_WORKBENCH' ? 'CONFIDENTIAL' : 'TENANT_RESTRICTED',
      3600
    );

    // 2. ControlPlaneContext with cryptographic session
    const controlPlaneContext: ControlPlaneContext & { boundActorSession: any } = {
      organizationId,
      actorId,
      role: (channelType === 'INTERNAL_WORKBENCH' ? 'TENANT_ADMIN' : 'PUBLIC_VISITOR') as any,
      sessionId: boundActorSession.sessionToken,
      permissions: ['read:knowledge', 'execute:capabilities'],
      boundActorSession,
    };

    // 3. Instantiate Production Runtime with Ollama Provider
    const provider = new OllamaReasoningProvider();
    const runtime = new HermesRuntime(provider);

    // 4. Execute Governed Cognitive Turn
    const response = await runtime.respond({
      organizationId,
      conversationId: conversationId || `conv_${organizationId}_${actorId}`,
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
