import { NextRequest, NextResponse } from 'next/server';
import { HermesRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { OllamaReasoningProvider } from '@/lib/pandoras/core/domains/hermes/runtime/reasoning-providers';
import { ActorIdentityBindingService } from '@/lib/pandoras/core/domains/hermes/runtime/prompt-hygiene-contract';
import { hermesConversations } from '@/db/schema';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { checkTenantRateLimit, buildRateLimitHeaders } from '@/lib/hermes/auth/rate-limiter';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/hermes/tenants/[tenantId]/chat
 * 
 * Channel Mesh Telegram Adapter for HermesRuntime.
 * Called by pandoras-edge-api. Requires HERMES_CHANNEL_SECRET header for auth.
 * 
 * Returns:
 *   - message: string — Hermes response text
 *   - escalated: boolean — whether the conversation was paused for human review
 *   - escalationId: string | null
 *   - policyViolations: string[]
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const start = Date.now();

  try {
    // 1. Channel Authentication — Tenant Secret
    const channelSecret = req.headers.get('x-hermes-channel-secret');
    const expectedSecret = process.env.HERMES_CHANNEL_SECRET;
    if (expectedSecret && channelSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Invalid channel secret.' },
        { status: 401 }
      );
    }

    const { tenantId } = await params;

    // Rate Limiting (Per-Tenant anti-abuse protection)
    const rateLimit = checkTenantRateLimit(tenantId, 120, 60_000);
    const rlHeaders = buildRateLimitHeaders(rateLimit);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Límite de solicitudes por minuto excedido para este canal/tenant.',
          retryAfter: rateLimit.retryAfterSeconds,
        },
        { status: 429, headers: rlHeaders }
      );
    }

    const body = await req.json();

    const {
      message,
      conversationId,
      actorId = 'tg_anonymous',
      channelType = 'TELEGRAM',
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'INVALID_REQUEST', message: 'Field [message] is mandatory.' },
        { status: 400 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'INVALID_REQUEST', message: 'Field [conversationId] is mandatory.' },
        { status: 400 }
      );
    }

    // 2. Guard: Check if conversation is PAUSED_HUMAN — do not process with Hermes if so
    let convStatus: string = 'ACTIVE';
    try {
      const [conv] = await db
        .select()
        .from(hermesConversations)
        .where(
          and(
            eq(hermesConversations.organizationId, tenantId),
            eq(hermesConversations.conversationId, conversationId)
          )
        )
        .limit(1);
      if (conv) {
        convStatus = conv.status;
      }
    } catch (_) {
      // table may be missing in dev — proceed
    }

    if (convStatus === 'PAUSED_HUMAN') {
      return NextResponse.json({
        success: true,
        message: '🤝 Un operador del equipo de S\'Narai está atendiendo tu consulta en este momento. Por favor, espera nuestra respuesta.',
        escalated: true,
        escalationId: null,
        policyViolations: [],
        durationMs: Date.now() - start,
      });
    }

    // 3. Mandatory Actor Identity Binding
    const boundActorSession = ActorIdentityBindingService.createBoundSession(
      {
        actorId,
        tenantId,
        authProvider: 'TELEGRAM_INIT_DATA',
        nonce: `tg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        proofSignature: `sig_tg_${tenantId}_${Date.now()}`,
        issuedAt: Date.now(),
      },
      'TENANT_RESTRICTED',
      3600
    );

    // 4. ControlPlaneContext
    const controlPlaneContext = {
      organizationId: tenantId,
      actorId,
      role: 'VIEWER' as const,
      sessionId: boundActorSession.sessionToken,
      permissions: ['read:knowledge', 'execute:capabilities'] as string[],
      boundActorSession,
    };

    // 5. Execute Hermes Cognitive Turn
    const provider = new OllamaReasoningProvider();
    const runtime = new HermesRuntime(provider);

    const response = await runtime.respond({
      organizationId: tenantId,
      conversationId,
      message: {
        id: `msg_tg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        role: 'USER',
        content: message,
        createdAt: new Date(),
      },
      controlPlaneContext,
    });

    const isAllowed = !response.policyViolations || response.policyViolations.length === 0;

    // 6. Check if Hermes decided to escalate
    const hermesEscalated = response.suggestedActions?.some(
      (a: any) => a.type === 'ESCALATE_TO_HUMAN' || a.action === 'ESCALATE_TO_HUMAN'
    ) ?? false;

    // 7. Detect user-initiated escalation intents in the message
    const escalationKeywords = [
      'quiero hablar con una persona', 'hablar con humano', 'hablar con alguien',
      'quiero hablar con alguien', 'necesito un asesor', 'asesor humano',
      'comunicarme con el equipo', 'hablar con el equipo', 'agente humano',
      'representante', 'quiero más información con alguien',
    ];
    const messageLower = message.toLowerCase();
    const userRequestsHuman = escalationKeywords.some(kw => messageLower.includes(kw));

    const shouldEscalate = hermesEscalated || userRequestsHuman || !isAllowed;

    let escalationId: string | null = null;

    if (shouldEscalate) {
      // Trigger escalation via internal API (avoid circular imports — use db directly)
      try {
        const { EscalationService } = await import('@/lib/hermes/escalation/escalation-service');
        const escalation = await EscalationService.triggerEscalation({
          organizationId: tenantId,
          conversationId,
          actorId,
          channel: 'TELEGRAM',
          reason: userRequestsHuman ? 'USER_REQUEST' : hermesEscalated ? 'KNOWLEDGE_GAP' : 'POLICY_VIOLATION',
          notes: `Escalation triggered from Telegram channel. Message: "${message.slice(0, 200)}"`,
        });
        escalationId = escalation.id;
      } catch (e) {
        console.error('[TenantChat] Failed to trigger escalation:', e);
      }

      return NextResponse.json(
        {
          success: true,
          message: '🤝 Gracias por comunicarte. Un especialista del equipo S\'Narai se pondrá en contacto contigo a la brevedad para atender tu consulta personalizada.',
          escalated: true,
          escalationId,
          policyViolations: response.policyViolations || [],
          durationMs: Date.now() - start,
        },
        { headers: rlHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: response.content,
        escalated: false,
        escalationId: null,
        suggestedActions: response.suggestedActions,
        policyViolations: response.policyViolations || [],
        durationMs: Date.now() - start,
      },
      { headers: rlHeaders }
    );

  } catch (error: any) {
    console.error('[TenantChat] Error:', error?.message);
    return NextResponse.json(
      {
        success: false,
        error: 'HERMES_RUNTIME_ERROR',
        message: 'Nuestro asistente tuvo un problema procesando tu mensaje. Por favor, intenta de nuevo en un momento.',
        durationMs: Date.now() - start,
      },
      { status: 500 }
    );
  }
}
